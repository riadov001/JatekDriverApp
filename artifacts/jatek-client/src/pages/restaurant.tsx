import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { api } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Info, Plus, Minus } from "lucide-react";
import { useCart } from "@/lib/cart";

export default function RestaurantPage() {
  const { id } = useParams();
  const restaurantId = parseInt(id || "0", 10);
  const { addItem, updateQuantity, items, restaurantId: cartRestaurantId } = useCart();
  const [, setLocation] = useLocation();

  const { data: restaurants, isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: api.restaurants.list,
  });

  const restaurant = restaurants?.find(r => r.id === restaurantId);

  const { data: menu, isLoading: isMenuLoading } = useQuery({
    queryKey: ["restaurant-menu", restaurantId],
    queryFn: () => api.restaurants.menu(restaurantId),
    enabled: !!restaurantId,
  });

  // Group menu by category
  const groupedMenu = menu?.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof menu>) || {};

  const getItemQuantity = (itemId: number) => {
    const item = items.find(i => i.menuItem.id === itemId);
    return item?.quantity || 0;
  };

  const handleAdd = (item: any) => {
    addItem(item, 1);
  };

  const handleSubtract = (itemId: number) => {
    const qty = getItemQuantity(itemId);
    if (qty > 0) {
      updateQuantity(itemId, qty - 1);
    }
  };

  const cartTotalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  if (isRestaurantsLoading || (isMenuLoading && !menu)) {
    return (
      <Layout showNav={false}>
        <div className="h-64 w-full bg-muted animate-pulse" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="pt-8 space-y-6">
            <Skeleton className="h-6 w-1/4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/4 pt-2" />
                </div>
                <Skeleton className="h-24 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!restaurant) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Restaurant not found</h2>
          <Link href="/">
            <Button>Go back</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <div className="relative">
        <Link href="/">
          <Button variant="outline" size="icon" className="absolute top-4 left-4 z-10 rounded-full bg-background/80 backdrop-blur border-none hover:bg-background shadow-sm">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        
        <div className="h-56 w-full bg-muted relative">
          {restaurant.imageUrl ? (
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/10">
              <span className="text-5xl font-bold text-secondary/30">{restaurant.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="px-4 py-6 bg-background rounded-t-3xl -mt-6 relative z-10">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold text-foreground" data-testid="restaurant-name">{restaurant.name}</h1>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Info size={20} className="text-muted-foreground" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="bg-secondary/10 text-secondary-foreground px-2 py-1 rounded font-medium">15-25 min</span>
            {restaurant.address && <span>{restaurant.address}</span>}
          </div>
          
          <div className="space-y-8 pb-24">
            {Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-xl font-bold mb-4 capitalize">{category}</h2>
                <div className="space-y-4">
                  {items?.map((item) => {
                    const qty = getItemQuantity(item.id);
                    return (
                      <div key={item.id} className="flex gap-4 p-4 bg-card border border-border rounded-xl shadow-sm" data-testid={`menu-item-${item.id}`}>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-foreground">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="font-bold text-primary">{item.price.toFixed(2)} MAD</span>
                            
                            {qty > 0 ? (
                              <div className="flex items-center gap-3 bg-secondary/10 rounded-full px-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full hover:bg-secondary/20"
                                  onClick={() => handleSubtract(item.id)}
                                >
                                  <Minus size={16} />
                                </Button>
                                <span className="font-medium min-w-[1ch] text-center">{qty}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full hover:bg-secondary/20"
                                  onClick={() => handleAdd(item)}
                                >
                                  <Plus size={16} />
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                className="rounded-full"
                                onClick={() => handleAdd(item)}
                                data-testid={`btn-add-${item.id}`}
                              >
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                        {item.imageUrl && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {cartTotalItems > 0 && cartRestaurantId === restaurantId && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border flex justify-center pb-safe">
          <div className="w-full max-w-[420px]">
            <Button 
              className="w-full h-14 text-lg font-bold flex justify-between items-center px-6 shadow-lg shadow-primary/20"
              onClick={() => setLocation("/cart")}
              data-testid="btn-view-cart"
            >
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {cartTotalItems}
              </div>
              <span>View Cart</span>
              <span>{items.reduce((sum, i) => sum + (i.menuItem.price * i.quantity), 0).toFixed(2)} MAD</span>
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
