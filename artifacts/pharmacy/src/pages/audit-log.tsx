import { useGetAuditLog } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLog() {
  const { data: logs, isLoading } = useGetAuditLog({});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجل العمليات</h1>
        <p className="text-muted-foreground mt-1">تتبع كافة العمليات في النظام</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم العملية</TableHead>
                <TableHead className="text-right">رقم العملية / المرجع</TableHead>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">التاريخ والوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.operation}</TableCell>
                    <TableCell className="text-muted-foreground">{log.reference || '-'}</TableCell>
                    <TableCell>{log.userId || 'النظام'}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString('ar-EG')}</TableCell>
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