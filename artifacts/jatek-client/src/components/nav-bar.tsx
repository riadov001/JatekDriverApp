import { Link, useLocation } from "wouter";
import { Home, ShoppingCart, Receipt } from "lucide-react";
import { useCart } from "@/lib/cart";

export function NavBar() {
  const [location] = useLocation();
  const { items } = useCart();
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/cart", icon: ShoppingCart, label: "Cart", badge: itemCount },
    { href: "/orders", icon: Receipt, label: "Orders" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="max-w-[420px] mx-auto w-full flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link 
              key={href} 
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`nav-${label.toLowerCase()}`}
            >
              <div className="relative">
                <Icon size={24} className={isActive ? "fill-primary/20 stroke-[1.5]" : "stroke-[1.5]"} />
                {badge && badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-[16px] flex items-center justify-center rounded-full px-1">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
