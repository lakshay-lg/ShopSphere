import {
  type CSSProperties,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

interface ApiOrder {
  id: string;
  queueJobId: string;
  userId: string;
  productId: string;
  quantity: number;
  status: "CONFIRMED" | "FAILED";
  failureReason: string | null;
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
  productId: string;
  userId: string;
  quantity: number;
  queueState: QueueState;
  orderStatus: OrderStatus;
  failureReason?: string;
  lastUpdatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const POLL_INTERVAL_MS = 2000;

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
  return {
    jobId: snapshot.jobId,
    idempotencyKey: previous?.idempotencyKey ?? "lookup",
    productId: previous?.productId ?? snapshot.order?.productId ?? "unknown",
    userId: previous?.userId ?? snapshot.order?.userId ?? "unknown",
    quantity: snapshot.order?.quantity ?? previous?.quantity ?? 0,
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

function MarketplacePage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthState>("checking");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);
  const trackedOrdersRef = useRef<TrackedOrder[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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
      setUserId(user.email);
      return;
    }

    setUserId("shopper-001");
  }, [user]);

  useEffect(() => {
    trackedOrdersRef.current = trackedOrders;
  }, [trackedOrders]);

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
      productId: string,
      quantity: number,
      normalizedUserId: string,
      idempotencyKey: string,
    ): Promise<FlashSaleOrderResponse> => {
      const response = await fetch(`${API_BASE}/api/flash-sale/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          userId: normalizedUserId,
          productId,
          quantity,
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
      product: Product,
      quantity: number,
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
        productId: product.id,
        userId: normalizedUserId,
        quantity,
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
        const payload = await enqueueOrder(
          product.id,
          quantity,
          normalizedUserId,
          idempotencyKey,
        );

        registerTrackedOrder(
          product,
          quantity,
          normalizedUserId,
          idempotencyKey,
          payload,
        );

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
      enqueueOrder,
      loadProducts,
      quantityByProduct,
      refreshTrackedOrders,
      registerTrackedOrder,
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

    let queued = 0;
    let duplicates = 0;
    let inFlight = 0;
    let failed = 0;
    const successfulProductIds = new Set<string>();
    const failureMessages: string[] = [];

    try {
      for (const entry of cartEntries) {
        if (!entry.product) {
          failed += 1;
          failureMessages.push("A cart product is missing from the catalog.");
          continue;
        }

        const idempotencyKey = buildIdempotencyKey();

        try {
          const payload = await enqueueOrder(
            entry.product.id,
            entry.item.quantity,
            normalizedUserId,
            idempotencyKey,
          );

          registerTrackedOrder(
            entry.product,
            entry.item.quantity,
            normalizedUserId,
            idempotencyKey,
            payload,
          );

          successfulProductIds.add(entry.item.productId);

          if (payload.status === "QUEUED") {
            queued += 1;
          } else if (payload.status === "DUPLICATE") {
            duplicates += 1;
          } else {
            inFlight += 1;
          }
        } catch (error) {
          failed += 1;
          failureMessages.push(
            error instanceof Error
              ? `${entry.product.name}: ${error.message}`
              : `${entry.product.name}: checkout failed`,
          );
        }
      }

      setCart((previous) =>
        previous.filter((item) => !successfulProductIds.has(item.productId)),
      );

      await Promise.all([loadProducts(true), refreshTrackedOrders()]);

      if (failed === 0) {
        setActiveMessage(
          `Checkout dispatched ${successfulProductIds.size} line(s). ${queued} queued, ${duplicates} reused, ${inFlight} active.`,
        );
      } else {
        setActiveMessage(
          `Checkout sent ${successfulProductIds.size} line(s) with ${failed} failure(s). ${failureMessages[0]}`,
        );
      }
    } finally {
      setCheckouting(false);
    }
  }, [
    cartEntries,
    enqueueOrder,
    loadProducts,
    refreshTrackedOrders,
    registerTrackedOrder,
    userId,
  ]);

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ShopSphere Frontline</p>
          <h1>Flash Drop Storefront</h1>
        </div>
        <div className={`health-pill health-${health}`}>
          <span className="pulse" />
          API {health.toUpperCase()}
        </div>
      </header>

      <section className="metric-strip">
        <article className="metric-card">
          <p className="metric-label">Products Live</p>
          <p className="metric-value">{products.length}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Search Results</p>
          <p className="metric-value">{filteredProducts.length}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Total Units Left</p>
          <p className="metric-value">{totalStock}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Low Stock Alerts</p>
          <p className="metric-value">{lowStockCount}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Cart Units</p>
          <p className="metric-value">{cartUnits}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Pending Queue Jobs</p>
          <p className="metric-value">{pendingCount}</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Confirmed Orders</p>
          <p className="metric-value">{confirmedCount}</p>
        </article>
      </section>

      <main className="layout">
        <section className="panel products-panel">
          <div className="panel-heading">
            <h2>Live Drop Catalog</h2>
            <p>Search, sort, and stage products before queue dispatch.</p>
          </div>

          <div className="catalog-toolbar">
            <label className="field toolbar-field" htmlFor="catalog-search">
              Search Products
              <input
                id="catalog-search"
                value={searchQuery}
                placeholder="Search by name or SKU"
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
              />
            </label>

            <label
              className="field toolbar-field toolbar-sort"
              htmlFor="catalog-sort"
            >
              Sort By
              <select
                id="catalog-sort"
                value={sortOption}
                onChange={(event) => {
                  setSortOption(event.target.value as SortOption);
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="catalog-meta">
            <p>{filteredProducts.length} product(s) visible.</p>
            <p>{lowStockCount} SKU(s) in critical stock range.</p>
          </div>

          {productsLoading ? (
            <p className="soft-message">Loading products...</p>
          ) : null}
          {productsError ? (
            <p className="error-message">{productsError}</p>
          ) : null}
          {!productsLoading &&
          !productsError &&
          filteredProducts.length === 0 ? (
            <p className="soft-message">
              No products match the current search.
            </p>
          ) : null}

          <div className="product-grid">
            {filteredProducts.map((product, index) => {
              const isSoldOut = product.stock <= 0;
              const selectedQuantity = clampQuantity(
                quantityByProduct[product.id] ?? 1,
              );
              const quantityExceedsStock = selectedQuantity > product.stock;
              const cartQuantity = cartQuantityMap.get(product.id) ?? 0;
              const cardStyle = { "--stagger": `${index}` } as CSSProperties;
              const urgency = getUrgencyMeta(product.stock);

              return (
                <article
                  className="product-card"
                  key={product.id}
                  style={cardStyle}
                >
                  <div className="product-header">
                    <h3>{product.name}</h3>
                    <span
                      className={`stock-tag ${isSoldOut ? "stock-sold-out" : "stock-live"}`}
                    >
                      {isSoldOut ? "Sold Out" : `${product.stock} left`}
                    </span>
                  </div>

                  <div className="product-signal-row">
                    <span className={`signal-chip signal-${urgency.tone}`}>
                      {urgency.label}
                    </span>
                    {cartQuantity > 0 ? (
                      <span className="cart-chip">Cart {cartQuantity}</span>
                    ) : null}
                  </div>

                  <p className="sku">SKU: {product.sku}</p>
                  <p className="price">{toCurrency(product.priceCents)}</p>

                  <label className="qty-control" htmlFor={`qty-${product.id}`}>
                    Quantity
                    <input
                      id={`qty-${product.id}`}
                      type="number"
                      min={1}
                      max={10}
                      value={quantityByProduct[product.id] ?? 1}
                      onChange={(event) => {
                        setQuantityByProduct((previous) => ({
                          ...previous,
                          [product.id]: clampQuantity(
                            Number(event.target.value),
                          ),
                        }));
                      }}
                    />
                  </label>

                  {quantityExceedsStock && !isSoldOut ? (
                    <p className="error-message inline-error">
                      Requested quantity exceeds live stock.
                    </p>
                  ) : (
                    <p className="soft-message inline-note">
                      Updated {new Date(product.updatedAt).toLocaleTimeString()}
                    </p>
                  )}

                  <div className="product-actions">
                    <button
                      className="ghost-button secondary-button"
                      disabled={
                        isSoldOut || quantityExceedsStock || checkouting
                      }
                      onClick={() => {
                        addToCart(product);
                      }}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="buy-button"
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
                      {placingProductId === product.id
                        ? "Dispatching..."
                        : "Quick Queue"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="sidebar-stack">
          <section className="panel cart-panel">
            <div className="panel-heading">
              <h2>Dispatch Cart</h2>
              <p>Bundle multiple SKUs and queue them in one checkout flow.</p>
            </div>

            <label className="field" htmlFor="user-id">
              Shopper ID
              <input
                id="user-id"
                value={userId}
                disabled={Boolean(user)}
                onChange={(event) => {
                  setUserId(event.target.value);
                }}
              />
            </label>

            <div className="cart-summary-grid">
              <article className="summary-block">
                <p className="metric-label">Cart Lines</p>
                <p className="summary-value">{cart.length}</p>
              </article>
              <article className="summary-block">
                <p className="metric-label">Units</p>
                <p className="summary-value">{cartUnits}</p>
              </article>
              <article className="summary-block">
                <p className="metric-label">Cart Value</p>
                <p className="summary-value">{toCurrency(cartValueCents)}</p>
              </article>
            </div>

            {invalidCartCount > 0 ? (
              <p className="error-message">
                Adjust {invalidCartCount} cart line(s) before checkout. Each
                line must stay within live stock and 10 units.
              </p>
            ) : null}

            <ul className="cart-list">
              {cartEntries.length === 0 ? (
                <li className="soft-message">
                  Cart is empty. Add products from the catalog to start a
                  multi-item checkout.
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
                    className={`cart-item ${invalid ? "cart-item-invalid" : ""}`}
                    key={item.productId}
                  >
                    <div className="cart-item-head">
                      <div>
                        <p className="cart-item-name">
                          {product?.name ?? "Unavailable product"}
                        </p>
                        <p className="sku">
                          SKU: {product?.sku ?? compactValue(item.productId, 8)}
                        </p>
                      </div>
                      <button
                        className="mini-button"
                        onClick={() => {
                          removeFromCart(item.productId);
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="cart-item-meta">
                      <span>
                        {product
                          ? toCurrency(product.priceCents)
                          : "Unavailable"}
                      </span>
                      <span>
                        {product ? `${product.stock} live` : "Missing"}
                      </span>
                    </div>

                    <div className="cart-item-controls">
                      <label
                        className="field compact-field"
                        htmlFor={`cart-qty-${item.productId}`}
                      >
                        Qty
                        <input
                          id={`cart-qty-${item.productId}`}
                          type="number"
                          min={1}
                          max={10}
                          value={item.quantity}
                          onChange={(event) => {
                            updateCartQuantity(
                              item.productId,
                              Number(event.target.value),
                            );
                          }}
                        />
                      </label>

                      <p className="line-total">
                        {product
                          ? toCurrency(product.priceCents * item.quantity)
                          : "--"}
                      </p>
                    </div>

                    {invalid ? (
                      <p className="error-message cart-inline-error">
                        {unavailable
                          ? "This product is no longer available for checkout."
                          : `Only ${product?.stock ?? 0} unit(s) are currently live.`}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <div className="cart-actions">
              <button
                className="ghost-button secondary-button"
                disabled={cart.length === 0 || checkouting}
                onClick={clearCart}
              >
                Clear Cart
              </button>
              <button
                className="buy-button"
                disabled={
                  cart.length === 0 || invalidCartCount > 0 || checkouting
                }
                onClick={() => {
                  void checkoutCart();
                }}
              >
                {checkouting
                  ? `Dispatching ${cart.length} lines...`
                  : "Checkout Cart"}
              </button>
            </div>
          </section>

          <section className="panel relay-panel">
            <div className="panel-heading">
              <h2>Order Relay</h2>
              <p>Track queue progression from request to confirmation.</p>
            </div>

            <div className="lookup-row">
              <label className="field" htmlFor="job-id">
                Manual Job Lookup
                <input
                  id="job-id"
                  value={lookupJobId}
                  placeholder="e.g. 1"
                  onChange={(event) => {
                    setLookupJobId(event.target.value);
                  }}
                />
              </label>
              <button
                className="ghost-button"
                onClick={() => {
                  void lookupJob();
                }}
              >
                Track
              </button>
            </div>

            {lookupError ? (
              <p className="error-message">{lookupError}</p>
            ) : null}
            <p className="active-message">{activeMessage}</p>

            <ul className="order-stream">
              {trackedOrders.length === 0 ? (
                <li className="soft-message">
                  No jobs yet. Queue a single SKU or checkout the cart.
                </li>
              ) : null}

              {trackedOrders.map((order) => {
                const productName =
                  productMap.get(order.productId)?.name ??
                  compactValue(order.productId, 12);

                return (
                  <li
                    className={`order-item tone-${toneForOrder(order.queueState, order.orderStatus)}`}
                    key={order.jobId}
                  >
                    <div className="order-topline">
                      <p>Job {order.jobId}</p>
                      <span>{prettyState(order.queueState)}</span>
                    </div>
                    <p className="order-subline">
                      Product: {productName} | Qty: {order.quantity}
                    </p>
                    <p className="order-subline">User: {order.userId}</p>
                    <p className="order-subline">
                      Idempotency: {compactValue(order.idempotencyKey)}
                    </p>
                    <p className="order-subline">
                      Result: {order.orderStatus ?? "PENDING"}
                      {order.failureReason ? ` (${order.failureReason})` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default MarketplacePage;
