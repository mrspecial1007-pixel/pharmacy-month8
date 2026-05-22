import { useState } from "react";
import {
  useGetShifts, useGetActiveShift, useCreateShift, useCloseShift,
  getGetShiftsQueryKey, getGetActiveShiftQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, StopCircle, Vault, ChevronLeft, Printer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fmt = (n: number | null | undefined) =>
  n != null ? n.toLocaleString("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " جنيه" : "—";

const PAYMENT_METHODS = [
  { key: "cash",      label: "نقداً",         color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { key: "transfer",  label: "تحويل بنكي",    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { key: "card",      label: "بطاقة ائتمان",  color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { key: "mobiCash",  label: "موبي كاش",      color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  { key: "yesrPay",   label: "يسر باي",       color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  { key: "adfeali",   label: "ادفع لي",       color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400" },
  { key: "mobiNab",   label: "موبي ناب",      color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  { key: "masrfiBay", label: "مصرفي باي",     color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
];

export default function Shifts() {
  const [openNew, setOpenNew] = useState(false);
  const [openClose, setOpenClose] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [closingBalance, setClosingBalance] = useState("0");
  const [cashierName, setCashierName] = useState("");
  const [notes, setNotes] = useState("");
  const [detailShift, setDetailShift] = useState<any | null>(null);
  const [printMethod, setPrintMethod] = useState<string | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: shifts, isLoading } = useGetShifts();
  const { data: activeData, isLoading: isLoadingActive } = useGetActiveShift();
  const create = useCreateShift();
  const close = useCloseShift();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetShiftsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetActiveShiftQueryKey() });
  };

  const activeShift = activeData?.shift;

  const handleOpen = () => {
    create.mutate(
      { data: { openingBalance: parseFloat(openingBalance) || 0, notes: cashierName ? `البائع: ${cashierName}${notes ? " | " + notes : ""}` : (notes || undefined) } },
      { onSuccess: () => { setOpenNew(false); setOpeningBalance("0"); setCashierName(""); setNotes(""); invalidate(); toast({ title: "تم فتح الخزينة" }); } }
    );
  };

  const handleClose = () => {
    if (!activeShift) return;
    close.mutate(
      { id: activeShift.id, data: { closingBalance: parseFloat(closingBalance) || 0, notes: notes || undefined } },
      { onSuccess: () => { setOpenClose(false); setClosingBalance("0"); setNotes(""); invalidate(); toast({ title: "تم إغلاق الخزينة" }); } }
    );
  };

  // TODO: connect to API — mock breakdown per payment method
  const getMockBreakdown = (shiftId: number, method: string) => {
    const seed = shiftId + method.length;
    return Array.from({ length: 3 }, (_, i) => ({
      time: new Date(Date.now() - (i + 1) * 1800000).toLocaleString("ar-LY"),
      invoice: `INV-${1000 + seed + i}`,
      amount: (seed * 47.5 + i * 23.8),
    }));
  };

  const getTotalByMethod = (shiftId: number, method: string) =>
    getMockBreakdown(shiftId, method).reduce((s, r) => s + r.amount, 0);

  const cashTotal = (s: NonNullable<typeof detailShift>) =>
    getTotalByMethod(s.id, "cash");
  const servicesTotal = (s: NonNullable<typeof detailShift>) =>
    PAYMENT_METHODS.filter((m) => m.key !== "cash").reduce((sum, m) => sum + getTotalByMethod(s.id, m.key), 0);

  const extractCashierName = (notes?: string | null) => {
    if (!notes) return "—";
    const match = notes.match(/البائع: ([^|]+)/);
    return match ? match[1].trim() : notes.split("|")[0].trim() || "—";
  };

  if (detailShift) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setDetailShift(null)}><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold">خزينة {extractCashierName(detailShift.notes)}</h1>
            <p className="text-muted-foreground text-sm">
              {new Date(detailShift.startTime).toLocaleString("ar-LY")}
              {detailShift.endTime ? ` ← ${new Date(detailShift.endTime).toLocaleString("ar-LY")}` : " (نشطة)"}
            </p>
          </div>
          <Badge className="mr-auto" variant={detailShift.status === "open" ? "default" : "secondary"}>
            {detailShift.status === "open" ? "مفتوحة" : "مغلقة"}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10 cursor-pointer hover:border-emerald-500/60 transition-colors"
            onClick={() => setPrintMethod("cash")}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">💵 نقداً</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{fmt(cashTotal(detailShift))}</p>
              <p className="text-xs text-emerald-600/70 mt-1">اضغط لعرض التفاصيل وطباعة الكشف</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer hover:border-blue-500/60 transition-colors"
            onClick={() => setPrintMethod("services")}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">💳 خدمات الدفع</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(servicesTotal(detailShift))}</p>
              <p className="text-xs text-blue-600/70 mt-1">اضغط لعرض التفاصيل وطباعة الكشف</p>
            </CardContent>
          </Card>
        </div>

        {/* Services breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PAYMENT_METHODS.filter((m) => m.key !== "cash").map((m) => (
            <Card key={m.key} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setPrintMethod(m.key)}>
              <CardContent className="p-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.color}`}>{m.label}</span>
                <p className="text-lg font-bold mt-2">{fmt(getTotalByMethod(detailShift.id, m.key))}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Print Dialog */}
        <Dialog open={!!printMethod} onOpenChange={() => setPrintMethod(null)}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5" />
                كشف {printMethod === "cash" ? "النقدية" : printMethod === "services" ? "الخدمات" : PAYMENT_METHODS.find((m) => m.key === printMethod)?.label}
              </DialogTitle>
            </DialogHeader>
            <div className="print:block">
              <div className="text-center mb-4 print:block">
                <p className="font-bold text-lg">كشف الوردية — {extractCashierName(detailShift.notes)}</p>
                <p className="text-sm text-muted-foreground">{new Date(detailShift.startTime).toLocaleDateString("ar-LY")}</p>
              </div>
              {printMethod === "services" ? (
                PAYMENT_METHODS.filter((m) => m.key !== "cash").map((m) => (
                  <div key={m.key} className="mb-4">
                    <h4 className={`text-xs font-bold px-2 py-1 rounded ${m.color} mb-2`}>{m.label} — {fmt(getTotalByMethod(detailShift.id, m.key))}</h4>
                    <Table>
                      <TableHeader><TableRow><TableHead className="text-right">الوقت</TableHead><TableHead className="text-right">رقم الفاتورة</TableHead><TableHead className="text-right">المبلغ</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {getMockBreakdown(detailShift.id, m.key).map((r, i) => (
                          <TableRow key={i}><TableCell className="text-sm">{r.time}</TableCell><TableCell className="font-mono text-sm">{r.invoice}</TableCell><TableCell className="font-semibold">{fmt(r.amount)}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead className="text-right">الوقت</TableHead><TableHead className="text-right">رقم الفاتورة</TableHead><TableHead className="text-right">المبلغ</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {getMockBreakdown(detailShift.id, printMethod ?? "cash").map((r, i) => (
                      <TableRow key={i}><TableCell className="text-sm">{r.time}</TableCell><TableCell className="font-mono text-sm">{r.invoice}</TableCell><TableCell className="font-semibold">{fmt(r.amount)}</TableCell></TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell colSpan={2}>الإجمالي</TableCell>
                      <TableCell>{fmt(printMethod === "cash" ? cashTotal(detailShift) : getTotalByMethod(detailShift.id, printMethod ?? "cash"))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPrintMethod(null)}><X className="ml-1 h-4 w-4" /> إغلاق</Button>
              <Button onClick={() => window.print()}><Printer className="ml-2 h-4 w-4" /> طباعة PDF</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">خزائن البائعين</h1>
          <p className="text-muted-foreground mt-1">إدارة الورديات وتتبع المقبوضات حسب طريقة الدفع</p>
        </div>
        {!isLoadingActive && (
          activeShift ? (
            <Button variant="destructive" onClick={() => { setClosingBalance("0"); setNotes(""); setOpenClose(true); }}>
              <StopCircle className="ml-2 h-4 w-4" /> إغلاق الخزينة
            </Button>
          ) : (
            <Button onClick={() => { setOpeningBalance("0"); setCashierName(""); setNotes(""); setOpenNew(true); }}>
              <Play className="ml-2 h-4 w-4" /> فتح خزينة جديدة
            </Button>
          )
        )}
      </div>

      {activeShift && (
        <Card className="border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setDetailShift(activeShift as any)}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full"><Vault className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <p className="font-semibold text-primary">خزينة مفتوحة — {extractCashierName(activeShift.notes)}</p>
              <p className="text-sm text-muted-foreground">منذ {new Date(activeShift.startTime).toLocaleString("ar-LY")} · رصيد افتتاحي: {fmt(activeShift.openingBalance as number)}</p>
            </div>
            <Badge className="bg-primary">نشطة</Badge>
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>سجل الورديات السابقة</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">البائع</TableHead>
                <TableHead className="text-right">وقت الفتح</TableHead>
                <TableHead className="text-right">وقت الإغلاق</TableHead>
                <TableHead className="text-right">الرصيد الافتتاحي</TableHead>
                <TableHead className="text-right">الرصيد الختامي</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array(3).fill(0).map((_, i) => <TableRow key={i}>{Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
              !shifts?.length ? <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">لا توجد ورديات مسجلة</TableCell></TableRow> :
              shifts.map((s) => (
                <TableRow key={s.id} className="hover:bg-muted/40">
                  <TableCell><Badge variant={s.status === "open" ? "default" : "secondary"}>{s.status === "open" ? "مفتوحة" : "مغلقة"}</Badge></TableCell>
                  <TableCell className="font-medium">{extractCashierName(s.notes)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(s.startTime).toLocaleString("ar-LY")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.endTime ? new Date(s.endTime).toLocaleString("ar-LY") : "—"}</TableCell>
                  <TableCell>{fmt(s.openingBalance as number)}</TableCell>
                  <TableCell className="text-primary font-semibold">{fmt(s.closingBalance as number | null)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setDetailShift(s as any)}>
                      <ChevronLeft className="ml-1 h-3.5 w-3.5" /> عرض التفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Open Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>فتح خزينة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><label className="text-sm font-medium">اسم البائع</label><Input value={cashierName} onChange={(e) => setCashierName(e.target.value)} placeholder="مثال: أحمد محمد" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">رصيد الصندوق الافتتاحي (جنيه)</label><Input type="number" min="0" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} dir="ltr" autoFocus /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">ملاحظات</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenNew(false)}>إلغاء</Button>
            <Button onClick={handleOpen} disabled={create.isPending}>{create.isPending ? "جاري الفتح..." : "فتح الخزينة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={openClose} onOpenChange={setOpenClose}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إغلاق الخزينة الحالية</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><label className="text-sm font-medium">رصيد الصندوق الختامي (جنيه)</label><Input type="number" min="0" step="0.01" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} dir="ltr" autoFocus /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">ملاحظات ختامية</label><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenClose(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleClose} disabled={close.isPending}>{close.isPending ? "جاري الإغلاق..." : "إغلاق الخزينة"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
