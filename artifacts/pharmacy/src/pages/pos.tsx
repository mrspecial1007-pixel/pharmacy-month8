import { useState } from "react";
import { useGetMedicines, useGetCustomers, useCreateSale, useGetSales } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Trash2, Plus, Minus, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fmt = (n: number) => n.toLocaleString("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " جنيه";

const PAYMENT_METHODS = [
  { value: "cash",       label: "نقداً" },
  { value: "transfer",   label: "تحويل بنكي" },
  { value: "card",       label: "بطاقة ائتمان" },
  { value: "mobiCash",   label: "موبي كاش" },
  { value: "yesrPay",    label: "يسر باي" },
  { value: "adfeali",    label: "ادفع لي" },
  { value: "mobiNab",    label: "موبي ناب" },
  { value: "masrfiBay",  label: "مصرفي باي" },
];

type CartItem = { id: number; name: string; price: number; quantity: number; stock: number; unit: string; stripCount?: number };

export default function POS() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Sales history filters
  const [shSearch, setShSearch] = useState("");
  const [shDateFrom, setShDateFrom] = useState("");
  const [shDateTo, setShDateTo] = useState("");

  const { toast } = useToast();
  const { data: medicines, isLoading: isLoadingMed } = useGetMedicines({ search: search.length > 2 ? search : undefined });
  const { data: customers } = useGetCustomers({});
  const { data: salesData, isLoading: isLoadingSales } = useGetSales({
    search: shSearch.length > 1 ? shSearch : undefined,
    date_from: shDateFrom || undefined,
    date_to: shDateTo || undefined,
  });
  const createSale = useCreateSale();

  const subtotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const addToCart = (med: NonNullable<typeof medicines>[number]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === med.id);
      if (existing) return prev.map((i) => i.id === med.id ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i);
      return [...prev, {
        id: med.id, name: med.name,
        price: med.salePrice as number,
        quantity: 1, stock: med.quantity,
        unit: med.unit ?? "علبة",
        stripCount: (med as any).stripCount,
      }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(1, Math.min(i.quantity + delta, i.stock)) } : i));
  };

  const handleCheckout = () => {
    if (!cart.length) return;
    createSale.mutate({
      data: {
        customerId: customerId ? Number(customerId) : undefined,
        discount,
        // TODO: store paymentMethod via API when SaleInput supports it
        items: cart.map((i) => ({ medicineId: i.id, quantity: i.quantity, unitPrice: i.price })),
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "✅ تم إتمام البيع بنجاح" });
        setCart([]); setDiscount(0); setCheckoutOpen(false); setCustomerId("");
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <Tabs defaultValue="sale" className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      <TabsList className="w-fit mb-4 shrink-0">
        <TabsTrigger value="sale" className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /> البيع</TabsTrigger>
        <TabsTrigger value="invoices" className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> الفواتير الصادرة</TabsTrigger>
      </TabsList>

      {/* ── SALE TAB ── */}
      <TabsContent value="sale" className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row gap-6">
          {/* Products */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-2 border-b shrink-0">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="البحث عن دواء أو مستلزم (الاسم أو الباركود)..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-9 h-12 text-lg" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {isLoadingMed ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />) :
                  medicines?.map((med) => (
                    <div key={med.id} onClick={() => addToCart(med)}
                      className="border rounded-xl p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all select-none flex flex-col justify-between h-28 relative overflow-hidden">
                      <div className="font-semibold truncate text-sm">{med.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{med.scientificName}</div>
                      <div className="flex justify-between items-center mt-auto">
                        <div className="text-base font-bold text-primary">{fmt(med.salePrice as number)}</div>
                        <div className="text-xs px-1.5 py-0.5 bg-secondary rounded">{med.quantity} {med.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart */}
          <Card className="w-full lg:w-[380px] xl:w-[420px] flex flex-col overflow-hidden shrink-0">
            <CardHeader className="pb-3 border-b bg-muted/30 shrink-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" /> سلة المشتريات
                {cart.length > 0 && <Badge className="mr-auto">{cart.length} صنف</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              {!cart.length ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6">
                  <ShoppingCart className="h-12 w-12 mb-3 opacity-20" />
                  <p>السلة فارغة</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-primary font-semibold text-sm mt-0.5">{fmt(item.price)}</div>
                        <div className="text-muted-foreground text-xs">{fmt(item.price * item.quantity)} إجمالي</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                          <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setCart((p) => p.filter((i) => i.id !== item.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            <div className="p-4 border-t bg-muted/30 space-y-3 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">العميل</label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="نقدي" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">عميل نقدي</SelectItem>
                      {customers?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">الخصم (جنيه)</label>
                  <Input type="number" min="0" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="h-8 text-sm" dir="ltr" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">طريقة الدفع</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المجموع الفرعي</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>الخصم</span><span>-{fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xl pt-1">
                  <span>الإجمالي</span>
                  <span className="text-primary">{fmt(total)}</span>
                </div>
              </div>

              <Button className="w-full h-11 text-base font-bold" disabled={!cart.length || createSale.isPending} onClick={() => setCheckoutOpen(true)}>
                دفع وإصدار الفاتورة
              </Button>
            </div>
          </Card>
        </div>
      </TabsContent>

      {/* ── INVOICES TAB ── */}
      <TabsContent value="invoices" className="flex-1 overflow-auto">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">عدد الفواتير</p><p className="text-2xl font-bold mt-1">{salesData?.totalCount ?? 0}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">إجمالي المبيعات</p><p className="text-2xl font-bold mt-1 text-primary">{fmt(salesData?.totalSales ?? 0)}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">إجمالي الأرباح</p><p className="text-2xl font-bold mt-1 text-emerald-600">{fmt(salesData?.totalProfit ?? 0)}</p></CardContent></Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="البحث برقم الفاتورة..." value={shSearch} onChange={(e) => setShSearch(e.target.value)} className="pr-9" />
            </div>
            <Input type="date" value={shDateFrom} onChange={(e) => setShDateFrom(e.target.value)} className="w-36" dir="ltr" />
            <span className="self-center text-muted-foreground text-sm">إلى</span>
            <Input type="date" value={shDateTo} onChange={(e) => setShDateTo(e.target.value)} className="w-36" dir="ltr" />
            {(shDateFrom || shDateTo) && <Button variant="ghost" size="sm" onClick={() => { setShDateFrom(""); setShDateTo(""); }}>مسح</Button>}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">الخصم</TableHead>
                    <TableHead className="text-right">الصافي</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSales ? Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                  !salesData?.sales?.length ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />لا توجد فواتير</TableCell></TableRow>
                  ) : salesData.sales.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-sm">{s.invoiceNumber}</TableCell>
                      <TableCell>{s.customerName ?? "عميل نقدي"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(s.createdAt).toLocaleString("ar-LY")}</TableCell>
                      <TableCell>{fmt(s.total as number)}</TableCell>
                      <TableCell className="text-rose-500">{(s.discount as number) > 0 ? `-${fmt(s.discount as number)}` : "—"}</TableCell>
                      <TableCell className="font-bold">{fmt(s.finalTotal as number)}</TableCell>
                      <TableCell className="text-emerald-600 font-semibold">{fmt(s.profit as number)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Checkout Confirmation */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد إتمام البيع</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex justify-between text-sm border-b pb-2">
              <span className="text-muted-foreground">عدد الأصناف</span><span className="font-medium">{cart.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المجموع الفرعي</span><span>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && <div className="flex justify-between text-sm text-destructive"><span>الخصم</span><span>-{fmt(discount)}</span></div>}
            <div className="flex justify-between font-bold text-xl pt-1 border-t">
              <span>الإجمالي المستحق</span><span className="text-primary">{fmt(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">طريقة الدفع</span>
              <span className="font-medium">{PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>إلغاء</Button>
            <Button onClick={handleCheckout} disabled={createSale.isPending}>{createSale.isPending ? "جاري الحفظ..." : "تأكيد البيع"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
