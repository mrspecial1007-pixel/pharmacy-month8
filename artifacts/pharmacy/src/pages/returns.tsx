import { useState } from "react";
import {
  useGetReturns, useCreateReturn, useGetMedicines,
  getGetReturnsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Form = { type: "sale" | "purchase"; medicineId: string; quantity: string; amount: string; reason: string };
const EMPTY: Form = { type: "sale", medicineId: "", quantity: "1", amount: "", reason: "" };

export default function Returns() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [medSearch, setMedSearch] = useState("");
  const [selectedMedName, setSelectedMedName] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: salesReturns, isLoading: isLS } = useGetReturns({ type: "sale" });
  const { data: purchaseReturns, isLoading: isLP } = useGetReturns({ type: "purchase" });
  const { data: medicines } = useGetMedicines({ search: medSearch.length > 1 ? medSearch : undefined });
  const create = useCreateReturn();
  const invalidate = () => qc.invalidateQueries({ queryKey: getGetReturnsQueryKey() });

  const selectMed = (id: number, name: string) => {
    setForm((f) => ({ ...f, medicineId: id.toString() }));
    setSelectedMedName(name);
    setMedSearch("");
  };

  const handleSave = () => {
    if (!form.medicineId || !form.amount) { toast({ title: "بيانات ناقصة", variant: "destructive" }); return; }
    create.mutate(
      {
        data: {
          type: form.type,
          medicineId: parseInt(form.medicineId),
          quantity: parseInt(form.quantity) || 1,
          amount: parseFloat(form.amount),
          reason: form.reason || undefined,
        },
      },
      {
        onSuccess: () => {
          setOpen(false); setForm(EMPTY); setSelectedMedName("");
          invalidate(); toast({ title: "تم تسجيل المرتجع" });
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const ReturnTable = ({ data, loading }: { data?: typeof salesReturns; loading: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">الدواء</TableHead>
          <TableHead className="text-right">الكمية</TableHead>
          <TableHead className="text-right">المبلغ</TableHead>
          <TableHead className="text-right">السبب</TableHead>
          <TableHead className="text-right">التاريخ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array(3).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
        ) : !data?.length ? (
          <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد مرتجعات</TableCell></TableRow>
        ) : (
          data.map((r) => (
            <TableRow key={r.id} className="hover:bg-muted/40">
              <TableCell className="font-medium">{r.medicineName}</TableCell>
              <TableCell>{r.quantity}</TableCell>
              <TableCell className="font-semibold">{(r.amount as number).toFixed(2)} ر.س</TableCell>
              <TableCell className="text-muted-foreground">{r.reason ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المرتجعات</h1>
          <p className="text-muted-foreground mt-1">إدارة مرتجعات البيع والشراء</p>
        </div>
        <Button onClick={() => { setForm(EMPTY); setSelectedMedName(""); setOpen(true); }}>
          <Plus className="ml-2 h-4 w-4" /> تسجيل مرتجع
        </Button>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">مرتجعات البيع ({salesReturns?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="purchases">مرتجعات الشراء ({purchaseReturns?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <Card><CardContent className="p-0"><ReturnTable data={salesReturns} loading={isLS} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="purchases">
          <Card><CardContent className="p-0"><ReturnTable data={purchaseReturns} loading={isLP} /></CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تسجيل مرتجع جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع المرتجع</label>
              <div className="flex gap-2">
                {(["sale", "purchase"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.type === t ? "border-primary bg-primary/10 text-primary" : "border-muted hover:border-muted-foreground/40"}`}
                  >
                    {t === "sale" ? "مرتجع بيع" : "مرتجع شراء"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الدواء</label>
              {selectedMedName ? (
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                  <span className="flex-1 font-medium">{selectedMedName}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedMedName(""); setForm((f) => ({ ...f, medicineId: "" })); }}>تغيير</Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={medSearch} onChange={(e) => setMedSearch(e.target.value)} placeholder="ابحث عن الدواء..." className="pr-9" />
                  </div>
                  {medSearch.length > 1 && medicines && medicines.length > 0 && (
                    <div className="border rounded-lg max-h-36 overflow-y-auto divide-y bg-background shadow-md">
                      {medicines.map((m) => (
                        <button key={m.id} className="w-full text-right px-3 py-2 text-sm hover:bg-muted" onClick={() => selectMed(m.id, m.name)}>{m.name}</button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الكمية</label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">المبلغ (ر.س)</label>
                <Input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">السبب</label>
              <Textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} rows={2} placeholder="سبب الإرجاع..." />
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
