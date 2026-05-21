import { useState } from "react";
import {
  useGetSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier,
  getGetSuppliersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit, Trash2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Form = { name: string; phone: string; address: string; balance: string };
const EMPTY: Form = { name: "", phone: "", address: "", balance: "0" };

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [deleting, setDeleting] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: suppliers, isLoading } = useGetSuppliers({ search: search.length > 1 ? search : undefined });
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const del = useDeleteSupplier();
  const invalidate = () => qc.invalidateQueries({ queryKey: getGetSuppliersQueryKey() });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setOpen(true); };
  const openEdit = (s: NonNullable<typeof suppliers>[number]) => {
    setForm({ name: s.name, phone: s.phone ?? "", address: s.address ?? "", balance: (s.balance ?? 0).toString() });
    setEditing(s.id); setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    const payload = { name: form.name, phone: form.phone || null, address: form.address || null, balance: parseFloat(form.balance) || 0 };
    if (editing) {
      update.mutate({ id: editing, data: payload }, { onSuccess: () => { setOpen(false); invalidate(); toast({ title: "تم تحديث المورد" }); } });
    } else {
      create.mutate({ data: payload }, { onSuccess: () => { setOpen(false); invalidate(); toast({ title: "تم إضافة المورد" }); } });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الموردون</h1>
          <p className="text-muted-foreground mt-1">إدارة الشركات وموردي الأدوية</p>
        </div>
        <Button onClick={openAdd}><Plus className="ml-2 h-4 w-4" /> إضافة مورد</Button>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث عن مورد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">رقم الهاتف</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">إجمالي المشتريات</TableHead>
                <TableHead className="text-right">الرصيد المستحق</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
              ) : !suppliers?.length ? (
                <TableRow><TableCell colSpan={6} className="text-center h-28 text-muted-foreground"><Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />لا يوجد موردون</TableCell></TableRow>
              ) : (
                suppliers.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell dir="ltr" className="text-right text-muted-foreground">{s.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[180px] truncate">{s.address ?? "—"}</TableCell>
                    <TableCell className="font-medium">{(s.totalPurchases ?? 0).toFixed(2)} ر.س</TableCell>
                    <TableCell className={`font-bold ${(s.balance ?? 0) > 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {(s.balance ?? 0).toFixed(2)} ر.س
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting({ id: s.id, name: s.name })}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل المورد" : "إضافة مورد جديد"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-2">
            <F label="اسم المورد *"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
            <F label="رقم الهاتف"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className="text-right" /></F>
            <F label="العنوان"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></F>
            <F label="الرصيد المستحق (ر.س)"><Input type="number" min="0" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} dir="ltr" /></F>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف المورد <span className="font-bold text-foreground">{deleting?.name}</span>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => del.mutate({ id: deleting!.id }, { onSuccess: () => { setDeleting(null); invalidate(); toast({ title: "تم حذف المورد" }); } })} disabled={del.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-sm font-medium">{label}</label>{children}</div>;
}
