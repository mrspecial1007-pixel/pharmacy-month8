import { useGetInventoryCount } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Inventory() {
  const { data: inventory, isLoading } = useGetInventoryCount();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الجرد الفعلي</h1>
          <p className="text-muted-foreground mt-1">تحديث وتصحيح أرصدة المخزون</p>
        </div>
        <Button>
          <Save className="ml-2 h-4 w-4" />
          حفظ الجرد
        </Button>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث بالاسم أو الباركود..." className="pl-3 pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الدواء</TableHead>
                <TableHead className="text-right">الباركود</TableHead>
                <TableHead className="text-right">رصيد النظام</TableHead>
                <TableHead className="text-right">الرصيد الفعلي</TableHead>
                <TableHead className="text-right">الفرق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : inventory?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                inventory?.map((item) => (
                  <TableRow key={item.medicineId}>
                    <TableCell className="font-medium">{item.medicineName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.barcode || '-'}</TableCell>
                    <TableCell className="font-semibold">{item.systemQuantity}</TableCell>
                    <TableCell>
                      <Input type="number" defaultValue={item.systemQuantity} className="w-24 text-center mx-auto lg:mx-0 lg:ml-auto rtl:ml-0 rtl:mr-auto" />
                    </TableCell>
                    <TableCell>0</TableCell>
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