import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import "../styles.css";
import { useAuth } from "../context/AuthContext.js";
import Icon from "../components/Icon.js";
import Swatch, { getProductSwatch } from "../components/Swatch.js";

type HealthState = "checking" | "ok" | "down";
type QueueState = string;
type OrderStatus = "CONFIRMED" | "FAILED" | undefined;
type SortOption =
  | "featured"
  | "name-asc"
  | "price-asc"
  | "price-desc"
  | "stock-desc"
  | "stock-asc";

interface Product {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface ProductsResponse {
  products: Product[];
}

interface FlashSaleOrderResponse {
  status: "QUEUED" | "DUPLICATE" | "IN_FLIGHT";
  message?: string;
  jobId?: string;
  idempotencyKey?: string;
}

interface ApiOrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceCents: number;
  product: { id: string; name: string; sku: string };
}

interface ApiOrder {
  id: string;
  queueJobId: string;
  userId: string;
  status: "CONFIRMED" | "FAILED";
  failureReason: string | null;
  items: ApiOrderItem[];
  createdAt: string;
  updatedAt: string;
}

interface JobStatusResponse {
  jobId: string;
  queueState: QueueState;
  order: ApiOrder | null;
}

interface TrackedOrder {
  jobId: string;
  idempotencyKey: string;
  items: CartItem[];
  userId: string;
  queueState: QueueState;
  orderStatus: OrderStatus;
  failureReason?: string;
  lastUpdatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const RAZORPAY_BUSINESS_NAME = import.meta.env.VITE_RAZORPAY_BUSINESS_NAME ?? "ShopSphere";
const POLL_INTERVAL_MS = 2000;

interface RazorpayPaymentResult {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

interface ShippingAddress {
  id: string;
  fullName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const terminalQueueStates = new Set(["completed", "failed"]);

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "price-asc", label: "Price Low-High" },
  { value: "price-desc", label: "Price High-Low" },
  { value: "stock-desc", label: "Stock High-Low" },
  { value: "stock-asc", label: "Stock Low-High" },
];

const toCurrency = (priceCents: number): string => {
  return currency.format(priceCents / 100);
};

const clampQuantity = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.min(10, Math.floor(value)));
};

const compactValue = (value: string, maxLength = 18): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
};

const buildIdempotencyKey = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `ui-${crypto.randomUUID()}`;
  }

  return `ui-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const mergeTrackedOrders = (
  current: TrackedOrder[],
  updates: TrackedOrder[],
): TrackedOrder[] => {
  const merged = new Map<string, TrackedOrder>();

  for (const order of current) {
    merged.set(order.jobId, order);
  }

  for (const order of updates) {
    const previous = merged.get(order.jobId);

    if (previous) {
      merged.set(order.jobId, {
        ...previous,
        ...order,
      });
    } else {
      merged.set(order.jobId, order);
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt))
    .slice(0, 40);
};

const toneForOrder = (
  queueState: QueueState,
  orderStatus: OrderStatus,
): "good" | "warn" | "danger" | "info" => {
  if (orderStatus === "CONFIRMED") {
    return "good";
  }

  if (orderStatus === "FAILED") {
    return "danger";
  }

  const normalizedState = queueState.toLowerCase();

  if (normalizedState.includes("complete")) {
    return "good";
  }

  if (normalizedState.includes("fail")) {
    return "danger";
  }

  if (
    normalizedState.includes("active") ||
    normalizedState.includes("wait") ||
    normalizedState.includes("delay") ||
    normalizedState.includes("reuse")
  ) {
    return "warn";
  }

  return "info";
};

const prettyState = (queueState: QueueState): string => {
  return queueState.replace(/-/g, " ").toUpperCase();
};

const getUrgencyMeta = (
  stock: number,
): { label: string; tone: "danger" | "warn" | "info" | "good" } => {
  if (stock <= 0) {
    return { label: "Offline", tone: "danger" };
  }

  if (stock <= 10) {
    return { label: "Critical", tone: "danger" };
  }

  if (stock <= 50) {
    return { label: "Hot", tone: "warn" };
  }

  if (stock <= 200) {
    return { label: "Warm", tone: "info" };
  }

  return { label: "Stable", tone: "good" };
};

const mapSnapshotToOrder = (
  snapshot: JobStatusResponse,
  previous?: TrackedOrder,
): TrackedOrder => {
  const items: CartItem[] =
    previous?.items ??
    snapshot.order?.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })) ??
    [];

  return {
    jobId: snapshot.jobId,
    idempotencyKey: previous?.idempotencyKey ?? "lookup",
    items,
    userId: previous?.userId ?? snapshot.order?.userId ?? "unknown",
    queueState: snapshot.queueState,
    orderStatus: snapshot.order?.status ?? previous?.orderStatus,
    failureReason:
      snapshot.order?.failureReason ?? previous?.failureReason ?? undefined,
    lastUpdatedAt: new Date().toISOString(),
  };
};

const parseJSON = async <T,>(response: Response): Promise<T> => {
  return (await response.json()) as T;
};

const openRazorpayModal = (
  keyId: string,
  razorpayOrderId: string,
  amountCents: number,
  userEmail: string,
  description: string,
): Promise<RazorpayPaymentResult> => {
  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: amountCents,
      currency: "INR",
      name: RAZORPAY_BUSINESS_NAME,
      description,
      order_id: razorpayOrderId,
      prefill: { email: userEmail },
      theme: { color: "#6750A4" },
      handler: (response: Record<string, string>) => {
        resolve({
          razorpayOrderId: response["razorpay_order_id"] ?? razorpayOrderId,
          razorpayPaymentId: response["razorpay_payment_id"] ?? "",
          razorpaySignature: response["razorpay_signature"] ?? "",
        });
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
    };
    new window.Razorpay(options).open();
  });
};

function MarketplacePage() {
  const { user, token } = useAuth();
  const [health, setHealth] = useState<HealthState>("checking");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>(() => {
    try {
      const stored = localStorage.getItem("ss_order_relay");
      return stored ? (JSON.parse(stored) as TrackedOrder[]) : [];
    } catch {
      return [];
    }
  });
  const trackedOrdersRef = useRef<TrackedOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem("ss_cart");
      return stored ? (JSON.parse(stored) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [userId, setUserId] = useState("shopper-001");
  const [quantityByProduct, setQuantityByProduct] = useState<
    Record<string, number>
  >({});
  const [activeMessage, setActiveMessage] = useState(
    "Queue is live. Build a cart or quick-queue a flash order.",
  );
  const [placingProductId, setPlacingProductId] = useState<string | null>(null);
  const [checkouting, setCheckouting] = useState(false);
  const [lookupJobId, setLookupJobId] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (user?.email) {
      setUserId(user.id);
      return;
    }
    setUserId("shopper-001");
  }, [user]);

  useEffect(() => {
    if (!user || !token) { setAddresses([]); setSelectedAddressId(""); return; }
    fetch(`${API_BASE}/api/addresses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json() as Promise<{ addresses: ShippingAddress[] }>)
      .then((data) => {
        setAddresses(data.addresses);
        const def = data.addresses.find((a) => a.isDefault);
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => {});
  }, [user, token]);

  useEffect(() => {
    trackedOrdersRef.current = trackedOrders;
    try {
      localStorage.setItem("ss_order_relay", JSON.stringify(trackedOrders));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [trackedOrders]);

  useEffect(() => {
    try {
      localStorage.setItem("ss_cart", JSON.stringify(cart));
    } catch {
      // storage quota exceeded — ignore
    }
  }, [cart]);

  const loadProducts = useCallback(async (silent: boolean) => {
    if (!silent) {
      setProductsLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE}/api/products`);

      if (!response.ok) {
        throw new Error(`Products API failed (${response.status})`);
      }

      const payload = await parseJSON<ProductsResponse>(response);
      setProducts(payload.products);

      setQuantityByProduct((previous) => {
        const next = { ...previous };

        for (const product of payload.products) {
          if (next[product.id] == null) {
            next[product.id] = 1;
          }
        }

        return next;
      });

      setProductsError("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not fetch products";
      setProductsError(message);
    } finally {
      if (!silent) {
        setProductsLoading(false);
      }
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      setHealth(response.ok ? "ok" : "down");
    } catch {
      setHealth("down");
    }
  }, []);

  const refreshTrackedOrders = useCallback(async () => {
    const candidates = trackedOrdersRef.current.filter((order) => {
      const terminal = terminalQueueStates.has(order.queueState.toLowerCase());
      return !terminal || order.orderStatus == null;
    });

    if (candidates.length === 0) {
      return;
    }

    const snapshots = await Promise.all(
      candidates.map(async (order) => {
        try {
          const response = await fetch(
            `${API_BASE}/api/flash-sale/order/${order.jobId}`,
          );

          if (!response.ok) {
            return null;
          }

          return await parseJSON<JobStatusResponse>(response);
        } catch {
          return null;
        }
      }),
    );

    const updateMap = new Map<string, JobStatusResponse>();

    for (const snapshot of snapshots) {
      if (snapshot) {
        updateMap.set(snapshot.jobId, snapshot);
      }
    }

    if (updateMap.size === 0) {
      return;
    }

    setTrackedOrders((previous) => {
      const updates: TrackedOrder[] = [];

      for (const order of previous) {
        const snapshot = updateMap.get(order.jobId);

        if (snapshot) {
          updates.push(mapSnapshotToOrder(snapshot, order));
        }
      }

      return mergeTrackedOrders(previous, updates);
    });
  }, []);

  useEffect(() => {
    const tick = async (silent: boolean) => {
      await Promise.all([
        checkHealth(),
        loadProducts(silent),
        refreshTrackedOrders(),
      ]);
    };

    void tick(false);

    const intervalId = window.setInterval(() => {
      void tick(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [checkHealth, loadProducts, refreshTrackedOrders]);

  const enqueueOrder = useCallback(
    async (
      items: CartItem[],
      normalizedUserId: string,
      idempotencyKey: string,
      payment: RazorpayPaymentResult,
      shippingAddressId?: string,
    ): Promise<FlashSaleOrderResponse> => {
      const response = await fetch(`${API_BASE}/api/flash-sale/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          userId: normalizedUserId,
          items,
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpaySignature: payment.razorpaySignature,
          ...(shippingAddressId ? { shippingAddressId } : {}),
        }),
      });

      const payload = await parseJSON<FlashSaleOrderResponse>(response);

      if (!response.ok) {
        throw new Error(
          payload.message ?? `Order request failed (${response.status})`,
        );
      }

      return payload;
    },
    [],
  );

  const registerTrackedOrder = useCallback(
    (
      items: CartItem[],
      normalizedUserId: string,
      idempotencyKey: string,
      payload: FlashSaleOrderResponse,
    ) => {
      if (!payload.jobId) {
        return;
      }

      const optimisticOrder: TrackedOrder = {
        jobId: payload.jobId,
        idempotencyKey,
        items,
        userId: normalizedUserId,
        queueState:
          payload.status === "IN_FLIGHT"
            ? "active"
            : payload.status === "DUPLICATE"
              ? "reused"
              : "waiting",
        orderStatus: undefined,
        lastUpdatedAt: new Date().toISOString(),
      };

      setTrackedOrders((previous) =>
        mergeTrackedOrders(previous, [optimisticOrder]),
      );
      setLookupJobId(payload.jobId);
    },
    [],
  );

  const addToCart = useCallback(
    (product: Product) => {
      const quantity = clampQuantity(quantityByProduct[product.id] ?? 1);
      const existing = cart.find((item) => item.productId === product.id);
      const nextQuantity = clampQuantity((existing?.quantity ?? 0) + quantity);

      if (product.stock <= 0) {
        setActiveMessage(`${product.name} is sold out right now.`);
        return;
      }

      if (quantity > product.stock || nextQuantity > product.stock) {
        setActiveMessage(
          `Only ${product.stock} unit(s) are live for ${product.name}.`,
        );
        return;
      }

      setCart((previous) => {
        const index = previous.findIndex(
          (item) => item.productId === product.id,
        );

        if (index === -1) {
          return [...previous, { productId: product.id, quantity }];
        }

        return previous.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: nextQuantity }
            : item,
        );
      });

      setActiveMessage(`${product.name} x${quantity} added to cart.`);
    },
    [cart, quantityByProduct],
  );

  const createRazorpayOrder = useCallback(
    async (amountCents: number, receipt: string): Promise<{ orderId: string; amount: number; keyId: string }> => {
      const response = await fetch(`${API_BASE}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, receipt }),
      });
      if (!response.ok) throw new Error("Could not create payment order");
      return parseJSON<{ orderId: string; amount: number; keyId: string }>(response);
    },
    [],
  );

  const quickQueueOrder = useCallback(
    async (product: Product) => {
      const normalizedUserId = userId.trim() || "shopper-001";
      const quantity = clampQuantity(quantityByProduct[product.id] ?? 1);

      if (product.stock <= 0) {
        setActiveMessage(`${product.name} is sold out right now.`);
        return;
      }

      if (quantity > product.stock) {
        setActiveMessage(
          `Selected quantity exceeds live stock for ${product.name}.`,
        );
        return;
      }

      const idempotencyKey = buildIdempotencyKey();
      setPlacingProductId(product.id);

      try {
        const amountCents = product.priceCents * quantity;
        const rzpOrder = await createRazorpayOrder(amountCents, idempotencyKey.slice(0, 40));
        const payment = await openRazorpayModal(
          rzpOrder.keyId,
          rzpOrder.orderId,
          rzpOrder.amount,
          user?.email ?? "",
          `${product.name} x${quantity}`,
        );

        const items: CartItem[] = [{ productId: product.id, quantity }];
        const payload = await enqueueOrder(
          items,
          normalizedUserId,
          idempotencyKey,
          payment,
        );

        registerTrackedOrder(items, normalizedUserId, idempotencyKey, payload);

        if (payload.status === "DUPLICATE") {
          setActiveMessage(
            `Duplicate request absorbed for ${product.name}. Existing job reused.`,
          );
        } else if (payload.status === "IN_FLIGHT") {
          setActiveMessage(
            `Existing request is still in flight for ${product.name}.`,
          );
        } else {
          setActiveMessage(
            `Queued order for ${product.name}. Job ${payload.jobId}`,
          );
        }

        await Promise.all([loadProducts(true), refreshTrackedOrders()]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Order request failed";
        setActiveMessage(message);
      } finally {
        setPlacingProductId(null);
      }
    },
    [
      createRazorpayOrder,
      enqueueOrder,
      loadProducts,
      quantityByProduct,
      refreshTrackedOrders,
      registerTrackedOrder,
      user,
      userId,
    ],
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      setCart((previous) =>
        previous.map((item) =>
          item.productId === productId
            ? { ...item, quantity: clampQuantity(quantity) }
            : item,
        ),
      );
    },
    [],
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((previous) =>
      previous.filter((item) => item.productId !== productId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setActiveMessage("Cart cleared. Build the next flash drop batch.");
  }, []);

  const lookupJob = useCallback(async () => {
    const trimmedJobId = lookupJobId.trim();

    if (!trimmedJobId) {
      setLookupError("Enter a job ID first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/flash-sale/order/${trimmedJobId}`,
      );

      if (!response.ok) {
        throw new Error("Job not found yet.");
      }

      const payload = await parseJSON<JobStatusResponse>(response);

      setTrackedOrders((previous) => {
        const previousEntry = previous.find(
          (item) => item.jobId === payload.jobId,
        );
        const snapshotOrder = mapSnapshotToOrder(payload, previousEntry);
        return mergeTrackedOrders(previous, [snapshotOrder]);
      });

      setLookupError("");
      setActiveMessage(`Manual lookup refreshed for job ${trimmedJobId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lookup failed";
      setLookupError(message);
    }
  }, [lookupJobId]);

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const cartQuantityMap = useMemo(() => {
    return new Map(cart.map((item) => [item.productId, item.quantity]));
  }, [cart]);

  const cartEntries = useMemo(() => {
    return cart.map((item) => ({
      item,
      product: productMap.get(item.productId),
    }));
  }, [cart, productMap]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    const matchingProducts = products.filter((product) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.sku.toLowerCase().includes(normalizedQuery)
      );
    });

    const sortedProducts = [...matchingProducts];

    switch (sortOption) {
      case "name-asc":
        sortedProducts.sort((left, right) =>
          left.name.localeCompare(right.name),
        );
        break;
      case "price-asc":
        sortedProducts.sort(
          (left, right) => left.priceCents - right.priceCents,
        );
        break;
      case "price-desc":
        sortedProducts.sort(
          (left, right) => right.priceCents - left.priceCents,
        );
        break;
      case "stock-desc":
        sortedProducts.sort((left, right) => right.stock - left.stock);
        break;
      case "stock-asc":
        sortedProducts.sort((left, right) => left.stock - right.stock);
        break;
      default:
        sortedProducts.sort((left, right) => {
          const stockBias = Number(right.stock > 0) - Number(left.stock > 0);

          if (stockBias !== 0) {
            return stockBias;
          }

          return right.createdAt.localeCompare(left.createdAt);
        });
    }

    return sortedProducts;
  }, [deferredSearchQuery, products, sortOption]);

  const totalStock = useMemo(() => {
    return products.reduce((sum, product) => sum + product.stock, 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter((product) => product.stock <= 10).length;
  }, [products]);

  const cartUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartValueCents = useMemo(() => {
    return cartEntries.reduce((sum, entry) => {
      return sum + (entry.product?.priceCents ?? 0) * entry.item.quantity;
    }, 0);
  }, [cartEntries]);

  const invalidCartCount = useMemo(() => {
    return cartEntries.filter(({ item, product }) => {
      return !product || product.stock <= 0 || item.quantity > product.stock;
    }).length;
  }, [cartEntries]);

  const confirmedCount = useMemo(() => {
    return trackedOrders.filter((order) => order.orderStatus === "CONFIRMED")
      .length;
  }, [trackedOrders]);

  const pendingCount = useMemo(() => {
    return trackedOrders.filter(
      (order) => !terminalQueueStates.has(order.queueState.toLowerCase()),
    ).length;
  }, [trackedOrders]);

  const checkoutCart = useCallback(async () => {
    const normalizedUserId = userId.trim() || "shopper-001";

    if (cartEntries.length === 0) {
      setActiveMessage("Cart is empty. Add products before checkout.");
      return;
    }

    const invalidEntry = cartEntries.find(({ item, product }) => {
      return !product || product.stock <= 0 || item.quantity > product.stock;
    });

    if (invalidEntry) {
      const name = invalidEntry.product?.name ?? "One cart line";
      setActiveMessage(
        `${name} is above live stock or unavailable. Adjust the cart first.`,
      );
      return;
    }

    setCheckouting(true);

    try {
      const items: CartItem[] = cartEntries.map(({ item }) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      const idempotencyKey = buildIdempotencyKey();
      const amountCents = cartEntries.reduce(
        (sum, { item, product }) => sum + (product?.priceCents ?? 0) * item.quantity,
        0,
      );

      const rzpOrder = await createRazorpayOrder(amountCents, idempotencyKey.slice(0, 40));
      const payment = await openRazorpayModal(
        rzpOrder.keyId,
        rzpOrder.orderId,
        rzpOrder.amount,
        user?.email ?? "",
        `ShopSphere order — ${items.length} item(s)`,
      );

      const payload = await enqueueOrder(
        items,
        normalizedUserId,
        idempotencyKey,
        payment,
        selectedAddressId || undefined,
      );
      registerTrackedOrder(items, normalizedUserId, idempotencyKey, payload);

      setCart([]);
      await Promise.all([loadProducts(true), refreshTrackedOrders()]);

      if (payload.status === "DUPLICATE") {
        setActiveMessage(`Duplicate request — existing job reused.`);
      } else if (payload.status === "IN_FLIGHT") {
        setActiveMessage(`A matching request is already in flight.`);
      } else {
        setActiveMessage(
          `Checkout queued ${items.length} line(s). Job ${payload.jobId}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout failed";
      setActiveMessage(message);
    } finally {
      setCheckouting(false);
    }
  }, [
    cartEntries,
    createRazorpayOrder,
    enqueueOrder,
    loadProducts,
    refreshTrackedOrders,
    registerTrackedOrder,
    selectedAddressId,
    user,
    userId,
  ]);

  const urgencyPillClass: Record<string, string> = {
    danger: "ss-pill ss-pill-danger",
    warn: "ss-pill ss-pill-warn",
    info: "ss-pill ss-pill-info",
    good: "ss-pill ss-pill-success",
  };

  const orderToneBorder: Record<string, string> = {
    good: "var(--c-success)",
    warn: "var(--c-warn)",
    danger: "var(--c-danger)",
    info: "var(--c-primary)",
  };

  const orderToneBg: Record<string, string> = {
    good: "var(--c-success-soft)",
    warn: "var(--c-warn-soft)",
    danger: "var(--c-danger-soft)",
    info: "var(--c-info-soft)",
  };

  return (
    <div className="page-container">
      {/* Page header */}
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 8 }}>Catalogue · Drop 14</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 0 }}>
            Marketplace
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignSelf: "flex-start" }}>
          <span
            className={health === "ok" ? "ss-pill ss-pill-success" : health === "down" ? "ss-pill ss-pill-danger" : "ss-pill"}
          >
            <span className={`ss-dot${health === "ok" ? " ss-dot-pulse" : ""}`} style={{ color: health === "ok" ? "var(--c-success)" : health === "down" ? "var(--c-danger)" : "var(--c-muted)" }}/>
            API · {health.toUpperCase()}
          </span>
          <span className="ss-pill">Queue · {pendingCount} active</span>
        </div>
      </header>

      {/* Metric strip */}
      <div className="ss-card" style={{ padding: 0, overflow: "hidden", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 24 }}>
        {[
          { label: "Live SKUs", value: products.length },
          { label: "Showing", value: filteredProducts.length },
          { label: "Total Units", value: totalStock.toLocaleString("en-IN") },
          { label: "Low Stock", value: lowStockCount },
          { label: "Cart Units", value: cartUnits },
          { label: "Pending Jobs", value: pendingCount },
          { label: "Confirmed", value: confirmedCount },
        ].map((m, i) => (
          <div key={m.label} style={{ padding: "16px 18px", borderRight: i < 6 ? "1px solid var(--c-line)" : "none" }}>
            <p className="eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>{m.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, letterSpacing: "-0.03em" }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: 24 }}>
        {/* Product grid */}
        <section>
          {/* Search + sort toolbar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" as const }}>
            <div style={{ position: "relative", flex: "1 1 280px" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--c-muted)", pointerEvents: "none" }}>
                <Icon name="search" size={15}/>
              </span>
              <input
                id="catalog-search"
                className="input-field"
                style={{ paddingLeft: 40 }}
                value={searchQuery}
                placeholder="Search by name or SKU…"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              id="catalog-sort"
              className="input-field"
              style={{ width: 180 }}
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 16 }}>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} · {lowStockCount} SKU{lowStockCount !== 1 ? "s" : ""} critical
          </p>

          {productsLoading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 12, color: "var(--c-muted)" }}>
              <div style={{ width: 20, height: 20, border: "2px solid var(--c-line)", borderTopColor: "var(--c-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>
              Loading products…
            </div>
          )}
          {productsError && (
            <div style={{ background: "var(--c-danger-soft)", border: "1px solid var(--c-danger)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "var(--c-danger)", fontWeight: 600 }}>{productsError}</p>
            </div>
          )}
          {!productsLoading && !productsError && filteredProducts.length === 0 && (
            <p style={{ color: "var(--c-muted)", textAlign: "center", padding: "48px 0" }}>
              No products match the current search.
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {filteredProducts.map((product, productIdx) => {
              const isSoldOut = product.stock <= 0;
              const selectedQuantity = clampQuantity(quantityByProduct[product.id] ?? 1);
              const quantityExceedsStock = selectedQuantity > product.stock;
              const cartQuantity = cartQuantityMap.get(product.id) ?? 0;
              const urgency = getUrgencyMeta(product.stock);
              const swatch = getProductSwatch(product.id, productIdx);

              return (
                <article
                  key={product.id}
                  className="ss-card"
                  style={{ padding: 0, overflow: "hidden", opacity: isSoldOut ? 0.65 : 1, transition: "box-shadow 0.2s" }}
                >
                  {/* Product swatch */}
                  <div style={{ position: "relative", height: 140 }}>
                    <Swatch
                      kind={swatch.kind}
                      a={swatch.a}
                      b={swatch.b}
                      c={swatch.c}
                      style={{ width: "100%", height: "100%" }}
                    />
                    <span
                      className={urgencyPillClass[urgency.tone] ?? "ss-pill"}
                      style={{ position: "absolute", top: 10, right: 10, fontSize: 10 }}
                    >
                      {urgency.label}
                    </span>
                    {cartQuantity > 0 && (
                      <span className="ss-pill ss-pill-strong" style={{ position: "absolute", top: 10, left: 10, fontSize: 10 }}>
                        Cart: {cartQuantity}
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <Link
                          to={`/products/${product.id}`}
                          style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, lineHeight: 1.25, display: "block" }}
                        >
                          {product.name}
                        </Link>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--c-muted)", marginTop: 2 }}>
                          {product.sku}
                        </p>
                      </div>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 16, color: "var(--c-primary)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {toCurrency(product.priceCents)}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
                        Stock: <strong style={{ color: "var(--c-ink)" }}>{isSoldOut ? "Sold Out" : product.stock.toLocaleString("en-IN")}</strong>
                      </span>
                      <div style={{ display: "flex", alignItems: "center", background: "var(--c-surface-2)", borderRadius: 8, padding: "2px 4px", gap: 2 }}>
                        <button
                          style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}
                          onClick={() => setQuantityByProduct((p) => ({ ...p, [product.id]: clampQuantity((p[product.id] ?? 1) - 1) }))}
                        >
                          <Icon name="minus" size={13}/>
                        </button>
                        <input
                          id={`qty-${product.id}`}
                          type="number"
                          min={1}
                          max={10}
                          style={{ width: 28, textAlign: "center", fontWeight: 700, background: "transparent", border: "none", outline: "none", fontSize: 13 }}
                          value={quantityByProduct[product.id] ?? 1}
                          onChange={(e) => setQuantityByProduct((p) => ({ ...p, [product.id]: clampQuantity(Number(e.target.value)) }))}
                        />
                        <button
                          style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, color: "var(--c-ink)" }}
                          onClick={() => setQuantityByProduct((p) => ({ ...p, [product.id]: clampQuantity((p[product.id] ?? 1) + 1) }))}
                        >
                          <Icon name="plus" size={13}/>
                        </button>
                      </div>
                    </div>

                    {quantityExceedsStock && !isSoldOut && (
                      <p style={{ fontSize: 11, color: "var(--c-danger)", fontWeight: 600 }}>Quantity exceeds live stock.</p>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn-secondary"
                        style={{ flex: 1, padding: "8px 0", fontSize: 12 }}
                        disabled={isSoldOut || quantityExceedsStock || checkouting}
                        onClick={() => addToCart(product)}
                      >
                        <Icon name="cart" size={13}/>
                        Add
                      </button>
                      <button
                        className="btn-primary"
                        style={{ flex: 1, padding: "8px 0", fontSize: 12 }}
                        disabled={isSoldOut || quantityExceedsStock || placingProductId === product.id || checkouting}
                        onClick={() => { void quickQueueOrder(product); }}
                      >
                        <Icon name="bolt" size={13}/>
                        {placingProductId === product.id ? "…" : "Quick Queue"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Sidebar */}
        <aside>
          <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Cart panel */}
            <div className="ss-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid var(--c-line)" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
                  <Icon name="cart" size={15} stroke={1.8}/>
                  Dispatch Cart
                </h2>
                <span className="ss-pill ss-pill-strong" style={{ fontSize: 10 }}>
                  {cart.length} line{cart.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Shopper ID */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 5 }}>
                  Shopper ID
                </label>
                <input
                  id="user-id"
                  className="input-field"
                  style={{ fontSize: 13, padding: "8px 12px" }}
                  value={userId}
                  disabled={Boolean(user)}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              {/* Cart summary strip */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { label: "Lines", value: cart.length },
                  { label: "Units", value: cartUnits },
                  { label: "Value", value: toCurrency(cartValueCents) },
                ].map((s) => (
                  <div key={s.label} style={{ background: "var(--c-surface-2)", borderRadius: 8, padding: "8px", textAlign: "center" as const }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 2 }}>
                      {s.label}
                    </p>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, color: "var(--c-primary)" }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {invalidCartCount > 0 && (
                <p style={{ fontSize: 11, color: "var(--c-danger)", fontWeight: 600, background: "var(--c-danger-soft)", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
                  Adjust {invalidCartCount} line(s) before checkout.
                </p>
              )}

              {/* Cart items */}
              <ul style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
                {cartEntries.length === 0 && (
                  <li style={{ fontSize: 13, color: "var(--c-muted)", textAlign: "center", padding: "20px 0" }}>
                    Cart is empty. Add products from the catalog.
                  </li>
                )}
                {cartEntries.map(({ item, product }) => {
                  const unavailable = !product || product.stock <= 0;
                  const overStock = Boolean(product && item.quantity > product.stock);
                  const invalid = unavailable || overStock;
                  return (
                    <li
                      key={item.productId}
                      style={{
                        borderRadius: 8, padding: "10px 12px",
                        background: invalid ? "var(--c-danger-soft)" : "var(--c-surface-2)",
                        border: `1px solid ${invalid ? "var(--c-danger)" : "var(--c-line)"}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.25 }}>{product?.name ?? "Unavailable"}</p>
                          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--c-muted)" }}>
                            {product?.sku ?? compactValue(item.productId, 8)}
                          </p>
                        </div>
                        <button
                          style={{ color: "var(--c-danger)", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Icon name="trash" size={13}/>
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--c-muted)" }}>
                        <span>{product ? toCurrency(product.priceCents) : "—"} · {product ? `${product.stock} live` : "missing"}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span>Qty:</span>
                          <input
                            id={`cart-qty-${item.productId}`}
                            type="number"
                            min={1}
                            max={10}
                            style={{ width: 36, textAlign: "center", fontSize: 11, border: "1px solid var(--c-line)", borderRadius: 4, padding: "1px 4px", background: "var(--c-surface)" }}
                            value={item.quantity}
                            onChange={(e) => updateCartQuantity(item.productId, Number(e.target.value))}
                          />
                          <span style={{ fontWeight: 700, color: "var(--c-primary)" }}>
                            {product ? toCurrency(product.priceCents * item.quantity) : "—"}
                          </span>
                        </div>
                      </div>
                      {invalid && (
                        <p style={{ fontSize: 10, color: "var(--c-danger)", marginTop: 4 }}>
                          {unavailable ? "No longer available." : `Only ${product?.stock ?? 0} unit(s) live.`}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Address selector */}
              {user && addresses.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "var(--c-muted)", marginBottom: 5 }}>
                    Ship To
                  </label>
                  <select
                    className="input-field"
                    style={{ fontSize: 12, padding: "8px 10px", width: "100%" }}
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    <option value="">— No address —</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} · {a.line1}, {a.city}{a.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {user && addresses.length === 0 && (
                <p style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 10 }}>
                  <a href="/profile" style={{ color: "var(--c-primary)", textDecoration: "underline" }}>Add a shipping address</a> for delivery info.
                </p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, padding: "10px 0", fontSize: 12 }}
                  disabled={cart.length === 0 || checkouting}
                  onClick={clearCart}
                >
                  Clear
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, padding: "10px 0", fontSize: 12 }}
                  disabled={cart.length === 0 || invalidCartCount > 0 || checkouting}
                  onClick={() => { void checkoutCart(); }}
                >
                  {checkouting ? `Dispatching ${cart.length}…` : "Checkout Cart"}
                </button>
              </div>
            </div>

            {/* Order relay panel */}
            <div className="ss-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--c-line)" }}>
                <Icon name="pkg" size={15} stroke={1.8}/>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Order Relay</h2>
              </div>

              {/* Manual lookup */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  id="job-id"
                  className="input-field"
                  style={{ flex: 1, fontSize: 12, padding: "8px 12px" }}
                  value={lookupJobId}
                  placeholder="Job ID lookup…"
                  onChange={(e) => setLookupJobId(e.target.value)}
                />
                <button
                  className="btn-secondary"
                  style={{ padding: "8px 12px", fontSize: 12, whiteSpace: "nowrap" }}
                  onClick={() => { void lookupJob(); }}
                >
                  Track
                </button>
              </div>

              {lookupError && (
                <p style={{ fontSize: 11, color: "var(--c-danger)", fontWeight: 600, marginBottom: 6 }}>{lookupError}</p>
              )}
              <p style={{ fontSize: 11, color: "var(--c-muted)", fontStyle: "italic", marginBottom: 12, background: "var(--c-surface-2)", borderRadius: 8, padding: "7px 10px" }}>
                {activeMessage}
              </p>

              <ul style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                {trackedOrders.length === 0 && (
                  <li style={{ fontSize: 13, color: "var(--c-muted)", textAlign: "center", padding: "20px 0" }}>
                    No jobs yet. Queue a single SKU or checkout the cart.
                  </li>
                )}
                {trackedOrders.map((order) => {
                  const tone = toneForOrder(order.queueState, order.orderStatus);
                  const itemSummary = order.items
                    .map(({ productId, quantity }) => `${productMap.get(productId)?.name ?? compactValue(productId, 12)} x${quantity}`)
                    .join(", ");
                  return (
                    <li
                      key={order.jobId}
                      style={{
                        borderRadius: 8, padding: "10px 12px",
                        borderLeft: `3px solid ${orderToneBorder[tone] ?? "var(--c-line)"}`,
                        background: orderToneBg[tone] ?? "var(--c-surface-2)",
                        fontSize: 11,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12 }}>
                          Job {order.jobId}
                        </span>
                        <span className={urgencyPillClass[tone] ?? "ss-pill"} style={{ fontSize: 9 }}>
                          {prettyState(order.queueState)}
                        </span>
                      </div>
                      <p style={{ color: "var(--c-muted)", marginBottom: 2 }}>{itemSummary || "No items"}</p>
                      <p style={{ color: "var(--c-muted)" }}>
                        Result: <strong>{order.orderStatus ?? "PENDING"}</strong>
                        {order.failureReason ? ` · ${order.failureReason}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default MarketplacePage;
