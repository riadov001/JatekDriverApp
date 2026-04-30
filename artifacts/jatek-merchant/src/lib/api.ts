const BASE_URL = "https://ma.jatek.app/api";
const TOKEN_KEY = "jatek_merchant_token";
const RESTAURANT_ID_KEY = "jatek_merchant_restaurantId";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  ownerId?: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menuItem?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  status: "pending" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
  customer?: {
    id: string;
    name: string;
  };
  items?: OrderItem[];
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getRestaurantId() {
  return localStorage.getItem(RESTAURANT_ID_KEY);
}

function setRestaurantId(id: string) {
  localStorage.setItem(RESTAURANT_ID_KEY, id);
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  getToken,
  setToken,
  clearToken,
  getRestaurantId,
  setRestaurantId,
  auth: {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return data;
    },
    me: async (): Promise<User> => {
      return request("/auth/me");
    },
    register: async (name: string, email: string, password: string): Promise<{ token: string; user: User }> => {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role: "restaurant_owner" }),
      });
      return data;
    },
  },
  restaurants: {
    list: async (): Promise<Restaurant[]> => {
      return request("/restaurants");
    },
  },
  orders: {
    listByRestaurant: async (restaurantId: string): Promise<Order[]> => {
      return request(`/orders?restaurantId=${restaurantId}`);
    },
    updateStatus: async (orderId: string, status: string): Promise<Order> => {
      return request(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },
};
