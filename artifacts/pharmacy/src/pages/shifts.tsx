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
import { Play, StopCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Shifts() {
  const [openNew, setOpenNew] = useState(false);
  const [openClose, setOpenClose] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("0");
  const [closingBalance, setClosingBalance] = useState("0");
  const [notes, setNotes] = useState("");
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
      { data: { openingBalance: parseFloat(openingBalance) || 0, notes: notes || undefined } },
      { onSuccess: () => { setOpenNew(false); setOpeningBalance("0"); setNotes(""); invalidate(); toast({ title: "تم فتح الوردية" }); } }
    );
  };

  const handleClose = () => {
    if (!activeShift) return;
    close.mutate(
      { id: activeShift.id, data: { closingBalance: parseFloat(closingBalance) || 0, notes: notes || undefined } },
      { onSuccess: () => { setOpenClose(false); setClosingBalance("0"); setNotes(""); invalidate(); toast({ title: "تم إغلاق الوردية" }); } }
    );
  };

  const fmt = (n: number | null | undefined) => n != null ? n.toFixed(2) + " ر.س" : "—";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">وردية الكاشير</h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع ورديات العمل</p>
        </div>
        {!isLoadingActive && (
          activeShift ? (
            <Button variant="destructive" onClick={() => { setClosingBalance("0"); setNotes(""); setOpenClose(true); }}>
              <StopCircle className="ml-2 h-4 w-4" /> إغلاق الوردية
            </Button>
          ) : (
            <Button onClick={() => { setOpeningBalance("0"); setNotes(""); setOpenNew(true); }}>
              <Play className="ml-2 h-4 w-4" /> فتح وردية جديدة
            </Button>
          )
        )}
      </div>

      {/* Active shift banner */}
      {activeShift && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary">وردية نشطة</p>
              <p className="text-sm text-muted-foreground">
                منذ {new Date(activeShift.startTime).toLocaleString("ar-SA")} · رصيد افتتاحي: {fmt(activeShift.openingBalance as number)}
              </p>
            </div>
            <Badge className="bg-primary">مفتوحة</Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>سجل الورديات</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">وقت الفتح</TableHead>
                <TableHead className="text-right">وقت الإغلاق</TableHead>
                <TableHead className="text-right">الرصيد الافتتاحي</TableHead>
                <TableHead className="text-right">الرصيد الختامي</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
              ) : !shifts?.length ? (
                <TableRow><TableCell colSpan={6} className="text-center h-28 text-muted-foreground">لا توجد ورديات مسجلة</TableCell></TableRow>
              ) : (
                shifts.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Badge variant={shift.status === "open" ? "default" : "secondary"}>
                        {shift.status === "open" ? "مفتوحة" : "مغلقة"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(shift.startTime).toLocaleString("ar-SA")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {shift.endTime ? new Date(shift.endTime).toLocaleString("ar-SA") : "—"}
                    </TableCell>
                    <TableCell className="font-semibold">{fmt(shift.openingBalance as number)}</TableCell>
                    <TableCell className="font-semibold text-primary">{fmt(shift.closingBalance as number | null)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{shift.notes ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Open Shift Dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>فتح وردية جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رصيد الصندوق الافتتاحي (ر.س)</label>
              <Input type="number" min="0" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} dir="ltr" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ملاحظات</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات اختيارية..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenNew(false)}>إلغاء</Button>
            <Button onClick={handleOpen} disabled={create.isPending}>{create.isPending ? "جاري الفتح..." : "فتح الوردية"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={openClose} onOpenChange={setOpenClose}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>إغلاق الوردية الحالية</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رصيد الصندوق الختامي (ر.س)</label>
              <Input type="number" min="0" step="0.01" value={closingBalance} onChange={(e) => setClosingBalance(e.target.value)} dir="ltr" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ملاحظات</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات ختامية..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenClose(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleClose} disabled={close.isPending}>{close.isPending ? "جاري الإغلاق..." : "إغلاق الوردية"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
