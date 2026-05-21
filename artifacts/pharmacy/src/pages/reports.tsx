import { useState } from "react";
import {
  useGetStockByCategory, useGetTopSelling, useGetProfitabilityReport, useGetDailySalesReport,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Package, ShoppingBag, BarChart2 } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س";

export default function Reports() {
  const [period, setPeriod] = useState<"today" | "month" | "year">("today");

  const { data: stockByCategory, isLoading: isLS } = useGetStockByCategory();
  const { data: topSelling, isLoading: isLT } = useGetTopSelling({ limit: 10 });
  const { data: profitability, isLoading: isLP } = useGetProfitabilityReport();
  const { data: dailySales, isLoading: isLD } = useGetDailySalesReport({ period });

  const COLORS = ["#00897B", "#26a69a", "#4db6ac", "#80cbc4", "#b2dfdb", "#e0f2f1"];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير والإحصائيات</h1>
        <p className="text-muted-foreground mt-1">تقارير شاملة عن المبيعات والمخزون والربحية</p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="sales" className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> ملخص المبيعات</TabsTrigger>
          <TabsTrigger value="top" className="flex items-center gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> الأكثر مبيعاً</TabsTrigger>
          <TabsTrigger value="profitability" className="flex items-center gap-1.5"><BarChart2 className="h-3.5 w-3.5" /> الربحية</TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> المخزون بالفئة</TabsTrigger>
        </TabsList>

        {/* Sales Summary */}
        <TabsContent value="sales">
          <div className="flex items-center gap-1 mb-4 bg-muted/50 p-1 rounded-lg w-fit">
            {(["today", "month", "year"] as const).map((p) => (
              <Button key={p} variant={period === p ? "default" : "ghost"} size="sm" onClick={() => setPeriod(p)}>
                {p === "today" ? "اليوم" : p === "month" ? "هذا الشهر" : "هذا العام"}
              </Button>
            ))}
          </div>
          {isLD ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "عدد الفواتير", value: dailySales?.invoiceCount?.toString() ?? "0", icon: "📋", cls: "" },
                { label: "إجمالي المبيعات", value: fmt(dailySales?.totalSales ?? 0), icon: "💰", cls: "text-primary" },
                { label: "إجمالي الأرباح", value: fmt(dailySales?.totalProfit ?? 0), icon: "📈", cls: "text-emerald-600" },
                { label: "إجمالي المصاريف", value: fmt(dailySales?.totalExpenses ?? 0), icon: "📤", cls: "text-rose-600" },
              ].map((s) => (
                <Card key={s.label}><CardContent className="p-5">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Top Selling */}
        <TabsContent value="top">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">الأكثر مبيعاً — كمية</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {isLT ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSelling?.slice(0, 6)} layout="vertical" margin={{ right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="medicineName" width={140} tick={{ fontSize: 11, fontFamily: "Noto Kufi Arabic" }} />
                      <Tooltip formatter={(v: number) => [v.toLocaleString("ar-SA"), "الكمية"]} contentStyle={{ fontFamily: "Noto Kufi Arabic", borderRadius: 8 }} />
                      <Bar dataKey="totalQuantity" radius={[0, 4, 4, 0]}>
                        {topSelling?.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">جدول الأكثر مبيعاً</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الدواء</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">الإيرادات</TableHead>
                      <TableHead className="text-right">الربح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLT ? (
                      Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                    ) : !topSelling?.length ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                    ) : (
                      topSelling.map((item, idx) => (
                        <TableRow key={item.medicineId} className="hover:bg-muted/40">
                          <TableCell className="font-bold text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{item.medicineName}</TableCell>
                          <TableCell>{item.totalQuantity?.toLocaleString("ar-SA")}</TableCell>
                          <TableCell className="text-primary font-semibold">{fmt(item.totalRevenue ?? 0)}</TableCell>
                          <TableCell className="text-emerald-600 font-semibold">{fmt(item.totalProfit ?? 0)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profitability */}
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
                  {isLP ? (
                    Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                  ) : !profitability?.length ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                  ) : (
                    profitability.map((item) => (
                      <TableRow key={item.medicineId} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell>{fmt(item.totalRevenue ?? 0)}</TableCell>
                        <TableCell className="text-rose-600">{fmt(item.totalCost ?? 0)}</TableCell>
                        <TableCell className="font-semibold text-emerald-600">{fmt(item.profit ?? 0)}</TableCell>
                        <TableCell dir="ltr" className="text-right font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${(item.margin ?? 0) >= 20 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"}`}>
                            {(item.margin ?? 0).toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock by Category */}
        <TabsContent value="stock">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">توزيع قيمة المخزون بالفئة</CardTitle></CardHeader>
              <CardContent className="h-[280px]">
                {isLS ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockByCategory} margin={{ right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="categoryName" tick={{ fontSize: 11, fontFamily: "Noto Kufi Arabic" }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ar-SA")} />
                      <Tooltip formatter={(v: number) => [fmt(v), "القيمة"]} contentStyle={{ fontFamily: "Noto Kufi Arabic", borderRadius: 8 }} />
                      <Bar dataKey="totalValue" radius={[4, 4, 0, 0]}>
                        {stockByCategory?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">تفاصيل المخزون بالفئة</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الفئة</TableHead>
                      <TableHead className="text-right">عدد الأصناف</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">القيمة الإجمالية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLS ? (
                      Array(4).fill(0).map((_, i) => <TableRow key={i}>{Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                    ) : !stockByCategory?.length ? (
                      <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                    ) : (
                      stockByCategory.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/40">
                          <TableCell className="font-medium">{item.categoryName}</TableCell>
                          <TableCell>{item.medicineCount}</TableCell>
                          <TableCell>{item.totalQuantity?.toLocaleString("ar-SA")}</TableCell>
                          <TableCell className="font-semibold text-primary">{fmt(item.totalValue ?? 0)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
