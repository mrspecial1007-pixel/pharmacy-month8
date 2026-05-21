import { useGetShifts, useGetActiveShift } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";

export default function Shifts() {
  const { data: shifts, isLoading } = useGetShifts();
  const { data: activeShift, isLoading: isLoadingActive } = useGetActiveShift();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">وردية الكاشير</h1>
          <p className="text-muted-foreground mt-1">تتبع وتسجيل الورديات</p>
        </div>
        {!isLoadingActive && !activeShift?.shift && (
          <Button>
            <Play className="ml-2 h-4 w-4" />
            فتح وردية جديدة
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">وقت الفتح</TableHead>
                <TableHead className="text-right">الرصيد الافتتاحي</TableHead>
                <TableHead className="text-right">وقت الإغلاق</TableHead>
                <TableHead className="text-right">إجمالي المبيعات</TableHead>
                <TableHead className="text-right">الرصيد الختامي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : shifts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    لا توجد ورديات
                  </TableCell>
                </TableRow>
              ) : (
                shifts?.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <Badge variant={shift.status === 'active' ? "default" : "secondary"}>
                        {shift.status === 'active' ? 'نشطة' : 'مغلقة'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(shift.startTime).toLocaleString('ar-EG')}</TableCell>
                    <TableCell className="font-semibold">${shift.openingBalance}</TableCell>
                    <TableCell>{shift.endTime ? new Date(shift.endTime).toLocaleString('ar-EG') : '-'}</TableCell>
                    <TableCell>${shift.totalSales ?? '-'}</TableCell>
                    <TableCell className="font-semibold text-primary">${shift.closingBalance ?? '-'}</TableCell>
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