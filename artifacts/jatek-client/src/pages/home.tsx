import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function HomePage() {
  const [search, setSearch] = useState("");
  
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ["restaurants"],
    queryFn: api.restaurants.list,
  });

  const filtered = restaurants?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border pb-4 pt-6 px-4">
        <div className="flex items-center gap-2 mb-4 text-muted-foreground">
          <MapPin size={18} className="text-primary" />
          <span className="text-sm font-medium">Delivering to <strong className="text-foreground">Casablanca, Morocco</strong></span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search restaurants, cuisines..." 
            className="pl-10 bg-muted/50 border-transparent focus-visible:bg-background rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-restaurants"
          />
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-xl font-bold mb-4" data-testid="title-restaurants">Featured Restaurants</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl overflow-hidden border border-border">
                <Skeleton className="h-40 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No restaurants found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered?.map((restaurant) => (
              <Link 
                key={restaurant.id} 
                href={`/restaurants/${restaurant.id}`}
                className="block group"
                data-testid={`link-restaurant-${restaurant.id}`}
              >
                <div className="bg-card border border-border rounded-xl overflow-hidden hover-elevate transition-all active:scale-[0.98]">
                  <div className="h-40 w-full bg-muted relative">
                    {restaurant.imageUrl ? (
                      <img 
                        src={restaurant.imageUrl} 
                        alt={restaurant.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                        <span className="text-4xl font-bold text-secondary/30">{restaurant.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur px-2 py-1 rounded text-xs font-bold shadow-sm">
                      15-25 min
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{restaurant.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{restaurant.description || 'Local favorite'}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
