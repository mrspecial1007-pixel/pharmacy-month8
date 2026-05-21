import { useState } from "react";
import { useGetExpiryAnalysis } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ExpiryAnalysis() {
  const [period, setPeriod] = useState<"1month" | "3months" | "6months">("3months");
  const { data: analysis, isLoading } = useGetExpiryAnalysis({ period });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">تحليل الانتهاء</h1>
          <p className="text-muted-foreground mt-1">مراقبة الأدوية قريبة الانتهاء أو منتهية الصلاحية</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
          <Button variant={period === "1month" ? "default" : "ghost"} onClick={() => setPeriod("1month")} size="sm">شهر واحد</Button>
          <Button variant={period === "3months" ? "default" : "ghost"} onClick={() => setPeriod("3months")} size="sm">3 أشهر</Button>
          <Button variant={period === "6months" ? "default" : "ghost"} onClick={() => setPeriod("6months")} size="sm">6 أشهر</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
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
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : analysis?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    لا توجد أدوية قريبة الانتهاء في هذه الفترة
                  </TableCell>
                </TableRow>
              ) : (
                analysis?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.barcode || '-'}</TableCell>
                    <TableCell className="font-semibold">{item.quantity}</TableCell>
                    <TableCell>{item.expiryDate}</TableCell>
                    <TableCell dir="ltr" className="text-right font-medium">
                      {item.daysUntilExpiry}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.urgency === 'critical' ? 'destructive' : item.urgency === 'warning' ? 'default' : 'secondary'} 
                             className={item.urgency === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                        {item.urgency === 'critical' ? 'منتهي/حرج' : item.urgency === 'warning' ? 'قريب جداً' : 'انتباه'}
                      </Badge>
                    </TableCell>
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