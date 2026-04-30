import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2, ChefHat, Bike, Package } from "lucide-react";
import { format } from "date-fns";

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: api.orders.list,
    refetchInterval: 15000, // Poll every 15s
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="text-yellow-500" />;
      case 'accepted': return <CheckCircle2 className="text-blue-500" />;
      case 'preparing': return <ChefHat className="text-orange-500" />;
      case 'ready': return <Package className="text-purple-500" />;
      case 'delivering': return <Bike className="text-secondary" />;
      case 'delivered': return <CheckCircle2 className="text-green-500" />;
      case 'cancelled': return <CheckCircle2 className="text-destructive" />;
      default: return <Clock className="text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'accepted': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'preparing': return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'ready': return 'bg-purple-500/10 text-purple-600 border-purple-200';
      case 'delivering': return 'bg-secondary/10 text-secondary border-secondary/30';
      case 'delivered': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Layout>
      <div className="p-4 bg-background sticky top-0 z-10 border-b border-border">
        <h1 className="text-2xl font-bold" data-testid="orders-title">Your Orders</h1>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-border rounded-xl p-4">
                <div className="flex justify-between mb-4">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-5 w-1/4" />
                </div>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-8 w-full mt-4" />
              </div>
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Receipt size={32} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground">When you place orders, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const isLatest = index === 0 && !['delivered', 'cancelled'].includes(order.status.toLowerCase());
              
              return (
                <div 
                  key={order.id} 
                  className={`bg-card border rounded-2xl p-5 shadow-sm transition-all ${
                    isLatest ? 'border-primary shadow-primary/10' : 'border-border'
                  }`}
                  data-testid={`order-card-${order.id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{order.restaurant?.name || 'Restaurant'}</h3>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{order.totalAmount.toFixed(2)} MAD</p>
                    </div>
                  </div>

                  <div className="border-t border-b border-border py-3 my-4">
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {order.items?.map((item, i) => (
                        <li key={i} className="flex justify-between">
                          <span>{item.quantity}x {item.menuItemId}</span>
                          <span>{(item.price * item.quantity).toFixed(2)} MAD</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={`flex items-center gap-3 p-3 rounded-xl border ${getStatusColor(order.status)}`}>
                    <div className="shrink-0 bg-background rounded-full p-2">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <p className="font-bold capitalize text-sm">{order.status}</p>
                      {isLatest && order.status.toLowerCase() !== 'delivered' && (
                        <p className="text-xs opacity-80 mt-0.5">Auto-refreshing status...</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

// Quick fallback icon import missing above
import { Receipt } from "lucide-react";
