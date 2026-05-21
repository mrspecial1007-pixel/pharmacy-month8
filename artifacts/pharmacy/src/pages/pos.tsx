import { useState } from "react";
import { useGetMedicines, useGetCustomers, useCreateSale } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function POS() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const { data: medicines, isLoading: isLoadingMed } = useGetMedicines({ search: search.length > 2 ? search : undefined });
  const { data: customers } = useGetCustomers({});
  const createSale = useCreateSale();
  
  const [cart, setCart] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string>("1");
  const [discount, setDiscount] = useState(0);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const addToCart = (med: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === med.id);
      if (existing) {
        return prev.map(i => i.id === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: med.id, name: med.name, price: med.salePrice, quantity: 1, stock: med.quantity }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, Math.min(item.quantity + delta, item.stock));
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    createSale.mutate({
      data: {
        customerId: customerId ? Number(customerId) : undefined,
        discount,
        items: cart.map(i => ({ medicineId: i.id, quantity: i.quantity, unitPrice: i.price }))
      }
    }, {
      onSuccess: () => {
        toast({ title: "تم إتمام البيع بنجاح" });
        setCart([]);
        setDiscount(0);
      }
    });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="البحث عن دواء (الاسم أو الباركود)..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-3 pr-9 h-12 text-lg"
                dir="rtl"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {isLoadingMed ? (
                Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
              ) : (
                medicines?.map(med => (
                  <div 
                    key={med.id} 
                    onClick={() => addToCart(med)}
                    className="border rounded-xl p-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all select-none flex flex-col justify-between h-32 relative overflow-hidden"
                  >
                    <div className="font-semibold truncate">{med.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{med.scientificName}</div>
                    <div className="flex justify-between items-center mt-auto">
                      <div className="text-lg font-bold text-primary">${med.salePrice}</div>
                      <div className="text-xs px-2 py-1 bg-secondary rounded-md">{med.quantity} {med.unit}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Cart */}
      <Card className="w-full lg:w-[400px] xl:w-[450px] flex flex-col overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            سلة المشتريات
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-0">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>السلة فارغة</p>
              <p className="text-sm">قم بإضافة أدوية للبدء</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.id} className="p-4 flex gap-3">
                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-primary font-medium mt-1">${item.price}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 bg-secondary rounded-md p-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive mt-auto" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="p-4 border-t bg-muted/30 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">العميل</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر العميل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">عميل نقدي (افتراضي)</SelectItem>
                {customers?.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">الخصم ($)</label>
            <Input type="number" min="0" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>الخصم</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl pt-2">
              <span>الإجمالي</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            className="w-full h-12 text-lg font-bold mt-2" 
            disabled={cart.length === 0 || createSale.isPending}
            onClick={handleCheckout}
          >
            {createSale.isPending ? "جاري الدفع..." : "دفع وإصدار الفاتورة"}
          </Button>
        </div>
      </Card>
    </div>
  );
}