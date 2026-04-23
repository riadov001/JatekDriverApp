import { getToken } from "./auth";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
export const API_BASE = DOMAIN ? `https://${DOMAIN}/api` : "/api";

export type ApiError = { status: number; message: string; data?: unknown };

async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : null) ?? `Request failed (${res.status})`;
    const err: ApiError = { status: res.status, message, data };
    throw err;
  }
  return data as T;
}

// ───────────────────────── Auth ─────────────────────────

export type SendOtpResponse = { ok: true; debugCode?: string };
export type VerifyOtpResponse = { token: string; isNewUser: boolean };

export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  return request<SendOtpResponse>(
    "/auth/send-otp",
    { method: "POST", body: JSON.stringify({ phone, role: "driver" }) },
    false,
  );
}

export async function verifyOtp(
  phone: string,
  code: string,
): Promise<VerifyOtpResponse> {
  return request<VerifyOtpResponse>(
    "/auth/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ phone, code, role: "driver" }),
    },
    false,
  );
}

// ───────────────────────── Users ─────────────────────────

export type Role = "client" | "driver" | "admin";
export type Me = {
  id: string;
  phone: string;
  role: Role;
  fullName?: string | null;
  driver?: DriverProfile | null;
};

export async function getMe(): Promise<Me> {
  return request<Me>("/users/me");
}

// ───────────────────────── Driver profile ─────────────────────────

export type DriverStatus = "pending" | "approved" | "rejected";
export type VehicleType = "scooter" | "moto" | "voiture" | "velo";

export type DriverProfile = {
  id: string;
  fullName: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  cin: string;
  licenseNumber: string;
  photoUrl?: string | null;
  status: DriverStatus;
  isOnline: boolean;
  rating?: number | null;
};

export type DriverOnboardingPayload = {
  fullName: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  cin: string;
  licenseNumber: string;
  photoUrl?: string | null;
};

export async function submitDriverOnboarding(
  payload: DriverOnboardingPayload,
): Promise<DriverProfile> {
  return request<DriverProfile>("/drivers/me/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function setDriverOnline(
  isOnline: boolean,
): Promise<{ isOnline: boolean }> {
  return request<{ isOnline: boolean }>("/drivers/me/status", {
    method: "PATCH",
    body: JSON.stringify({ isOnline }),
  });
}

export async function updateDriverLocation(coords: {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
}): Promise<{ ok: true }> {
  return request<{ ok: true }>("/drivers/me/location", {
    method: "PATCH",
    body: JSON.stringify(coords),
  });
}

// ───────────────────────── Orders ─────────────────────────

export type OrderStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "arrived_pickup"
  | "picked_up"
  | "arrived_dropoff"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cash" | "card" | "online";

export type OrderItem = {
  name: string;
  quantity: number;
  options?: string | null;
};

export type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  restaurantName: string;
  restaurantPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  etaMinutes: number;
  items: OrderItem[];
  subtotalMad: number;
  priceMad: number;
  driverEarningsMad: number;
  tipMad: number;
  paymentMethod: PaymentMethod;
  deliveryCode: string;
  customerName: string;
  customerPhone: string;
  notes?: string | null;
  createdAt: string;
};

export type Promotion = {
  id: string;
  title: string;
  description: string;
  bonusMad: number;
  required: number;
  progress: number;
  expiresAt: string;
};

export async function listAvailableOrders(): Promise<Order[]> {
  return request<Order[]>("/orders/available");
}

export async function listMyOrders(): Promise<Order[]> {
  return request<Order[]>("/orders/mine");
}

export async function getOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}`);
}

export async function acceptOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/accept`, { method: "POST" });
}

export async function markArrivedPickup(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/arrived-pickup`, { method: "POST" });
}

export async function markPickedUp(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/picked-up`, { method: "POST" });
}

export async function markArrivedDropoff(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/arrived-dropoff`, { method: "POST" });
}

export async function markDelivered(
  id: string,
  deliveryCode: string,
): Promise<Order> {
  return request<Order>(`/orders/${id}/delivered`, {
    method: "POST",
    body: JSON.stringify({ deliveryCode }),
  });
}

export async function cancelOrder(id: string): Promise<Order> {
  return request<Order>(`/orders/${id}/cancel`, { method: "POST" });
}

// ───────────────────────── Earnings ─────────────────────────

export type EarningsSummary = {
  todayMad: number;
  weekMad: number;
  monthMad: number;
  todayDeliveries: number;
  weekDeliveries: number;
  todayTipsMad: number;
  weekTipsMad: number;
};

export async function getEarnings(): Promise<EarningsSummary> {
  return request<EarningsSummary>("/drivers/me/earnings");
}

export async function getPromotions(): Promise<Promotion[]> {
  return request<Promotion[]>("/drivers/me/promotions");
}
