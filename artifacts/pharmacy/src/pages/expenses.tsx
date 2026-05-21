import { useState } from "react";
import {
  useGetExpenses, useCreateExpense, useDeleteExpense,
  getGetExpensesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["إيجار", "كهرباء", "مياه", "رواتب", "صيانة", "تسويق", "اتصالات", "مواد تنظيف", "أخرى"];

type Form = { category: string; description: string; amount: string };
const EMPTY: Form = { category: "", description: "", amount: "" };

export default function Expenses() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: expenses, isLoading } = useGetExpenses({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
  const create = useCreateExpense();
  const del = useDeleteExpense();
  const invalidate = () => qc.invalidateQueries({ queryKey: getGetExpensesQueryKey() });

  const totalExpenses = expenses?.reduce((s, e) => s + (e.amount as number), 0) ?? 0;

  const handleSave = () => {
    if (!form.category || !form.amount) { toast({ title: "الفئة والمبلغ مطلوبان", variant: "destructive" }); return; }
    create.mutate(
      { data: { category: form.category, description: form.description || null, amount: parseFloat(form.amount) } },
      { onSuccess: () => { setOpen(false); setForm(EMPTY); invalidate(); toast({ title: "تم إضافة المصروف" }); } }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المصاريف</h1>
          <p className="text-muted-foreground mt-1">سجل النفقات والمصروفات التشغيلية</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setOpen(true); }}><Plus className="ml-2 h-4 w-4" /> إضافة مصروف</Button>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">إجمالي المصاريف المعروضة</p>
            <p className="text-2xl font-bold text-rose-600 mt-0.5">{totalExpenses.toFixed(2)} ر.س</p>
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" dir="ltr" />
            <span className="text-muted-foreground text-sm">إلى</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" dir="ltr" />
            {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>مسح</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(4).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
              ) : !expenses?.length ? (
                <TableRow><TableCell colSpan={5} className="text-center h-28 text-muted-foreground"><Receipt className="h-8 w-8 mx-auto mb-2 opacity-30" />لا توجد مصاريف</TableCell></TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/40">
                    <TableCell className="text-muted-foreground text-sm">{new Date(e.createdAt).toLocaleDateString("ar-SA")}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full text-xs font-medium">{e.category}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.description ?? "—"}</TableCell>
                    <TableCell className="font-bold text-rose-600">{(e.amount as number).toFixed(2)} ر.س</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => del.mutate({ id: e.id }, { onSuccess: () => { invalidate(); toast({ title: "تم حذف المصروف" }); } })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          <DialogHeader><DialogTitle>إضافة مصروف جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التصنيف *</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الوصف</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف المصروف..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المبلغ (ر.س) *</label>
              <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} dir="ltr" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={create.isPending}>{create.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
