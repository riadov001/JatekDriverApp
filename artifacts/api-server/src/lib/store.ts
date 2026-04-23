import crypto from "node:crypto";

export type Role = "client" | "driver" | "admin";
export type DriverStatus = "pending" | "approved" | "rejected";
export type VehicleType = "scooter" | "moto" | "voiture" | "velo";
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
  driverId?: string | null;
  acceptedAt?: number | null;
  deliveredAt?: number | null;
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

export function code4(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function orderCode(): string {
  return "JTK-" + Math.floor(1000 + Math.random() * 9000).toString();
}

export function promotionsFor(_driverId: string | null | undefined): Promotion[] {
  const tomorrow = new Date();
  tomorrow.setHours(23, 59, 0, 0);
  return [
    {
      id: "quest_5",
      title: "Quête du jour",
      description: "Complétez 5 livraisons avant minuit",
      bonusMad: 50,
      required: 5,
      progress: 0,
      expiresAt: tomorrow.toISOString(),
    },
    {
      id: "quest_peak",
      title: "Pointe du soir",
      description: "Bonus +20 DH par course entre 19h et 22h",
      bonusMad: 20,
      required: 1,
      progress: 0,
      expiresAt: tomorrow.toISOString(),
    },
  ];
}

function seed(): void {
  if (orders.size > 0) return;
  const samples: Omit<Order, "id" | "code" | "createdAt" | "deliveryCode">[] = [
    {
      status: "pending",
      restaurantName: "Pizza Hut Californie",
      restaurantPhone: "+212522555000",
      pickupAddress: "Marjane Californie, Casablanca",
      dropoffAddress: "Résidence Al Manar, Maârif",
      pickupLat: 33.5731,
      pickupLng: -7.5898,
      dropoffLat: 33.5891,
      dropoffLng: -7.6273,
      distanceKm: 4.2,
      etaMinutes: 18,
      items: [
        { name: "Pizza Margherita", quantity: 1, options: "Grande" },
        { name: "Coca-Cola 33cl", quantity: 2, options: null },
        { name: "Tiramisu", quantity: 1, options: null },
      ],
      subtotalMad: 145,
      priceMad: 165,
      driverEarningsMad: 32,
      tipMad: 10,
      paymentMethod: "online",
      customerName: "Sofia Bennani",
      customerPhone: "+212600112233",
      notes: "Sonner à l'interphone, 3e étage.",
      driverId: null,
      acceptedAt: null,
      deliveredAt: null,
    },
    {
      status: "pending",
      restaurantName: "Tacos de Lyon Bourgogne",
      restaurantPhone: "+212522666111",
      pickupAddress: "BIM Bourgogne, Casablanca",
      dropoffAddress: "Twin Center, Maârif",
      pickupLat: 33.5972,
      pickupLng: -7.6342,
      dropoffLat: 33.5872,
      dropoffLng: -7.6324,
      distanceKm: 2.1,
      etaMinutes: 12,
      items: [
        { name: "Tacos M classique", quantity: 1, options: "Sauce algérienne" },
        { name: "Frites", quantity: 1, options: null },
      ],
      subtotalMad: 65,
      priceMad: 75,
      driverEarningsMad: 22,
      tipMad: 0,
      paymentMethod: "cash",
      customerName: "Yassine Idrissi",
      customerPhone: "+212611445566",
      notes: null,
      driverId: null,
      acceptedAt: null,
      deliveredAt: null,
    },
    {
      status: "pending",
      restaurantName: "Sushi Yana Sidi Maârouf",
      restaurantPhone: "+212522777222",
      pickupAddress: "Carrefour Sidi Maârouf",
      dropoffAddress: "Anfa Place Living Resort",
      pickupLat: 33.5331,
      pickupLng: -7.6358,
      dropoffLat: 33.5926,
      dropoffLng: -7.6647,
      distanceKm: 7.8,
      etaMinutes: 28,
      items: [
        { name: "Plateau Sushi 24p", quantity: 1, options: "Mix saumon/thon" },
        { name: "Soupe miso", quantity: 2, options: null },
      ],
      subtotalMad: 280,
      priceMad: 305,
      driverEarningsMad: 55,
      tipMad: 15,
      paymentMethod: "card",
      customerName: "Karim El Amrani",
      customerPhone: "+212622778899",
      notes: "Appeler à l'arrivée, code portail 4521.",
      driverId: null,
      acceptedAt: null,
      deliveredAt: null,
    },
  ];
  for (const s of samples) {
    const oid = id("o_");
    orders.set(oid, {
      ...s,
      id: oid,
      code: orderCode(),
      createdAt: new Date().toISOString(),
      deliveryCode: code4(),
    });
  }
}

seed();
