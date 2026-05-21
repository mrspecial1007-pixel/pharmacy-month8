import { useState } from "react";
import {
  useGetPurchases, useCreatePurchase, useGetSuppliers, useGetMedicines,
  getGetPurchasesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Search, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PurchaseItem = { medicineId: number; medicineName: string; quantity: number; unitPrice: number; expiryDate: string; productionDate: string };

export default function Purchases() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: purchases, isLoading } = useGetPurchases({});
  const { data: suppliers } = useGetSuppliers({});
  const { data: medicines } = useGetMedicines({ search: medSearch.length > 1 ? medSearch : undefined });
  const create = useCreatePurchase();

  const addItem = (med: NonNullable<typeof medicines>[number]) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.medicineId === med.id);
      if (ex) return prev.map((i) => i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { medicineId: med.id, medicineName: med.name, quantity: 1, unitPrice: med.purchasePrice as number, expiryDate: "", productionDate: "" }];
    });
    setMedSearch("");
  };

  const updateItem = (id: number, field: keyof PurchaseItem, value: string | number) => {
    setItems((prev) => prev.map((i) => i.medicineId === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.medicineId !== id));

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const handleSave = () => {
    if (!items.length) { toast({ title: "أضف أصناف أولاً", variant: "destructive" }); return; }
    create.mutate({
      data: {
        supplierId: supplierId ? parseInt(supplierId) : undefined,
        items: items.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          productionDate: i.productionDate || undefined,
          expiryDate: i.expiryDate || undefined,
        })),
      },
    }, {
      onSuccess: () => {
        setOpen(false); setItems([]); setSupplierId("");
        qc.invalidateQueries({ queryKey: getGetPurchasesQueryKey() });
        toast({ title: "تم تسجيل فاتورة الشراء" });
      },
    });
  };

  const dateStr = (s: string) => s ? new Date(s).toLocaleDateString("ar-SA") : "—";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المشتريات</h1>
          <p className="text-muted-foreground mt-1">إدارة فواتير المشتريات من الموردين</p>
        </div>
        <Button onClick={() => { setItems([]); setSupplierId(""); setOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> فاتورة شراء جديدة
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث في الفواتير..." className="pl-3 pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">المورد</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
              ) : !purchases?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center h-28 text-muted-foreground"><Package className="h-8 w-8 mx-auto mb-2 opacity-30" />لا توجد فواتير</TableCell></TableRow>
              ) : (
                purchases.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{p.invoiceNumber}</TableCell>
                    <TableCell>{p.supplierName ?? "غير محدد"}</TableCell>
                    <TableCell>{dateStr(p.createdAt)}</TableCell>
                    <TableCell className="font-bold text-primary">{(p.total as number).toFixed(2)} ر.س</TableCell>
                    <TableCell><Badge variant="secondary">{p.status === "completed" ? "مكتملة" : p.status}</Badge></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Purchase Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>فاتورة شراء جديدة</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المورد</label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="اختر المورد (اختياري)" /></SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">البحث عن دواء للإضافة</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={medSearch} onChange={(e) => setMedSearch(e.target.value)} placeholder="ابحث عن دواء..." className="pr-9" />
              </div>
              {medSearch.length > 1 && medicines && medicines.length > 0 && (
                <div className="border rounded-lg max-h-40 overflow-y-auto divide-y bg-background shadow-md">
                  {medicines.map((m) => (
                    <button key={m.id} className="w-full text-right px-3 py-2 text-sm hover:bg-muted flex justify-between" onClick={() => addItem(m)}>
                      <span>{m.name}</span>
                      <span className="text-muted-foreground">{(m.purchasePrice as number).toFixed(2)} ر.س</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الدواء</TableHead>
                      <TableHead className="text-right w-24">الكمية</TableHead>
                      <TableHead className="text-right w-32">سعر الوحدة</TableHead>
                      <TableHead className="text-right w-32">تاريخ الانتهاء</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.medicineId}>
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell>
                          <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(item.medicineId, "quantity", parseInt(e.target.value) || 1)} className="w-20 text-center" dir="ltr" />
                        </TableCell>
                        <TableCell>
                          <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.medicineId, "unitPrice", parseFloat(e.target.value) || 0)} className="w-28" dir="ltr" />
                        </TableCell>
                        <TableCell>
                          <Input type="date" value={item.expiryDate} onChange={(e) => updateItem(item.medicineId, "expiryDate", e.target.value)} className="w-36" dir="ltr" />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.medicineId)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-3 bg-muted/30 border-t flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">الإجمالي</span>
                  <span className="text-lg font-bold text-primary">{total.toFixed(2)} ر.س</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={create.isPending || !items.length}>
              {create.isPending ? "جاري الحفظ..." : "حفظ الفاتورة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
