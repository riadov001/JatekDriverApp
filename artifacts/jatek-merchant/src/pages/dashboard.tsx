import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Order } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRestaurant } from "@/lib/restaurantContext";
import { UtensilsCrossed, LogOut, Clock, MapPin, Search, Receipt, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { selectedRestaurant } = useRestaurant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", selectedRestaurant?.id],
    queryFn: () =>
      selectedRestaurant
        ? api.orders.listByRestaurant(selectedRestaurant.id)
        : Promise.resolve([]),
    enabled: !!selectedRestaurant,
    refetchInterval: 8000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      api.orders.updateStatus(orderId, status),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(
        ["orders", selectedRestaurant?.id],
        (old: Order[] | undefined) =>
          old ? old.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)) : []
      );
      toast({
        title: "Status updated",
        description: `Order ${updatedOrder.reference} marked as ${updatedOrder.status.replace(/_/g, " ")}`,
      });
      if (["ready", "picked_up", "delivered"].includes(updatedOrder.status)) {
        setSelectedOrderId(null);
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update order status",
      });
    },
  });

  if (!selectedRestaurant) {
    return null;
  }

  const pendingOrders = orders
    .filter((o) => o.status === "pending")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const preparingOrders = orders
    .filter((o) => o.status === "preparing")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const readyOrders = orders
    .filter((o) => o.status === "ready")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleUpdateStatus = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-6 text-sidebar-primary">
            <UtensilsCrossed className="w-6 h-6" />
            <h1 className="font-bold text-xl tracking-tight text-sidebar-primary-foreground">
              Jatek
            </h1>
          </div>
          <div>
            <p className="text-xs text-sidebar-accent-foreground font-medium uppercase tracking-wider mb-1">
              Restaurant
            </p>
            <p className="font-semibold truncate">{selectedRestaurant.name}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Button
            variant="secondary"
            className="w-full justify-start bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90"
            data-testid="nav-orders"
          >
            <Receipt className="mr-2 h-4 w-4" />
            Orders Board
          </Button>
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-medium">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-accent-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={logout}
            data-testid="btn-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b bg-background flex items-center px-6 justify-between flex-shrink-0">
          <h2 className="text-xl font-bold">Live Orders</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Auto-sync active
            </div>
            <span>{format(new Date(), "MMM d, h:mm a")}</span>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            <OrderColumn
              title="Pending"
              count={pendingOrders.length}
              orders={pendingOrders}
              isLoading={isLoading}
              onSelect={setSelectedOrderId}
              isPending
            />
            <OrderColumn
              title="Preparing"
              count={preparingOrders.length}
              orders={preparingOrders}
              isLoading={isLoading}
              onSelect={setSelectedOrderId}
            />
            <OrderColumn
              title="Ready for Pickup"
              count={readyOrders.length}
              orders={readyOrders}
              isLoading={isLoading}
              onSelect={setSelectedOrderId}
            />
          </div>
        </div>
      </main>

      {/* Order Detail Sheet */}
      <Sheet
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      >
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l border-border">
          {selectedOrder && (
            <>
              <div className="p-6 pb-4 border-b bg-muted/10">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant={
                      selectedOrder.status === "pending"
                        ? "destructive"
                        : selectedOrder.status === "preparing"
                        ? "default"
                        : selectedOrder.status === "ready"
                        ? "secondary"
                        : "outline"
                    }
                    className="uppercase text-xs tracking-wider"
                  >
                    {selectedOrder.status.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedOrder.createdAt), "h:mm a")}
                  </span>
                </div>
                <SheetTitle className="text-2xl mb-1 font-mono">
                  {selectedOrder.reference}
                </SheetTitle>
                <div className="flex items-center text-muted-foreground text-sm gap-2">
                  <span>{selectedOrder.userName}</span>
                  <span>•</span>
                  <span>{selectedOrder.items?.length || 0} items</span>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                  {/* Items List */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-start text-sm"
                        >
                          <div className="flex gap-3">
                            <span className="font-medium min-w-[24px]">
                              {item.quantity}x
                            </span>
                            <span>{item.menuItemName}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {item.totalPrice.toFixed(2)} MAD
                          </span>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{selectedOrder.total.toFixed(2)} MAD</span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      Delivery Details
                    </h4>
                    <div className="bg-muted p-3 rounded-md text-sm">
                      <p className="font-medium mb-1">{selectedOrder.userName}</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedOrder.deliveryAddress}
                      </p>
                      {selectedOrder.notes && (
                        <p className="text-muted-foreground mt-2 italic">
                          Note: {selectedOrder.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Actions Footer */}
              <div className="p-6 border-t bg-background mt-auto">
                {selectedOrder.status === "pending" && (
                  <Button
                    className="w-full h-12 text-base"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "preparing")}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`btn-accept-${selectedOrder.id}`}
                  >
                    Accept & Start Preparing
                  </Button>
                )}
                {selectedOrder.status === "preparing" && (
                  <Button
                    className="w-full h-12 text-base"
                    onClick={() => handleUpdateStatus(selectedOrder.id, "ready")}
                    disabled={updateStatusMutation.isPending}
                    data-testid={`btn-ready-${selectedOrder.id}`}
                  >
                    Mark Ready for Pickup
                  </Button>
                )}
                {["ready", "picked_up", "delivered"].includes(selectedOrder.status) && (
                  <Button
                    className="w-full h-12 text-base"
                    variant="outline"
                    onClick={() => setSelectedOrderId(null)}
                    data-testid="btn-close-panel"
                  >
                    Close Panel
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OrderColumn({
  title,
  count,
  orders,
  isLoading,
  onSelect,
  isPending = false,
}: {
  title: string;
  count: number;
  orders: Order[];
  isLoading: boolean;
  onSelect: (id: number) => void;
  isPending?: boolean;
}) {
  return (
    <div className="flex flex-col bg-muted/30 rounded-xl border border-border/50 h-full overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-background/50 flex justify-between items-center flex-shrink-0">
        <h3 className="font-semibold flex items-center gap-2">
          {title}
          <Badge
            variant="secondary"
            className="rounded-full px-2 py-0.5 text-xs font-mono"
          >
            {count}
          </Badge>
        </h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </>
          ) : orders.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              <Search className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No {title.toLowerCase()} orders</p>
            </div>
          ) : (
            orders.map((order) => {
              const minutesAgo = Math.floor(
                (new Date().getTime() - new Date(order.createdAt).getTime()) / 60000
              );
              const isUrgent = isPending && minutesAgo > 5;

              return (
                <Card
                  key={order.id}
                  className={`cursor-pointer hover:border-primary/50 transition-colors shadow-sm ${
                    isUrgent ? "border-destructive/50 shadow-destructive/10" : ""
                  }`}
                  onClick={() => onSelect(order.id)}
                  data-testid={`order-card-${order.id}`}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {order.reference}
                      </span>
                      <div
                        className={`text-xs font-medium flex items-center gap-1 ${
                          isUrgent ? "text-destructive" : "text-muted-foreground"
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(order.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>

                    <h4 className="font-semibold text-base mb-1 truncate">
                      {order.userName}
                    </h4>

                    <div className="flex justify-between items-end mt-3 text-sm">
                      <span className="text-muted-foreground">
                        {order.items?.length || 0} items
                      </span>
                      <span className="font-bold">{order.total.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
