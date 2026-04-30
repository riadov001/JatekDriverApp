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
  cuisine?: string;
  deliveryTime?: number;
  minimumOrder?: number;
  deliveryFee?: number;
  rating?: number;
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

export interface ReceivedOrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderItem {
  menuItemId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderPayload {
  restaurantId: number;
  items: CreateOrderItem[];
  deliveryAddress: string;
}

export interface Order {
  id: number;
  reference: string;
  userId: number;
  restaurantId: number;
  driverId: number | null;
  restaurantName: string;
  userName: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  notes: string | null;
  estimatedDeliveryTime: number;
  kitchenCode: string | null;
  pickupCode: string | null;
  createdAt: string;
  updatedAt: string;
  items: ReceivedOrderItem[];
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
