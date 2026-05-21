import { useGetSales } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesHistory() {
  const { data: salesData, isLoading } = useGetSales({});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجل المبيعات</h1>
        <p className="text-muted-foreground mt-1">تاريخ فواتير البيع والأرباح</p>
      </div>

      <Card>
        <CardHeader className="py-4 flex flex-row gap-4 items-center border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث برقم الفاتورة..." className="pl-3 pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">الربح</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : salesData?.sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    لا توجد مبيعات
                  </TableCell>
                </TableRow>
              ) : (
                salesData?.sales.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.customerName || 'عميل نقدي'}</TableCell>
                    <TableCell>{new Date(sale.createdAt).toLocaleString('ar-EG')}</TableCell>
                    <TableCell className="font-bold">${sale.finalTotal}</TableCell>
                    <TableCell className="text-emerald-600 font-semibold">${sale.profit}</TableCell>
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