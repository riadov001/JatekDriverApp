import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart, restaurantId } = useCart();
  const [address, setAddress] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const createOrder = useMutation({
    mutationFn: api.orders.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      clearCart();
      toast({ title: "Order placed!", description: "Your food is on the way." });
      setLocation("/orders");
    },
    onError: (error: any) => {
      toast({ title: "Order failed", description: error.message, variant: "destructive" });
    }
  });

  const handleCheckout = () => {
    if (!restaurantId || items.length === 0) return;
    if (!address.trim()) {
      toast({ title: "Address required", description: "Please enter a delivery address", variant: "destructive" });
      return;
    }

    createOrder.mutate({
      restaurantId,
      deliveryAddress: address,
      items: items.map(i => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity,
        price: i.menuItem.price
      }))
    });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <Trash2 size={40} className="text-muted-foreground opacity-50" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-8">Browse Restaurants</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const deliveryFee = 15;
  const grandTotal = total + deliveryFee;

  return (
    <Layout>
      <div className="flex flex-col h-full bg-muted/30">
        <div className="p-4 bg-background sticky top-0 z-10 border-b border-border">
          <h1 className="text-2xl font-bold" data-testid="cart-title">Your Order</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="bg-background rounded-2xl p-4 shadow-sm border border-border">
            <h2 className="font-bold mb-4 text-lg">Items</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.menuItem.id} className="flex gap-4 items-center" data-testid={`cart-item-${item.menuItem.id}`}>
                  {item.menuItem.imageUrl ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                      <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-muted-foreground font-bold">{item.menuItem.name.charAt(0)}</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-2">{item.menuItem.name}</h3>
                    <p className="text-primary font-bold mt-1 text-sm">{item.menuItem.price.toFixed(2)} MAD</p>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-secondary/10 rounded-full px-1 py-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full hover:bg-secondary/20"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="font-medium text-sm min-w-[2ch] text-center">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 rounded-full hover:bg-secondary/20"
                      onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between">
              <Link href={`/restaurants/${restaurantId}`} className="text-sm font-medium text-primary flex items-center gap-1">
                <Plus size={16} /> Add more items
              </Link>
            </div>
          </div>

          <div className="bg-background rounded-2xl p-4 shadow-sm border border-border">
            <h2 className="font-bold mb-4 text-lg">Delivery Details</h2>
            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Input 
                id="address" 
                placeholder="Apartment, building, street, etc." 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="bg-muted/50"
                data-testid="input-delivery-address"
              />
            </div>
          </div>

          <div className="bg-background rounded-2xl p-4 shadow-sm border border-border">
            <h2 className="font-bold mb-4 text-lg">Order Summary</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{total.toFixed(2)} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee.toFixed(2)} MAD</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold text-lg text-foreground">
                <span>Total</span>
                <span>{grandTotal.toFixed(2)} MAD</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-background border-t border-border">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
            onClick={handleCheckout}
            disabled={createOrder.isPending || !address.trim()}
            data-testid="btn-checkout"
          >
            {createOrder.isPending ? "Placing Order..." : "Place Order"}
            {!createOrder.isPending && <ArrowRight size={20} className="ml-2" />}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
