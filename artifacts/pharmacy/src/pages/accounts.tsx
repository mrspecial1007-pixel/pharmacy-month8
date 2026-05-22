import { useState } from "react";
import {
  useGetSuppliers, useGetCustomers, useGetPayments,
  useCreateSupplier, useUpdateSupplier, useDeleteSupplier,
  useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  useCreatePayment,
  getGetSuppliersQueryKey, getGetCustomersQueryKey, getGetPaymentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, CreditCard, Building2, Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fmt = (n: number) => n.toLocaleString("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " جنيه";

type SupForm = { name: string; phone: string; address: string; balance: string };
type CusForm = { name: string; phone: string; address: string; balance: string; notes: string };
type PayForm = { partyType: "supplier" | "customer"; partyId: number; partyName: string; amount: string; method: "cash" | "check" | "transfer"; notes: string };

const EMPTY_SUP: SupForm = { name: "", phone: "", address: "", balance: "0" };
const EMPTY_CUS: CusForm = { name: "", phone: "", address: "", balance: "0", notes: "" };

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-sm font-medium">{label}</label>{children}</div>;
}

export default function Accounts() {
  const [supOpen, setSupOpen] = useState(false);
  const [supEditing, setSupEditing] = useState<number | null>(null);
  const [supForm, setSupForm] = useState<SupForm>(EMPTY_SUP);
  const [supDeleting, setSupDeleting] = useState<{ id: number; name: string } | null>(null);
  const [supSearch, setSupSearch] = useState("");

  const [cusOpen, setCusOpen] = useState(false);
  const [cusEditing, setCusEditing] = useState<number | null>(null);
  const [cusForm, setCusForm] = useState<CusForm>(EMPTY_CUS);
  const [cusDeleting, setCusDeleting] = useState<{ id: number; name: string } | null>(null);
  const [cusSearch, setCusSearch] = useState("");

  const [payForm, setPayForm] = useState<PayForm | null>(null);
  const [payPartyType, setPayPartyType] = useState<"supplier" | "customer" | "all">("all");

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: suppliers, isLoading: isLS } = useGetSuppliers({ search: supSearch.length > 1 ? supSearch : undefined });
  const { data: customers, isLoading: isLC } = useGetCustomers({ search: cusSearch.length > 1 ? cusSearch : undefined });
  const { data: payments, isLoading: isLP } = useGetPayments({ party_type: payPartyType === "all" ? undefined : payPartyType });

  const createSup = useCreateSupplier();
  const updateSup = useUpdateSupplier();
  const delSup = useDeleteSupplier();
  const createCus = useCreateCustomer();
  const updateCus = useUpdateCustomer();
  const delCus = useDeleteCustomer();
  const createPay = useCreatePayment();

  const invSup = () => qc.invalidateQueries({ queryKey: getGetSuppliersQueryKey() });
  const invCus = () => qc.invalidateQueries({ queryKey: getGetCustomersQueryKey() });
  const invPay = () => qc.invalidateQueries({ queryKey: getGetPaymentsQueryKey() });

  // Supplier handlers
  const openAddSup = () => { setSupForm(EMPTY_SUP); setSupEditing(null); setSupOpen(true); };
  const openEditSup = (s: NonNullable<typeof suppliers>[number]) => {
    setSupForm({ name: s.name, phone: s.phone ?? "", address: s.address ?? "", balance: (s.balance ?? 0).toString() });
    setSupEditing(s.id); setSupOpen(true);
  };
  const saveSup = () => {
    if (!supForm.name.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    const d = { name: supForm.name, phone: supForm.phone || null, address: supForm.address || null, balance: parseFloat(supForm.balance) || 0 };
    if (supEditing) {
      updateSup.mutate({ id: supEditing, data: d }, { onSuccess: () => { setSupOpen(false); invSup(); toast({ title: "تم تحديث المورد" }); } });
    } else {
      createSup.mutate({ data: d }, { onSuccess: () => { setSupOpen(false); invSup(); toast({ title: "تم إضافة المورد" }); } });
    }
  };

  // Customer handlers
  const openAddCus = () => { setCusForm(EMPTY_CUS); setCusEditing(null); setCusOpen(true); };
  const openEditCus = (c: NonNullable<typeof customers>[number]) => {
    setCusForm({ name: c.name, phone: c.phone ?? "", address: c.address ?? "", balance: (c.balance ?? 0).toString(), notes: c.notes ?? "" });
    setCusEditing(c.id); setCusOpen(true);
  };
  const saveCus = () => {
    if (!cusForm.name.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    const d = { name: cusForm.name, phone: cusForm.phone || null, address: cusForm.address || null, balance: parseFloat(cusForm.balance) || 0, notes: cusForm.notes || null };
    if (cusEditing) {
      updateCus.mutate({ id: cusEditing, data: d }, { onSuccess: () => { setCusOpen(false); invCus(); toast({ title: "تم تحديث العميل" }); } });
    } else {
      createCus.mutate({ data: d }, { onSuccess: () => { setCusOpen(false); invCus(); toast({ title: "تم إضافة العميل" }); } });
    }
  };

  // Payment handler
  const openPay = (partyType: "supplier" | "customer", id: number, name: string) => {
    setPayForm({ partyType, partyId: id, partyName: name, amount: "", method: "cash", notes: "" });
  };
  const handlePay = () => {
    if (!payForm?.amount) { toast({ title: "المبلغ مطلوب", variant: "destructive" }); return; }
    createPay.mutate(
      { data: { partyType: payForm.partyType, partyId: payForm.partyId, amount: parseFloat(payForm.amount), method: payForm.method, notes: payForm.notes || null } },
      { onSuccess: () => { setPayForm(null); invSup(); invCus(); invPay(); toast({ title: "تم تسجيل الدفعة" }); } }
    );
  };

  const METHOD_LABEL: Record<string, string> = { cash: "نقداً", transfer: "تحويل بنكي", check: "شيك" };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الحسابات</h1>
        <p className="text-muted-foreground mt-1">إدارة الموردين والعملاء وتسجيل المدفوعات</p>
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList className="mb-4">
          <TabsTrigger value="suppliers" className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> الموردون</TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> العملاء</TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> المدفوعات</TabsTrigger>
        </TabsList>

        {/* ── SUPPLIERS TAB ── */}
        <TabsContent value="suppliers">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="البحث عن مورد..." value={supSearch} onChange={(e) => setSupSearch(e.target.value)} className="pl-3 pr-9" />
              </div>
              <Button onClick={openAddSup} className="mr-3"><Plus className="ml-2 h-4 w-4" /> إضافة مورد</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">إجمالي المستحق</p><p className="text-2xl font-bold text-destructive mt-1">{fmt(suppliers?.reduce((s, x) => s + (x.balance ?? 0), 0) ?? 0)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">عدد الموردين</p><p className="text-2xl font-bold mt-1">{suppliers?.length ?? 0}</p></CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">إجمالي المشتريات</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {isLS ? Array(3).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                    !suppliers?.length ? <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا يوجد موردون</TableCell></TableRow> :
                    suppliers.map((s) => (
                      <TableRow key={s.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[140px] truncate">{s.address ?? "—"}</TableCell>
                        <TableCell>{fmt(s.totalPurchases ?? 0)}</TableCell>
                        <TableCell className={`font-bold ${(s.balance ?? 0) > 0 ? "text-destructive" : "text-emerald-600"}`}>{fmt(s.balance ?? 0)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => openPay("supplier", s.id, s.name)}><CreditCard className="ml-1 h-3.5 w-3.5" /> دفعة</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSup(s)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setSupDeleting({ id: s.id, name: s.name })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── CUSTOMERS TAB ── */}
        <TabsContent value="customers">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="البحث عن عميل..." value={cusSearch} onChange={(e) => setCusSearch(e.target.value)} className="pl-3 pr-9" />
              </div>
              <Button onClick={openAddCus} className="mr-3"><Plus className="ml-2 h-4 w-4" /> إضافة عميل</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">إجمالي ديون العملاء</p><p className="text-2xl font-bold text-destructive mt-1">{fmt(customers?.reduce((s, x) => s + (x.balance ?? 0), 0) ?? 0)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">عدد العملاء</p><p className="text-2xl font-bold mt-1">{customers?.length ?? 0}</p></CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">إجمالي المبيعات</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {isLC ? Array(3).fill(0).map((_, i) => <TableRow key={i}>{Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                    !customers?.length ? <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">لا يوجد عملاء</TableCell></TableRow> :
                    customers.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[120px] truncate">{c.address ?? "—"}</TableCell>
                        <TableCell className="text-primary">{fmt(c.totalSales ?? 0)}</TableCell>
                        <TableCell className={`font-bold ${(c.balance ?? 0) > 0 ? "text-destructive" : "text-emerald-600"}`}>{fmt(c.balance ?? 0)}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[120px] truncate">{c.notes ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => openPay("customer", c.id, c.name)}><CreditCard className="ml-1 h-3.5 w-3.5" /> تحصيل</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCus(c)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setCusDeleting({ id: c.id, name: c.name })}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── PAYMENTS TAB ── */}
        <TabsContent value="payments">
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["all", "supplier", "customer"] as const).map((t) => (
                <Button key={t} size="sm" variant={payPartyType === t ? "default" : "outline"} onClick={() => setPayPartyType(t)}>
                  {t === "all" ? "الكل" : t === "supplier" ? "موردون" : "عملاء"}
                </Button>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الطرف</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">طريقة الدفع</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {isLP ? Array(4).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                    !payments?.length ? <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا توجد مدفوعات</TableCell></TableRow> :
                    payments.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{p.partyName ?? "—"}</TableCell>
                        <TableCell><Badge variant={p.partyType === "supplier" ? "destructive" : "secondary"}>{p.partyType === "supplier" ? "مورد" : "عميل"}</Badge></TableCell>
                        <TableCell>{METHOD_LABEL[p.method] ?? p.method}</TableCell>
                        <TableCell className="font-bold text-primary">{fmt(p.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.notes ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(p.createdAt).toLocaleDateString("ar-LY")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Supplier Add/Edit ── */}
      <Dialog open={supOpen} onOpenChange={setSupOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{supEditing ? "تعديل المورد" : "إضافة مورد جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <F label="الاسم *"><Input value={supForm.name} onChange={(e) => setSupForm({ ...supForm, name: e.target.value })} /></F>
            <F label="رقم الهاتف"><Input value={supForm.phone} onChange={(e) => setSupForm({ ...supForm, phone: e.target.value })} dir="ltr" className="text-right" /></F>
            <F label="العنوان"><Input value={supForm.address} onChange={(e) => setSupForm({ ...supForm, address: e.target.value })} /></F>
            <F label="الرصيد المستحق (جنيه)"><Input type="number" min="0" step="0.01" value={supForm.balance} onChange={(e) => setSupForm({ ...supForm, balance: e.target.value })} dir="ltr" /></F>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSupOpen(false)}>إلغاء</Button>
            <Button onClick={saveSup} disabled={createSup.isPending || updateSup.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Customer Add/Edit ── */}
      <Dialog open={cusOpen} onOpenChange={setCusOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{cusEditing ? "تعديل العميل" : "إضافة عميل جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <F label="الاسم *"><Input value={cusForm.name} onChange={(e) => setCusForm({ ...cusForm, name: e.target.value })} /></F>
            <F label="رقم الهاتف"><Input value={cusForm.phone} onChange={(e) => setCusForm({ ...cusForm, phone: e.target.value })} dir="ltr" className="text-right" /></F>
            <F label="العنوان"><Input value={cusForm.address} onChange={(e) => setCusForm({ ...cusForm, address: e.target.value })} /></F>
            <F label="الرصيد (جنيه)"><Input type="number" min="0" step="0.01" value={cusForm.balance} onChange={(e) => setCusForm({ ...cusForm, balance: e.target.value })} dir="ltr" /></F>
            <F label="ملاحظات"><Textarea value={cusForm.notes} onChange={(e) => setCusForm({ ...cusForm, notes: e.target.value })} rows={2} /></F>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCusOpen(false)}>إلغاء</Button>
            <Button onClick={saveCus} disabled={createCus.isPending || updateCus.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Payment Dialog ── */}
      <Dialog open={!!payForm} onOpenChange={() => setPayForm(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{payForm?.partyType === "supplier" ? "تسجيل دفعة للمورد" : "تحصيل دفعة من العميل"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="font-semibold text-lg">{payForm?.partyName}</p>
            <F label="طريقة الدفع">
              <Select value={payForm?.method} onValueChange={(v) => setPayForm((f) => f ? { ...f, method: v as "cash" | "check" | "transfer" } : f)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <F label="المبلغ (جنيه) *"><Input type="number" min="0" step="0.01" value={payForm?.amount ?? ""} onChange={(e) => setPayForm((f) => f ? { ...f, amount: e.target.value } : f)} dir="ltr" autoFocus /></F>
            <F label="ملاحظات"><Input value={payForm?.notes ?? ""} onChange={(e) => setPayForm((f) => f ? { ...f, notes: e.target.value } : f)} /></F>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPayForm(null)}>إلغاء</Button>
            <Button onClick={handlePay} disabled={createPay.isPending}>{createPay.isPending ? "جاري الحفظ..." : "تأكيد الدفعة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirms */}
      <Dialog open={!!supDeleting} onOpenChange={() => setSupDeleting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف <span className="font-bold text-foreground">{supDeleting?.name}</span>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSupDeleting(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => delSup.mutate({ id: supDeleting!.id }, { onSuccess: () => { setSupDeleting(null); invSup(); toast({ title: "تم الحذف" }); } })} disabled={delSup.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!cusDeleting} onOpenChange={() => setCusDeleting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف <span className="font-bold text-foreground">{cusDeleting?.name}</span>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCusDeleting(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => delCus.mutate({ id: cusDeleting!.id }, { onSuccess: () => { setCusDeleting(null); invCus(); toast({ title: "تم الحذف" }); } })} disabled={delCus.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
