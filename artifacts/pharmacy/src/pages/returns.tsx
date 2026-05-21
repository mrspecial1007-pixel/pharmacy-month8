import { useGetReturns } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Returns() {
  const { data: salesReturns, isLoading: isLoadingSalesReturns } = useGetReturns({ type: "sale" });
  const { data: purchaseReturns, isLoading: isLoadingPurchaseReturns } = useGetReturns({ type: "purchase" });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">المرتجعات</h1>
        <p className="text-muted-foreground mt-1">إدارة مرتجعات البيع والشراء</p>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="sales">مرتجعات البيع</TabsTrigger>
          <TabsTrigger value="purchases">مرتجعات الشراء</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم المرجع</TableHead>
                    <TableHead className="text-right">الدواء</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSalesReturns ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : salesReturns?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        لا توجد مرتجعات
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesReturns?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.referenceId}</TableCell>
                        <TableCell>{r.medicineName}</TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell className="font-semibold text-destructive">${r.amount}</TableCell>
                        <TableCell>{new Date(r.createdAt).toLocaleString('ar-EG')}</TableCell>
                        <TableCell>{r.reason}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم المرجع</TableHead>
                    <TableHead className="text-right">الدواء</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">السبب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPurchaseReturns ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : purchaseReturns?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        لا توجد مرتجعات
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseReturns?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.referenceId}</TableCell>
                        <TableCell>{r.medicineName}</TableCell>
                        <TableCell>{r.quantity}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">${r.amount}</TableCell>
                        <TableCell>{new Date(r.createdAt).toLocaleString('ar-EG')}</TableCell>
                        <TableCell>{r.reason}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}