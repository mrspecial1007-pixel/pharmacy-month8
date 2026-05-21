import { useGetSuppliers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Suppliers() {
  const { data: suppliers, isLoading } = useGetSuppliers({});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الموردين</h1>
          <p className="text-muted-foreground mt-1">إدارة الشركات وموردي الأدوية</p>
        </div>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          إضافة مورد
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث عن مورد..." className="pl-3 pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">رقم الهاتف</TableHead>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-right">إجمالي المشتريات</TableHead>
                <TableHead className="text-right">الرصيد المستحق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : suppliers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا يوجد موردين</TableCell>
                </TableRow>
              ) : (
                suppliers?.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell dir="ltr" className="text-right">{supplier.phone || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.address || '-'}</TableCell>
                    <TableCell className="font-medium">${supplier.totalPurchases?.toFixed(2) ?? '0.00'}</TableCell>
                    <TableCell className="font-bold text-destructive">${supplier.balance?.toFixed(2) ?? '0.00'}</TableCell>
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