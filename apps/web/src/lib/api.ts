import type { LoginInput, ProductQuery, PublicUser, RegisterInput } from "@cartazo/shared";

// NEXT_PUBLIC_: la misma URL la usan los Server Components y el navegador (auth/carrito).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Prisma serializa Decimal como string en JSON: price llega "1200.5", no número.
export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  imageUrl: string | null;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method,
    // credentials: "include" hace que el navegador mande/reciba la cookie httpOnly del JWT
    credentials: "include",
    cache: "no-store",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? res.statusText, res.status, body?.error?.code);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export function getProducts(query: Partial<ProductQuery>): Promise<Paginated<Product>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return request(`/api/products?${params}`);
}

export async function getProduct(id: string): Promise<Product> {
  return (await request<{ data: Product }>(`/api/products/${id}`)).data;
}

export async function getCategories(): Promise<Category[]> {
  return (await request<{ data: Category[] }>("/api/categories")).data;
}

export const formatPrice = (price: string) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(price));

export async function login(input: LoginInput): Promise<PublicUser> {
  return (await request<{ data: PublicUser }>("/api/auth/login", { method: "POST", body: input })).data;
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  return (await request<{ data: PublicUser }>("/api/auth/register", { method: "POST", body: input })).data;
}

export async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}

// 401 = no hay sesión (caso normal, no un error): devuelve null.
export async function getMe(): Promise<PublicUser | null> {
  try {
    return (await request<{ data: PublicUser }>("/api/auth/me")).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export interface Order {
  id: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  total: string;
  createdAt: string;
  items: { id: string; quantity: number; unitPrice: string; product?: Product }[];
}

export async function getCart(): Promise<Cart> {
  return (await request<{ data: Cart }>("/api/cart")).data;
}

export async function addToCart(productId: string, quantity = 1): Promise<Cart> {
  return (await request<{ data: Cart }>("/api/cart/items", { method: "POST", body: { productId, quantity } })).data;
}

export async function updateCartItem(productId: string, quantity: number): Promise<Cart> {
  return (await request<{ data: Cart }>(`/api/cart/items/${productId}`, { method: "PATCH", body: { quantity } })).data;
}

export function removeCartItem(productId: string): Promise<void> {
  return request<void>(`/api/cart/items/${productId}`, { method: "DELETE" });
}

export async function checkout(): Promise<{ orderId: string; checkoutUrl: string }> {
  return (await request<{ data: { orderId: string; checkoutUrl: string } }>("/api/orders/checkout", { method: "POST" })).data;
}

export async function getOrder(id: string): Promise<Order> {
  return (await request<{ data: Order }>(`/api/orders/${id}`)).data;
}

export async function getOrders(): Promise<Order[]> {
  return (await request<{ data: Order[] }>("/api/orders")).data;
}
