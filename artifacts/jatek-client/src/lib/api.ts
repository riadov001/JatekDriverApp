export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}
export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  imageUrl?: string;
}
export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  restaurantId: number;
}
export interface OrderItem {
  menuItemId: number;
  quantity: number;
  price: number;
}
export interface CreateOrderPayload {
  restaurantId: number;
  items: OrderItem[];
  deliveryAddress: string;
}
export interface Order {
  id: number;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  restaurant?: Restaurant;
  items?: OrderItem[];
}

const BASE = "https://ma.jatek.app/api";

function getToken(): string | null {
  return localStorage.getItem("jatek_token");
}

function setToken(token: string): void {
  localStorage.setItem("jatek_token", token);
}

function clearToken(): void {
  localStorage.removeItem("jatek_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role: "customer" }),
      }),
    me: () => request<User>("/auth/me"),
  },
  restaurants: {
    list: () => request<Restaurant[]>("/restaurants"),
    menu: (restaurantId: number) =>
      request<MenuItem[]>(`/restaurants/${restaurantId}/menu`),
  },
  orders: {
    create: (data: CreateOrderPayload) =>
      request<Order>("/orders", { method: "POST", body: JSON.stringify(data) }),
    list: () => request<Order[]>("/orders"),
  },
  getToken,
  setToken,
  clearToken,
};
