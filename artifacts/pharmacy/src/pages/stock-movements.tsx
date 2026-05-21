import { useGetStockMovements } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockMovements() {
  const { data: movements, isLoading } = useGetStockMovements({});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">حركة المخزون</h1>
        <p className="text-muted-foreground mt-1">سجل تحركات الأدوية في المخزون</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الدواء</TableHead>
                <TableHead className="text-right">نوع الحركة</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">المرجع</TableHead>
                <TableHead className="text-right">التاريخ والوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : movements?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                movements?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.medicineName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        m.type === 'in' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        m.type === 'out' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {m.type === 'in' ? 'وارد' : m.type === 'out' ? 'صادر' : 'تعديل'}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold" dir="ltr">{m.type === 'in' ? '+' : m.type === 'out' ? '-' : ''}{m.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{m.reference || '-'}</TableCell>
                    <TableCell>{new Date(m.createdAt).toLocaleString('ar-EG')}</TableCell>
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