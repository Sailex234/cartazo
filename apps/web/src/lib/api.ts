import type { ProductQuery } from "@cartazo/shared";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

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

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error?.message ?? res.statusText, res.status, body?.error?.code);
  }
  return res.json();
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
