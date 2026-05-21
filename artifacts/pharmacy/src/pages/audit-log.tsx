import { useState } from "react";
import { useGetAuditLog } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function AuditLog() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: logs, isLoading } = useGetAuditLog({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const OP_COLORS: Record<string, string> = {
    "إنشاء فاتورة مبيعات": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "تسجيل فاتورة مشتريات": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "مرتجع مبيعات": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    "مرتجع مشتريات": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "جرد فعلي": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجل العمليات</h1>
        <p className="text-muted-foreground mt-1">تتبع جميع العمليات التي تمت في النظام</p>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-muted-foreground">تصفية بالتاريخ:</span>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" dir="ltr" />
            <span className="text-muted-foreground text-sm">إلى</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" dir="ltr" />
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>مسح</Button>
            )}
            <span className="mr-auto text-sm text-muted-foreground">إجمالي السجلات: {logs?.length ?? 0}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العملية</TableHead>
                <TableHead className="text-right">رقم المرجع</TableHead>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">التاريخ والوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(6).fill(0).map((_, i) => <TableRow key={i}>{Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
              ) : !logs?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-28 text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/40">
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${OP_COLORS[log.operation] ?? "bg-muted text-muted-foreground"}`}>
                        {log.operation}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{log.reference ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{log.userId ?? "النظام"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(log.createdAt).toLocaleString("ar-SA")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
