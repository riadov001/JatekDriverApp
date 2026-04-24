import { clearToken, getToken, setToken } from "./auth";
import { getApiTarget, getBaseUrl } from "./apiTarget";

export type ApiError = { status: number; message: string; data?: unknown };

async function request<T>(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<T> {
  const target = await getApiTarget();
  const base = getBaseUrl(target);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${base}${path}`, { ...init, headers });
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
        : data && typeof data === "object" && "error" in data
          ? String((data as { error: unknown }).error)
          : null) ?? `Request failed (${res.status})`;
    const err: ApiError = { status: res.status, message, data };
    throw err;
  }
  return data as T;
}

// ───────────────────────── Common types (in-app) ─────────────────────────

export type Role = "client" | "driver" | "admin";

export type Me = {
  id: string;
  phone: string;
  role: Role;
  fullName?: string | null;
  email?: string | null;
  driver?: DriverProfile | null;
};

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

export type EarningsSummary = {
  todayMad: number;
  weekMad: number;
  monthMad: number;
  todayDeliveries: number;
  weekDeliveries: number;
  todayTipsMad: number;
  weekTipsMad: number;
};

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
  const target = await getApiTarget();
  if (target === "prod") {
    throw {
      status: 400,
      message:
        "Le backend de production utilise email + mot de passe. Utilisez l'écran connexion par email.",
    } as ApiError;
  }
  return request<VerifyOtpResponse>(
    "/auth/verify-otp",
    {
      method: "POST",
      body: JSON.stringify({ phone, code, role: "driver" }),
    },
    false,
  );
}

export type LoginResponse = { token: string; user?: unknown };

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const data = await request<Record<string, unknown>>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false,
  );
  // Try common token field names
  const token =
    (typeof data.token === "string" && data.token) ||
    (typeof data.accessToken === "string" && data.accessToken) ||
    (typeof data.access_token === "string" && data.access_token) ||
    (typeof data.jwt === "string" && data.jwt) ||
    null;
  if (!token) {
    throw {
      status: 500,
      message: "Réponse de login invalide (aucun token trouvé).",
      data,
    } as ApiError;
  }
  await setToken(token);
  return { token };
}

export async function logout(): Promise<void> {
  const target = await getApiTarget();
  if (target === "prod") {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
  }
  await clearToken();
}

// ───────────────────────── Field mappers (prod → in-app) ─────────────────────────

function normalizeVehicleType(raw: unknown): VehicleType {
  const v = String(raw ?? "").toLowerCase();
  if (v.startsWith("vel") || v.includes("bike")) return "velo";
  if (v.startsWith("vo") || v.includes("car")) return "voiture";
  if (v.startsWith("mo") && !v.startsWith("mot")) return "moto";
  if (v.startsWith("mot")) return "moto";
  if (v.startsWith("sc")) return "scooter";
  return "moto";
}

type ProdDriver = {
  id: number;
  userId: number;
  name: string | null;
  phone: string | null;
  vehicleType: string | null;
  vehiclePlate: string | null;
  nationalId: string | null;
  licenseNumber: string | null;
  photoUrl: string | null;
  profileCompletedAt: string | null;
  isAvailable: boolean | null;
  totalDeliveries: number | null;
  rating: number | null;
};

function mapProdDriver(d: ProdDriver): DriverProfile {
  return {
    id: String(d.id),
    fullName: d.name ?? "",
    vehicleType: normalizeVehicleType(d.vehicleType),
    vehiclePlate: d.vehiclePlate ?? "",
    cin: d.nationalId ?? "",
    licenseNumber: d.licenseNumber ?? "",
    photoUrl: d.photoUrl,
    status: d.profileCompletedAt ? "approved" : "pending",
    isOnline: Boolean(d.isAvailable),
    rating: d.rating,
  };
}

type ProdOrderItem = {
  id: number;
  menuItemName: string;
  quantity: number;
};

type ProdOrder = {
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
  items?: ProdOrderItem[];
};

function mapProdStatus(s: string): OrderStatus {
  const v = s.toLowerCase();
  if (v === "pending" || v === "placed" || v === "new") return "pending";
  if (v === "accepted" || v === "confirmed" || v === "preparing")
    return "accepted";
  if (v === "ready" || v === "ready_for_pickup") return "assigned";
  if (v === "driver_at_restaurant" || v === "arrived_pickup")
    return "arrived_pickup";
  if (v === "picked_up" || v === "in_delivery" || v === "out_for_delivery")
    return "picked_up";
  if (v === "arrived_dropoff" || v === "at_customer") return "arrived_dropoff";
  if (v === "delivered" || v === "completed") return "delivered";
  if (v === "cancelled" || v === "canceled") return "cancelled";
  return "pending";
}

function mapProdOrder(o: ProdOrder): Order {
  return {
    id: String(o.id),
    code: o.reference ?? `JTK-${o.id}`,
    status: mapProdStatus(o.status),
    restaurantName: o.restaurantName ?? "",
    restaurantPhone: "",
    pickupAddress: o.restaurantName ?? "",
    dropoffAddress: o.deliveryAddress ?? "",
    pickupLat: 0,
    pickupLng: 0,
    dropoffLat: 0,
    dropoffLng: 0,
    distanceKm: 0,
    etaMinutes: o.estimatedDeliveryTime ?? 30,
    items: (o.items ?? []).map((it) => ({
      name: it.menuItemName,
      quantity: it.quantity,
    })),
    subtotalMad: o.subtotal ?? 0,
    priceMad: o.total ?? 0,
    driverEarningsMad: o.deliveryFee ?? 0,
    tipMad: 0,
    paymentMethod: "cash",
    deliveryCode: o.pickupCode ?? "",
    customerName: o.userName ?? "",
    customerPhone: "",
    notes: o.notes,
    createdAt: o.createdAt,
  };
}

// ───────────────────────── Users ─────────────────────────

type ProdMe = {
  id: number;
  email?: string;
  phone?: string;
  name?: string;
  role?: string;
  driver?: ProdDriver;
};

export async function getMe(): Promise<Me> {
  const target = await getApiTarget();
  if (target === "prod") {
    const u = await request<ProdMe>("/auth/me");
    return {
      id: String(u.id),
      phone: u.phone ?? "",
      email: u.email ?? null,
      role: ((u.role as Role) ?? "driver") as Role,
      fullName: u.name ?? null,
      driver: u.driver ? mapProdDriver(u.driver) : null,
    };
  }
  return request<Me>("/users/me");
}

// ───────────────────────── Driver profile ─────────────────────────

export async function submitDriverOnboarding(
  payload: DriverOnboardingPayload,
): Promise<DriverProfile> {
  const target = await getApiTarget();
  if (target === "prod") {
    const me = await getMe();
    const driverId = me.driver?.id ?? me.id;
    const body = {
      name: payload.fullName,
      vehicleType: payload.vehicleType,
      vehiclePlate: payload.vehiclePlate,
      nationalId: payload.cin,
      licenseNumber: payload.licenseNumber,
      photoUrl: payload.photoUrl ?? null,
      profileCompletedAt: new Date().toISOString(),
    };
    const updated = await request<ProdDriver>(`/drivers/${driverId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return mapProdDriver(updated);
  }
  return request<DriverProfile>("/drivers/me/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function setDriverOnline(
  isOnline: boolean,
): Promise<{ isOnline: boolean }> {
  const target = await getApiTarget();
  if (target === "prod") {
    const me = await getMe();
    const driverId = me.driver?.id ?? me.id;
    await request<ProdDriver>(`/drivers/${driverId}`, {
      method: "PATCH",
      body: JSON.stringify({ isAvailable: isOnline }),
    });
    return { isOnline };
  }
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
  const target = await getApiTarget();
  if (target === "prod") {
    const me = await getMe();
    const driverId = me.driver?.id ?? me.id;
    await request(`/drivers/${driverId}/location`, {
      method: "PATCH",
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
    });
    return { ok: true };
  }
  return request<{ ok: true }>("/drivers/me/location", {
    method: "PATCH",
    body: JSON.stringify(coords),
  });
}

// ───────────────────────── Orders ─────────────────────────

export async function listAvailableOrders(): Promise<Order[]> {
  const target = await getApiTarget();
  if (target === "prod") {
    const list = await request<ProdOrder[]>("/orders/available");
    return list.map(mapProdOrder);
  }
  return request<Order[]>("/orders/available");
}

export async function listMyOrders(): Promise<Order[]> {
  const target = await getApiTarget();
  if (target === "prod") {
    try {
      const me = await getMe();
      const driverId = me.driver?.id ?? me.id;
      const list = await request<ProdOrder[]>(`/orders?driverId=${driverId}`);
      return list.map(mapProdOrder);
    } catch {
      return [];
    }
  }
  return request<Order[]>("/orders/mine");
}

export async function getOrder(id: string): Promise<Order> {
  const target = await getApiTarget();
  if (target === "prod") {
    const o = await request<ProdOrder>(`/orders/${id}`);
    return mapProdOrder(o);
  }
  return request<Order>(`/orders/${id}`);
}

async function prodPatchOrderStatus(id: string, status: string): Promise<Order> {
  const o = await request<ProdOrder>(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return mapProdOrder(o);
}

export async function acceptOrder(id: string): Promise<Order> {
  const target = await getApiTarget();
  if (target === "prod") {
    const me = await getMe();
    const driverId = me.driver?.id ?? me.id;
    const o = await request<ProdOrder>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ driverId: Number(driverId), status: "accepted" }),
    });
    return mapProdOrder(o);
  }
  return request<Order>(`/orders/${id}/accept`, { method: "POST" });
}

export async function markArrivedPickup(id: string): Promise<Order> {
  const target = await getApiTarget();
  if (target === "prod") return prodPatchOrderStatus(id, "driver_at_restaurant");
  return request<Order>(`/orders/${id}/arrived-pickup`, { method: "POST" });
}

export async function markPickedUp(id: string): Promise<Order> {
  const target = await getApiTarget();
  if (target === "prod") return prodPatchOrderStatus(id, "picked_up");
  return request<Order>(`/orders/${id}/picked-up`, { method: "POST" });
}

export async function markArrivedDropoff(id: string): Promise<Order> {
  const target = await getApiTarget();
  if (target === "prod") return prodPatchOrderStatus(id, "out_for_delivery");
  return request<Order>(`/orders/${id}/arrived-dropoff`, { method: "POST" });
}

export async function markDelivered(
  id: string,
  deliveryCode: string,
): Promise<Order> {
  const target = await getApiTarget();
  if (target === "prod") {
    const o = await request<ProdOrder>(`/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "delivered", pickupCode: deliveryCode }),
    });
    return mapProdOrder(o);
  }
  return request<Order>(`/orders/${id}/delivered`, {
    method: "POST",
    body: JSON.stringify({ deliveryCode }),
  });
}

export async function cancelOrder(id: string): Promise<Order> {
  const target = await getApiTarget();
  if (target === "prod") return prodPatchOrderStatus(id, "cancelled");
  return request<Order>(`/orders/${id}/cancel`, { method: "POST" });
}

// ───────────────────────── Earnings & Promos ─────────────────────────

export async function getEarnings(): Promise<EarningsSummary> {
  const target = await getApiTarget();
  if (target === "prod") {
    try {
      const me = await getMe();
      const driverId = me.driver?.id ?? me.id;
      return await request<EarningsSummary>(`/drivers/${driverId}/earnings`);
    } catch {
      return {
        todayMad: 0,
        weekMad: 0,
        monthMad: 0,
        todayDeliveries: 0,
        weekDeliveries: 0,
        todayTipsMad: 0,
        weekTipsMad: 0,
      };
    }
  }
  return request<EarningsSummary>("/drivers/me/earnings");
}

export async function getPromotions(): Promise<Promotion[]> {
  const target = await getApiTarget();
  if (target === "prod") return [];
  return request<Promotion[]>("/drivers/me/promotions");
}

// ───────────────────────── Live Tracking ─────────────────────────

export type TrackingInfo =
  | { available: false }
  | {
      available: true;
      latitude: number;
      longitude: number;
      heading: number | null;
      updatedAt: number | null;
      orderStatus: OrderStatus;
      pickupLat: number;
      pickupLng: number;
      dropoffLat: number;
      dropoffLng: number;
    };

export async function getOrderTracking(orderId: string): Promise<TrackingInfo> {
  return request<TrackingInfo>(`/orders/${orderId}/tracking`);
}
