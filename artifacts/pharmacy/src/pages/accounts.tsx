import { useState } from "react";
import {
  useGetSuppliers, useGetCustomers, useCreatePayment,
  getGetSuppliersQueryKey, getGetCustomersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PaymentForm = { partyType: "supplier" | "customer"; partyId: number; partyName: string; amount: string; method: "cash" | "check" | "transfer"; notes: string };

export default function Accounts() {
  const [payForm, setPayForm] = useState<PaymentForm | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: suppliers, isLoading: isLS } = useGetSuppliers({});
  const { data: customers, isLoading: isLC } = useGetCustomers({});
  const create = useCreatePayment();

  const openPay = (partyType: "supplier" | "customer", id: number, name: string) => {
    setPayForm({ partyType, partyId: id, partyName: name, amount: "", method: "cash" as const, notes: "" });
  };

  const handlePay = () => {
    if (!payForm || !payForm.amount) { toast({ title: "المبلغ مطلوب", variant: "destructive" }); return; }
    create.mutate(
      { data: { partyType: payForm.partyType, partyId: payForm.partyId, amount: parseFloat(payForm.amount), method: payForm.method, notes: payForm.notes || undefined } },
      {
        onSuccess: () => {
          setPayForm(null);
          qc.invalidateQueries({ queryKey: getGetSuppliersQueryKey() });
          qc.invalidateQueries({ queryKey: getGetCustomersQueryKey() });
          toast({ title: "تم تسجيل الدفعة" });
        },
      }
    );
  };

  const fmt = (n: number) => n.toFixed(2) + " ر.س";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الحسابات</h1>
        <p className="text-muted-foreground mt-1">إدارة حسابات الموردين والعملاء وتسجيل المدفوعات</p>
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList className="mb-4">
          <TabsTrigger value="suppliers">حسابات الموردين</TabsTrigger>
          <TabsTrigger value="customers">حسابات العملاء</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card><CardContent className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي المستحق للموردين</p>
              <p className="text-2xl font-bold text-destructive mt-1">{fmt(suppliers?.reduce((s, x) => s + (x.balance ?? 0), 0) ?? 0)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-sm text-muted-foreground">عدد الموردين</p>
              <p className="text-2xl font-bold mt-1">{suppliers?.length ?? 0}</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المورد</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">إجمالي المشتريات</TableHead>
                    <TableHead className="text-right">الرصيد المستحق</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLS ? (
                    Array(3).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                  ) : suppliers?.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                      <TableCell>{fmt(s.totalPurchases ?? 0)}</TableCell>
                      <TableCell className={`font-bold ${(s.balance ?? 0) > 0 ? "text-destructive" : "text-emerald-600"}`}>{fmt(s.balance ?? 0)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openPay("supplier", s.id, s.name)}>
                          <CreditCard className="ml-1.5 h-3.5 w-3.5" /> تسجيل دفعة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Card><CardContent className="p-4">
              <p className="text-sm text-muted-foreground">إجمالي ديون العملاء</p>
              <p className="text-2xl font-bold text-destructive mt-1">{fmt(customers?.reduce((s, x) => s + (x.balance ?? 0), 0) ?? 0)}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-sm text-muted-foreground">عدد العملاء</p>
              <p className="text-2xl font-bold mt-1">{customers?.length ?? 0}</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">إجمالي المبيعات</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLC ? (
                    Array(3).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                  ) : customers?.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                      <TableCell>{fmt(c.totalSales ?? 0)}</TableCell>
                      <TableCell className={`font-bold ${(c.balance ?? 0) > 0 ? "text-destructive" : "text-emerald-600"}`}>{fmt(c.balance ?? 0)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openPay("customer", c.id, c.name)}>
                          <CreditCard className="ml-1.5 h-3.5 w-3.5" /> تحصيل دفعة
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={!!payForm} onOpenChange={() => setPayForm(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{payForm?.partyType === "supplier" ? "تسجيل دفعة للمورد" : "تحصيل دفعة من العميل"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="font-semibold text-lg">{payForm?.partyName}</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <Select value={payForm?.method ?? "cash"} onValueChange={(v) => setPayForm((f) => f ? { ...f, method: v as "cash" | "check" | "transfer" } : f)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المبلغ (ر.س) *</label>
              <Input type="number" min="0" step="0.01" value={payForm?.amount ?? ""} onChange={(e) => setPayForm((f) => f ? { ...f, amount: e.target.value } : f)} dir="ltr" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ملاحظات</label>
              <Input value={payForm?.notes ?? ""} onChange={(e) => setPayForm((f) => f ? { ...f, notes: e.target.value } : f)} placeholder="ملاحظات اختيارية..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayForm(null)}>إلغاء</Button>
            <Button onClick={handlePay} disabled={create.isPending}>{create.isPending ? "جاري الحفظ..." : "تأكيد الدفعة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
