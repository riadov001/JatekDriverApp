import crypto from "node:crypto";

export type Role = "client" | "driver" | "admin";
export type DriverStatus = "pending" | "approved" | "rejected";
export type VehicleType = "scooter" | "moto" | "voiture" | "velo";
export type OrderStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "picked_up"
  | "delivered"
  | "cancelled";

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
  lastLat?: number | null;
  lastLng?: number | null;
  lastLocationAt?: number | null;
};

export type User = {
  id: string;
  phone: string;
  role: Role;
  fullName?: string | null;
  driver?: DriverProfile | null;
};

export type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  distanceKm: number;
  priceMad: number;
  driverEarningsMad: number;
  customerName: string;
  customerPhone: string;
  notes?: string | null;
  createdAt: string;
  driverId?: string | null;
  deliveredAt?: number | null;
};

export const users = new Map<string, User>();
export const usersByPhone = new Map<string, string>();
export const otps = new Map<string, { code: string; expiresAt: number }>();
export const orders = new Map<string, Order>();

export function id(prefix = ""): string {
  return prefix + crypto.randomBytes(8).toString("hex");
}

export function code6(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function orderCode(): string {
  return "JTK-" + Math.floor(1000 + Math.random() * 9000).toString();
}

function seed(): void {
  if (orders.size > 0) return;
  const samples: Omit<Order, "id" | "code" | "createdAt">[] = [
    {
      status: "pending",
      pickupAddress: "Marjane Californie, Casablanca",
      dropoffAddress: "Résidence Al Manar, Maârif",
      pickupLat: 33.5731,
      pickupLng: -7.5898,
      dropoffLat: 33.5891,
      dropoffLng: -7.6273,
      distanceKm: 4.2,
      priceMad: 45,
      driverEarningsMad: 32,
      customerName: "Sofia Bennani",
      customerPhone: "+212600112233",
      notes: "Sonner à l'interphone, 3e étage.",
    },
    {
      status: "pending",
      pickupAddress: "BIM Bourgogne, Casablanca",
      dropoffAddress: "Twin Center, Maârif",
      pickupLat: 33.5972,
      pickupLng: -7.6342,
      dropoffLat: 33.5872,
      dropoffLng: -7.6324,
      distanceKm: 2.1,
      priceMad: 30,
      driverEarningsMad: 22,
      customerName: "Yassine Idrissi",
      customerPhone: "+212611445566",
      notes: null,
    },
    {
      status: "pending",
      pickupAddress: "Carrefour Sidi Maârouf",
      dropoffAddress: "Anfa Place Living Resort",
      pickupLat: 33.5331,
      pickupLng: -7.6358,
      dropoffLat: 33.5926,
      dropoffLng: -7.6647,
      distanceKm: 7.8,
      priceMad: 70,
      driverEarningsMad: 55,
      customerName: "Karim El Amrani",
      customerPhone: "+212622778899",
      notes: "Appeler à l'arrivée.",
    },
  ];
  for (const s of samples) {
    const oid = id("o_");
    orders.set(oid, {
      ...s,
      id: oid,
      code: orderCode(),
      createdAt: new Date().toISOString(),
      driverId: null,
      deliveredAt: null,
    });
  }
}

seed();
