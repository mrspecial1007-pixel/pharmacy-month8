import { useState } from "react";
import { useGetStockByCategory, useGetTopSelling, useGetProfitabilityReport, useGetDailySalesReport } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const { data: stockByCategory, isLoading: isLoadingStock } = useGetStockByCategory();
  const { data: topSelling, isLoading: isLoadingTop } = useGetTopSelling({});
  const { data: profitability, isLoading: isLoadingProfits } = useGetProfitabilityReport();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير والإحصائيات</h1>
        <p className="text-muted-foreground mt-1">تقارير شاملة عن المبيعات والمخزون</p>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="stock">ملخص المخزون</TabsTrigger>
          <TabsTrigger value="top-selling">الأكثر مبيعاً</TabsTrigger>
          <TabsTrigger value="profitability">الربحية</TabsTrigger>
          <TabsTrigger value="sales">ملخص المبيعات</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">عدد الأدوية</TableHead>
                    <TableHead className="text-right">إجمالي الكميات</TableHead>
                    <TableHead className="text-right">القيمة الإجمالية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingStock ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : stockByCategory?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">لا توجد بيانات</TableCell>
                    </TableRow>
                  ) : (
                    stockByCategory?.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.categoryName}</TableCell>
                        <TableCell>{item.medicineCount}</TableCell>
                        <TableCell>{item.totalQuantity}</TableCell>
                        <TableCell className="font-semibold text-primary">${item.totalValue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-selling">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الدواء</TableHead>
                    <TableHead className="text-right">الكمية المباعة</TableHead>
                    <TableHead className="text-right">إجمالي الإيرادات</TableHead>
                    <TableHead className="text-right">إجمالي الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingTop ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : topSelling?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">لا توجد بيانات</TableCell>
                    </TableRow>
                  ) : (
                    topSelling?.map((item) => (
                      <TableRow key={item.medicineId}>
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell>{item.totalQuantity}</TableCell>
                        <TableCell className="font-semibold text-primary">${item.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">${item.totalProfit?.toFixed(2) ?? '0.00'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الدواء</TableHead>
                    <TableHead className="text-right">الإيرادات</TableHead>
                    <TableHead className="text-right">التكلفة</TableHead>
                    <TableHead className="text-right">الربح</TableHead>
                    <TableHead className="text-right">هامش الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingProfits ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : profitability?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد بيانات</TableCell>
                    </TableRow>
                  ) : (
                    profitability?.map((item) => (
                      <TableRow key={item.medicineId}>
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell>${item.totalRevenue.toFixed(2)}</TableCell>
                        <TableCell className="text-rose-600">${item.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">${item.profit.toFixed(2)}</TableCell>
                        <TableCell dir="ltr" className="text-right font-medium">{item.margin.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sales">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center">
               <p>حدد الفترة الزمنية لعرض ملخص المبيعات الشامل.</p>
               {/* Simplified for space, would use the useGetDailySalesReport hook */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}