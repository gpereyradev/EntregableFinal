export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "seller";
  active: boolean;
};
export type Category = { id: number; name: string };
export type Batch = {
  id: number;
  product_id: number;
  code: string;
  expires_at: string;
  quantity: number;
  product?: Product;
};
export type Product = {
  id: number;
  code: string;
  name: string;
  category_id: number;
  category: Category;
  presentation: string;
  description: string;
  price_cents: number;
  min_stock: number;
  active: boolean;
  available_stock: number | null;
  total_stock: number | null;
  batches?: Batch[];
};
export type Line = {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
  allocations: { quantity: number; batch: Batch }[];
};
export type Sale = {
  id: number;
  total_cents: number;
  status: string;
  payment_method: string;
  created_at: string;
  demo: boolean;
  user: User;
  items: Line[];
  items_count: number;
  cancelled_at?: string;
  cancel_reason?: string;
  canceller?: User;
};
export type Movement = {
  id: number;
  type: string;
  quantity: number;
  stock_after: number;
  reason: string;
  created_at: string;
  batch: Batch & { product: Product };
  user: User;
  sale_id: number | null;
};
export type Page<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
};
export type Alerts = {
  low_stock: Product[];
  expiring: Batch[];
  expired: Batch[];
  as_of: string;
};
export type Report = {
  from: string;
  to: string;
  today_cents: number;
  today_count: number;
  period_cents: number;
  period_count: number;
  product_count: number;
  low_count: number;
  out_count: number;
  expiring_count: number;
  expired_count: number;
  series: { day: string; total_cents: number; count: number }[];
  top_products: {
    product_id: number;
    name: string;
    quantity: number;
    total_cents: number;
  }[];
  recent_sales: Sale[];
  as_of: string;
};
export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;
  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
let csrf = "";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  key?: string,
): Promise<T> {
  const response = await fetch("/api/" + path, {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRF-TOKEN": csrf } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response
    .json()
    .catch(() => ({ message: "El servidor no respondió como se esperaba." }));
  if (data.csrf_token) csrf = data.csrf_token;
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("session-expired"));
    if (response.status === 419) await api("session");
    throw new ApiError(
      response.status === 419
        ? "La sesión se actualizó. Vuelve a intentar la operación."
        : response.status === 429
          ? "Demasiados intentos. Espera un minuto."
          : data.message || "No se pudo completar la operación.",
      response.status,
      data.errors,
    );
  }
  return data;
}
export const money = (v: number | string) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    Number(v) / 100,
  );
export const date = (v: string) =>
  new Date(
    v.includes("T") || v.includes(" ") ? v.replace(" ", "T") : v + "T12:00:00",
  ).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
export const saleCode = (id: number) => "NS-" + String(id).padStart(6, "0");
export const payment: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};
export const movementLabel: Record<string, string> = {
  entry: "Entrada",
  adjustment: "Ajuste",
  sale: "Venta",
  void: "Anulación",
};
export const localDay = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
