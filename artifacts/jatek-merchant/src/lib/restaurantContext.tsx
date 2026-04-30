import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Restaurant } from "./api";
import { useAuth } from "./auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface RestaurantContextType {
  selectedRestaurant: Restaurant | null;
  setRestaurant: (restaurant: Restaurant) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { data: restaurants, isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: api.restaurants.list,
    enabled: !!user,
  });

  useEffect(() => {
    if (user && restaurants) {
      const storedId = api.getRestaurantId();
      if (storedId) {
        const found = restaurants.find((r) => r.id === storedId);
        if (found) {
          setSelectedRestaurant(found);
          return;
        }
      }
      
      // No valid stored ID
      if (restaurants.length === 1) {
        setRestaurant(restaurants[0]);
      } else if (restaurants.length > 1) {
        setIsPickerOpen(true);
      }
    }
  }, [user, restaurants]);

  const setRestaurant = (restaurant: Restaurant) => {
    api.setRestaurantId(restaurant.id);
    setSelectedRestaurant(restaurant);
    setIsPickerOpen(false);
  };

  return (
    <RestaurantContext.Provider value={{ selectedRestaurant, setRestaurant }}>
      {children}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="sm:max-w-md" hideClose>
          <DialogHeader>
            <DialogTitle>Select Restaurant</DialogTitle>
            <DialogDescription>
              Choose a restaurant to manage orders.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            {isRestaurantsLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : restaurants?.length ? (
              restaurants.map((restaurant) => (
                <Button
                  key={restaurant.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left"
                  onClick={() => setRestaurant(restaurant)}
                  data-testid={`btn-select-restaurant-${restaurant.id}`}
                >
                  <span className="font-medium text-base">{restaurant.name}</span>
                  {restaurant.address && (
                    <span className="text-sm text-muted-foreground mt-1">
                      {restaurant.address}
                    </span>
                  )}
                </Button>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No restaurants found for your account.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
