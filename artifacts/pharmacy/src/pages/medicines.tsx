import { useState } from "react";
import {
  useGetMedicines, useCreateMedicine, useUpdateMedicine, useDeleteMedicine,
  useGetCategories, getGetMedicinesQueryKey,
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
import { Search, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Filter = "all" | "low_stock" | "expired" | "near_expiry";

type FormState = {
  name: string; barcode: string; scientificName: string; manufacturer: string;
  unit: string; categoryId: string; location: string; purchasePrice: string;
  salePrice: string; quantity: string; reorderLevel: string;
  productionDate: string; expiryDate: string;
};

const EMPTY_FORM: FormState = {
  name: "", barcode: "", scientificName: "", manufacturer: "",
  unit: "علبة", categoryId: "", location: "", purchasePrice: "",
  salePrice: "", quantity: "0", reorderLevel: "10",
  productionDate: "", expiryDate: "",
};

export default function Medicines() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleting, setDeleting] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: medicines, isLoading } = useGetMedicines({
    search: search.length > 1 ? search : undefined,
    filter: filter === "all" ? undefined : filter,
  });
  const { data: categories } = useGetCategories();
  const create = useCreateMedicine();
  const update = useUpdateMedicine();
  const del = useDeleteMedicine();

  const invalidate = () => qc.invalidateQueries({ queryKey: getGetMedicinesQueryKey() });

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setOpen(true); };
  const openEdit = (m: NonNullable<typeof medicines>[number]) => {
    setForm({
      name: m.name, barcode: m.barcode ?? "", scientificName: m.scientificName ?? "",
      manufacturer: m.manufacturer ?? "", unit: m.unit ?? "علبة",
      categoryId: m.categoryId?.toString() ?? "", location: m.location ?? "",
      purchasePrice: m.purchasePrice?.toString() ?? "", salePrice: m.salePrice?.toString() ?? "",
      quantity: m.quantity?.toString() ?? "0", reorderLevel: m.reorderLevel?.toString() ?? "10",
      productionDate: m.productionDate ?? "", expiryDate: m.expiryDate ?? "",
    });
    setEditing(m.id);
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: "اسم الدواء مطلوب", variant: "destructive" }); return; }
    const payload = {
      name: form.name, barcode: form.barcode || null, scientificName: form.scientificName || null,
      manufacturer: form.manufacturer || null, unit: form.unit || null,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
      location: form.location || null,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      salePrice: parseFloat(form.salePrice) || 0,
      quantity: parseInt(form.quantity) || 0,
      reorderLevel: parseInt(form.reorderLevel) || 10,
      productionDate: form.productionDate || null,
      expiryDate: form.expiryDate || null,
    };

    if (editing) {
      update.mutate({ id: editing, data: payload }, {
        onSuccess: () => { setOpen(false); invalidate(); toast({ title: "تم تحديث الدواء" }); },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      });
    } else {
      create.mutate({ data: payload }, {
        onSuccess: () => { setOpen(false); invalidate(); toast({ title: "تم إضافة الدواء" }); },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      });
    }
  };

  const handleDelete = () => {
    if (!deleting) return;
    del.mutate({ id: deleting.id }, {
      onSuccess: () => { setDeleting(null); invalidate(); toast({ title: "تم حذف الدواء" }); },
    });
  };

  const isExpired = (d?: string | null) => d && new Date(d) < new Date();
  const isLow = (qty: number, level?: number | null) => qty <= (level ?? 10);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الأدوية</h1>
          <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف الأدوية من المخزون</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "low_stock", "expired", "near_expiry"] as Filter[]).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "الكل" : f === "low_stock" ? "منخفض" : f === "expired" ? "منتهي" : "قريب الانتهاء"}
            </Button>
          ))}
          <Button onClick={openAdd} className="mr-2">
            <Plus className="ml-2 h-4 w-4" /> إضافة دواء
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث بالاسم أو الباركود..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right min-w-[160px]">الدواء</TableHead>
                  <TableHead className="text-right">الاسم العلمي</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">المخزون</TableHead>
                  <TableHead className="text-right">الوحدة</TableHead>
                  <TableHead className="text-right">سعر الشراء</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">الانتهاء</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <TableRow key={i}>{Array(9).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
                  ))
                ) : !medicines?.length ? (
                  <TableRow><TableCell colSpan={9} className="text-center h-28 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                ) : (
                  medicines.map((med) => (
                    <TableRow key={med.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{med.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{med.scientificName ?? "—"}</TableCell>
                      <TableCell>
                        {med.categoryName ? <Badge variant="secondary">{med.categoryName}</Badge> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${isLow(med.quantity, med.reorderLevel) ? "text-destructive" : "text-emerald-600"}`}>
                          {med.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{med.unit ?? "—"}</TableCell>
                      <TableCell>{(med.purchasePrice as number).toFixed(2)} ر.س</TableCell>
                      <TableCell className="font-semibold text-primary">{(med.salePrice as number).toFixed(2)} ر.س</TableCell>
                      <TableCell>
                        <span className={isExpired(med.expiryDate) ? "text-destructive font-bold" : ""}>
                          {med.expiryDate ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(med)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting({ id: med.id, name: med.name })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الدواء" : "إضافة دواء جديد"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="اسم الدواء *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: باراسيتامول 500مج" /></Field>
            <Field label="الاسم العلمي"><Input value={form.scientificName} onChange={(e) => setForm({ ...form, scientificName: e.target.value })} /></Field>
            <Field label="الباركود"><Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} dir="ltr" /></Field>
            <Field label="الشركة المصنعة"><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></Field>
            <Field label="الفئة">
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="الوحدة">
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["علبة", "شريط", "زجاجة", "أنبوب", "حقنة", "كيس", "قطعة"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="سعر الشراء (ر.س)"><Input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} dir="ltr" /></Field>
            <Field label="سعر البيع (ر.س)"><Input type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} dir="ltr" /></Field>
            <Field label="الكمية الحالية"><Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} dir="ltr" /></Field>
            <Field label="حد إعادة الطلب"><Input type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} dir="ltr" /></Field>
            <Field label="الموقع في المستودع"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="مثال: رف A-3" /></Field>
            <Field label="تاريخ الإنتاج"><Input type="date" value={form.productionDate} onChange={(e) => setForm({ ...form, productionDate: e.target.value })} dir="ltr" /></Field>
            <Field label="تاريخ الانتهاء"><Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} dir="ltr" /></Field>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف الدواء <span className="font-bold text-foreground">{deleting?.name}</span>؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
