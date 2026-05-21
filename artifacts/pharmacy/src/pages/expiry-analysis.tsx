import { useState } from "react";
import { useGetExpiryAnalysis } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Period = "1month" | "3months" | "6months";

const URGENCY: Record<string, { label: string; variant: "destructive" | "outline" | "secondary"; cls: string }> = {
  critical: { label: "حرج",    variant: "destructive", cls: "" },
  high:     { label: "قريب",   variant: "outline",     cls: "border-amber-500 text-amber-600 dark:text-amber-400" },
  medium:   { label: "انتباه", variant: "secondary",   cls: "" },
};

export default function ExpiryAnalysis() {
  const [period, setPeriod] = useState<Period>("3months");
  const { data: analysis, isLoading } = useGetExpiryAnalysis({ period });

  const criticalCount = analysis?.filter((a) => a.urgency === "critical").length ?? 0;
  const highCount     = analysis?.filter((a) => a.urgency === "high").length ?? 0;
  const mediumCount   = analysis?.filter((a) => a.urgency === "medium").length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تحليل الانتهاء</h1>
          <p className="text-muted-foreground mt-1">مراقبة الأدوية قريبة أو منتهية الصلاحية</p>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
          {(["1month", "3months", "6months"] as Period[]).map((p) => (
            <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" onClick={() => setPeriod(p)}>
              {p === "1month" ? "شهر" : p === "3months" ? "3 أشهر" : "6 أشهر"}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">حرجة (أقل من شهر)</p>
            <p className="text-2xl font-bold text-destructive mt-1">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">قريبة (1-2 شهر)</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{highCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">تستحق الانتباه</p>
            <p className="text-2xl font-bold mt-1">{mediumCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الدواء</TableHead>
                  <TableHead className="text-right">الباركود</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                  <TableHead className="text-right">الأيام المتبقية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                ) : !analysis?.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-28 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      لا توجد أدوية في هذه الفترة
                    </TableCell>
                  </TableRow>
                ) : (
                  analysis.map((item) => {
                    const u = URGENCY[item.urgency ?? "medium"] ?? URGENCY.medium;
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">{item.barcode ?? "—"}</TableCell>
                        <TableCell className="font-semibold">{item.quantity}</TableCell>
                        <TableCell>{item.expiryDate}</TableCell>
                        <TableCell dir="ltr" className={`text-right font-bold ${item.urgency === "critical" ? "text-destructive" : item.urgency === "high" ? "text-amber-600" : ""}`}>
                          {item.daysUntilExpiry} يوم
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.variant} className={u.cls}>{u.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
