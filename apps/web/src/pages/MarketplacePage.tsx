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

  const urgencyClasses: Record<string, string> = {
    danger: "bg-red-100 text-red-700",
    warn: "bg-tertiary-fixed/40 text-tertiary",
    info: "bg-secondary-container/50 text-on-secondary-container",
    good: "bg-green-100 text-green-700",
  };

  const orderToneClasses: Record<string, string> = {
    good: "border-l-green-500 bg-green-50/50",
    warn: "border-l-tertiary-fixed-dim bg-tertiary-fixed/10",
    danger: "border-l-error bg-error-container/20",
    info: "border-l-primary-fixed-dim bg-primary-fixed/10",
  };

  return (
    <div className="page-container">
      {/* Page header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">ShopSphere Frontline</p>
          <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
            Marketplace
          </h1>
          <p className="text-on-surface-variant mt-1">
            Curated collections for the modern digital merchant.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider self-start md:self-auto
          ${health === "ok" ? "bg-green-100 text-green-700" : health === "down" ? "bg-red-100 text-red-700" : "bg-surface-container text-on-surface-variant"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${health === "ok" ? "bg-green-500 animate-pulse" : health === "down" ? "bg-red-500" : "bg-outline animate-pulse"}`}
          ></span>
          API {health.toUpperCase()}
        </div>
      </header>

      {/* Metric strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {[
          { label: "Products Live", value: products.length },
          { label: "Results", value: filteredProducts.length },
          { label: "Total Units", value: totalStock.toLocaleString() },
          { label: "Low Stock", value: lowStockCount },
          { label: "Cart Units", value: cartUnits },
          { label: "Pending Jobs", value: pendingCount },
          { label: "Confirmed", value: confirmedCount },
        ].map((m) => (
          <div key={m.label} className="glass-card rounded-lg p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              {m.label}
            </p>
            <p className="font-headline text-2xl font-bold text-primary">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Product grid */}
        <section className="lg:col-span-8">
          {/* Search + sort toolbar */}
          <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                search
              </span>
              <input
                id="catalog-search"
                className="input-field pl-12"
                value={searchQuery}
                placeholder="Search by name or SKU…"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-full md:w-48">
              <select
                id="catalog-sort"
                className="input-field appearance-none pr-10"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                expand_more
              </span>
            </div>
          </div>

          <p className="text-xs text-on-surface-variant mb-4">
            {filteredProducts.length} product(s) · {lowStockCount} SKU(s) in
            critical range
          </p>

          {productsLoading && (
            <div className="flex items-center justify-center py-16 text-on-surface-variant gap-3">
              <span className="material-symbols-outlined animate-spin text-primary">
                progress_activity
              </span>
              Loading products…
            </div>
          )}
          {productsError && (
            <p className="text-sm text-error font-medium bg-error/5 rounded-lg px-4 py-3 mb-4">
              {productsError}
            </p>
          )}
          {!productsLoading &&
            !productsError &&
            filteredProducts.length === 0 && (
              <p className="text-on-surface-variant text-center py-12">
                No products match the current search.
              </p>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((product) => {
              const isSoldOut = product.stock <= 0;
              const selectedQuantity = clampQuantity(
                quantityByProduct[product.id] ?? 1,
              );
              const quantityExceedsStock = selectedQuantity > product.stock;
              const cartQuantity = cartQuantityMap.get(product.id) ?? 0;
              const urgency = getUrgencyMeta(product.stock);

              return (
                <article
                  key={product.id}
                  className={`glass-card rounded-[24px] overflow-hidden hover:scale-[1.02] transition-all duration-500 ${isSoldOut ? "opacity-60" : ""}`}
                >
                  {/* Product colour band */}
                  <div className="h-32 bg-gradient-to-br from-primary-fixed to-secondary-container flex items-center justify-center relative">
                    <span className="font-headline text-5xl font-bold text-primary/20 select-none">
                      {product.name.charAt(0)}
                    </span>
                    {/* Stock badge */}
                    <div
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${urgencyClasses[urgency.tone] ?? ""}`}
                    >
                      {urgency.label}
                    </div>
                    {cartQuantity > 0 && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-bold">
                        In Cart: {cartQuantity}
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <Link
                          to={`/products/${product.id}`}
                          className="font-headline text-base font-bold text-on-surface leading-snug hover:text-primary transition-colors"
                        >
                          {product.name}
                        </Link>
                        <p className="text-[10px] text-outline font-medium tracking-tighter mt-0.5">
                          SKU: {product.sku}
                        </p>
                      </div>
                      <p className="font-headline text-lg font-bold text-primary whitespace-nowrap">
                        {toCurrency(product.priceCents)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">
                        Stock:{" "}
                        <span className="font-bold text-on-surface">
                          {isSoldOut
                            ? "Sold Out"
                            : product.stock.toLocaleString()}
                        </span>
                      </span>
                      <div className="flex items-center bg-surface-container-low rounded-lg p-1 gap-1">
                        <button
                          className="w-7 h-7 flex items-center justify-center hover:bg-white rounded transition-colors text-lg font-bold"
                          onClick={() =>
                            setQuantityByProduct((p) => ({
                              ...p,
                              [product.id]: clampQuantity(
                                (p[product.id] ?? 1) - 1,
                              ),
                            }))
                          }
                        >
                          −
                        </button>
                        <input
                          id={`qty-${product.id}`}
                          type="number"
                          min={1}
                          max={10}
                          className="w-8 text-center font-bold bg-transparent border-none outline-none text-sm"
                          value={quantityByProduct[product.id] ?? 1}
                          onChange={(e) =>
                            setQuantityByProduct((p) => ({
                              ...p,
                              [product.id]: clampQuantity(
                                Number(e.target.value),
                              ),
                            }))
                          }
                        />
                        <button
                          className="w-7 h-7 flex items-center justify-center hover:bg-white rounded transition-colors text-lg font-bold"
                          onClick={() =>
                            setQuantityByProduct((p) => ({
                              ...p,
                              [product.id]: clampQuantity(
                                (p[product.id] ?? 1) + 1,
                              ),
                            }))
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {quantityExceedsStock && !isSoldOut && (
                      <p className="text-xs text-error font-medium">
                        Quantity exceeds live stock.
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        className="btn-secondary flex-1 !py-2.5 !text-xs flex items-center justify-center gap-1"
                        disabled={
                          isSoldOut || quantityExceedsStock || checkouting
                        }
                        onClick={() => addToCart(product)}
                      >
                        <span className="material-symbols-outlined text-base">
                          add_shopping_cart
                        </span>
                        Add to Cart
                      </button>
                      <button
                        className="btn-primary flex-1 !py-2.5 !text-xs flex items-center justify-center gap-1"
                        disabled={
                          isSoldOut ||
                          quantityExceedsStock ||
                          placingProductId === product.id ||
                          checkouting
                        }
                        onClick={() => {
                          void quickQueueOrder(product);
                        }}
                      >
                        <span className="material-symbols-outlined text-base">
                          bolt
                        </span>
                        {placingProductId === product.id
                          ? "Dispatching…"
                          : "Quick Queue"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Cart panel */}
            <div className="glass-card rounded-[24px] p-6">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-outline-variant/10">
                <h2 className="font-headline text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    shopping_cart
                  </span>
                  Dispatch Cart
                </h2>
                <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded text-xs font-bold">
                  {cart.length} line{cart.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Shopper ID */}
              <div className="relative mb-4">
                <label className="absolute -top-2.5 left-4 px-2 bg-white/90 text-primary text-[10px] font-bold uppercase tracking-widest z-10 rounded">
                  Shopper ID
                </label>
                <input
                  id="user-id"
                  className="input-field !py-2.5 text-sm"
                  value={userId}
                  disabled={Boolean(user)}
                  onChange={(e) => setUserId(e.target.value)}
                />
              </div>

              {/* Cart summary */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "Lines", value: cart.length },
                  { label: "Units", value: cartUnits },
                  { label: "Value", value: toCurrency(cartValueCents) },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-surface-container-low rounded-lg p-2 text-center"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                      {s.label}
                    </p>
                    <p className="font-headline text-sm font-bold text-primary mt-0.5">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {invalidCartCount > 0 && (
                <p className="text-xs text-error font-medium bg-error/5 rounded px-3 py-2 mb-3">
                  Adjust {invalidCartCount} line(s) before checkout.
                </p>
              )}

              {/* Cart items */}
              <ul className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {cartEntries.length === 0 ? (
                  <li className="text-sm text-on-surface-variant text-center py-6">
                    Cart is empty. Add products from the catalog.
                  </li>
                ) : null}
                {cartEntries.map(({ item, product }) => {
                  const unavailable = !product || product.stock <= 0;
                  const overStock = Boolean(
                    product && item.quantity > product.stock,
                  );
                  const invalid = unavailable || overStock;
                  return (
                    <li
                      key={item.productId}
                      className={`rounded-lg p-3 ${invalid ? "bg-error/5 border border-error/20" : "bg-surface-container-low"}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="text-sm font-semibold text-on-surface leading-snug">
                            {product?.name ?? "Unavailable"}
                          </p>
                          <p className="text-[10px] text-outline">
                            {product?.sku ?? compactValue(item.productId, 8)}
                          </p>
                        </div>
                        <button
                          className="text-error hover:scale-110 transition-transform flex-shrink-0"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-on-surface-variant mt-1">
                        <span>
                          {product ? toCurrency(product.priceCents) : "—"} ·{" "}
                          {product ? `${product.stock} live` : "missing"}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-label">Qty:</span>
                          <input
                            id={`cart-qty-${item.productId}`}
                            type="number"
                            min={1}
                            max={10}
                            className="w-12 text-center text-xs rounded border border-outline-variant/30 bg-white px-1 py-0.5"
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(
                                item.productId,
                                Number(e.target.value),
                              )
                            }
                          />
                          <span className="font-bold text-primary">
                            {product
                              ? toCurrency(product.priceCents * item.quantity)
                              : "—"}
                          </span>
                        </div>
                      </div>
                      {invalid && (
                        <p className="text-[10px] text-error mt-1">
                          {unavailable
                            ? "No longer available."
                            : `Only ${product?.stock ?? 0} unit(s) live.`}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Address selector — only shown when logged in with saved addresses */}
              {user && addresses.length > 0 && (
                <div className="relative mb-3">
                  <label className="absolute -top-2.5 left-4 px-2 bg-white/90 text-primary text-[10px] font-bold uppercase tracking-widest z-10 rounded">
                    Ship To
                  </label>
                  <select
                    className="input-field !py-2.5 text-sm appearance-none pr-8 w-full"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    <option value="">— No address —</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} · {a.line1}, {a.city}
                        {a.isDefault ? " (Default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {user && addresses.length === 0 && (
                <p className="text-[10px] text-on-surface-variant mb-3">
                  <a href="/profile" className="text-primary hover:underline">Add a shipping address</a> to attach delivery info to orders.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  className="btn-secondary flex-1 !py-3 !text-xs"
                  disabled={cart.length === 0 || checkouting}
                  onClick={clearCart}
                >
                  Clear
                </button>
                <button
                  className="btn-primary flex-1 !py-3 !text-xs"
                  disabled={
                    cart.length === 0 || invalidCartCount > 0 || checkouting
                  }
                  onClick={() => {
                    void checkoutCart();
                  }}
                >
                  {checkouting
                    ? `Dispatching ${cart.length}…`
                    : "Checkout Cart"}
                </button>
              </div>
            </div>

            {/* Order relay panel */}
            <div className="glass-card rounded-[24px] p-6">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-primary">
                  package_2
                </span>
                <h2 className="font-headline text-lg font-bold">Order Relay</h2>
              </div>

              {/* Manual lookup */}
              <div className="flex gap-2 mb-3">
                <input
                  id="job-id"
                  className="input-field flex-1 !py-2.5 text-sm"
                  value={lookupJobId}
                  placeholder="Job ID lookup…"
                  onChange={(e) => setLookupJobId(e.target.value)}
                />
                <button
                  className="btn-secondary !px-4 !py-2.5 !text-xs whitespace-nowrap"
                  onClick={() => {
                    void lookupJob();
                  }}
                >
                  Track
                </button>
              </div>

              {lookupError && (
                <p className="text-xs text-error font-medium mb-2">
                  {lookupError}
                </p>
              )}
              <p className="text-xs text-on-surface-variant italic mb-4 bg-surface-container-low rounded px-3 py-2">
                {activeMessage}
              </p>

              <ul className="space-y-3 max-h-72 overflow-y-auto">
                {trackedOrders.length === 0 ? (
                  <li className="text-sm text-on-surface-variant text-center py-6">
                    No jobs yet. Queue a single SKU or checkout the cart.
                  </li>
                ) : null}
                {trackedOrders.map((order) => {
                  const tone = toneForOrder(
                    order.queueState,
                    order.orderStatus,
                  );
                  const itemSummary = order.items
                    .map(
                      ({ productId, quantity }) =>
                        `${productMap.get(productId)?.name ?? compactValue(productId, 12)} x${quantity}`,
                    )
                    .join(", ");
                  return (
                    <li
                      key={order.jobId}
                      className={`rounded-lg p-3 border-l-4 text-xs space-y-0.5 ${orderToneClasses[tone] ?? ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-headline font-bold text-sm text-on-surface">
                          Job {order.jobId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${urgencyClasses[tone] ?? ""}`}
                        >
                          {prettyState(order.queueState)}
                        </span>
                      </div>
                      <p className="text-on-surface-variant">
                        {itemSummary || "No items"}
                      </p>
                      <p className="text-on-surface-variant">
                        Result:{" "}
                        <span className="font-bold">
                          {order.orderStatus ?? "PENDING"}
                        </span>
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
    </div>
  );
}

export default MarketplacePage;
