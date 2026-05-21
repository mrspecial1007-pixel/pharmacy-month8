import { useState } from "react";
import { useGetSales } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalesHistory() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: salesData, isLoading } = useGetSales({
    search: search.length > 1 ? search : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const fmt = (n: number) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">سجل المبيعات</h1>
        <p className="text-muted-foreground mt-1">تاريخ فواتير البيع والأرباح</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">عدد الفواتير</p>
          <p className="text-2xl font-bold mt-1">{salesData?.totalCount ?? 0}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
          <p className="text-2xl font-bold mt-1 text-primary">{fmt(salesData?.totalSales ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">إجمالي الأرباح</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{fmt(salesData?.totalProfit ?? 0)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="البحث برقم الفاتورة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-9" />
            </div>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" dir="ltr" />
              <span className="text-muted-foreground text-sm">إلى</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" dir="ltr" />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }}>مسح</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المجموع</TableHead>
                <TableHead className="text-right">الخصم</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">الربح</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(6).fill(0).map((_, i) => <TableRow key={i}>{Array(8).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
              ) : !salesData?.sales.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-28 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />لا توجد مبيعات
                  </TableCell>
                </TableRow>
              ) : (
                salesData.sales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-sm">{sale.invoiceNumber}</TableCell>
                    <TableCell>{sale.customerName ?? "عميل نقدي"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(sale.createdAt).toLocaleString("ar-SA")}</TableCell>
                    <TableCell>{fmt(sale.total as number)}</TableCell>
                    <TableCell className="text-rose-500">{(sale.discount as number) > 0 ? `-${fmt(sale.discount as number)}` : "—"}</TableCell>
                    <TableCell className="font-bold">{fmt(sale.finalTotal as number)}</TableCell>
                    <TableCell className="text-emerald-600 font-semibold">{fmt(sale.profit as number)}</TableCell>
                    <TableCell><Badge variant="secondary">مكتملة</Badge></TableCell>
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
