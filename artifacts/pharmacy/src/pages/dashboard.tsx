import { useGetDashboardSummary, useGetDashboardSalesChart, useGetDashboardAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pill, CircleDollarSign, TrendingUp, AlertCircle, PackageSearch, PackageMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fmt = (n: number) => n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ر.س";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: chartData, isLoading: isLoadingChart } = useGetDashboardSalesChart();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على أداء الصيدلية</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="مبيعات اليوم" value={summary?.todaySales != null ? fmt(summary.todaySales) : undefined} loading={isLoadingSummary} icon={<CircleDollarSign className="h-5 w-5 text-primary" />} />
        <StatCard title="صافي الربح" value={summary?.netProfit != null ? fmt(summary.netProfit) : undefined} loading={isLoadingSummary} icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
        <StatCard title="إجمالي الأدوية" value={summary?.totalMedicines} loading={isLoadingSummary} icon={<Pill className="h-5 w-5 text-blue-500" />} />
        <StatCard title="قيمة المخزون" value={summary?.stockValue != null ? fmt(summary.stockValue) : undefined} loading={isLoadingSummary} icon={<PackageSearch className="h-5 w-5 text-purple-500" />} />
        <StatCard title="منتهية الصلاحية" value={summary?.expiredCount} loading={isLoadingSummary} icon={<AlertCircle className="h-5 w-5 text-destructive" />} className="border-destructive/20 bg-destructive/5" />
        <StatCard title="منخفض المخزون" value={summary?.lowStockCount} loading={isLoadingSummary} icon={<PackageMinus className="h-5 w-5 text-amber-500" />} className="border-amber-500/20 bg-amber-500/5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>المبيعات والأرباح (آخر 7 أيام)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {isLoadingChart ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData ?? []} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00897B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00897B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fontFamily: "Noto Kufi Arabic" }} />
                  <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={(v) => v.toLocaleString("ar-SA")} />
                  <Tooltip
                    formatter={(value: number, name: string) => [fmt(value), name === "sales" ? "المبيعات" : "الأرباح"]}
                    labelStyle={{ fontFamily: "Noto Kufi Arabic", textAlign: "right" }}
                    contentStyle={{ fontFamily: "Noto Kufi Arabic", borderRadius: 8, border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend formatter={(v) => (v === "sales" ? "المبيعات" : "الأرباح")} />
                  <Area type="monotone" dataKey="sales" stroke="#00897B" strokeWidth={2} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>التنبيهات</CardTitle>
            <CardDescription>أدوية تتطلب الانتباه</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-3">
            {isLoadingAlerts ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : (alerts?.nearExpiry?.length === 0 && alerts?.lowStock?.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-2 text-muted" />
                <p>لا توجد تنبيهات</p>
              </div>
            ) : (
              <>
                {alerts?.nearExpiry?.map((a) => (
                  <div key={`exp-${a.id}`} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div>
                      <p className="font-semibold text-destructive text-sm">{a.name}</p>
                      <p className="text-xs text-destructive/70">ينتهي في {a.expiryDate}</p>
                    </div>
                    <span className="text-sm font-bold text-destructive">{a.quantity} وحدة</span>
                  </div>
                ))}
                {alerts?.lowStock?.map((a) => (
                  <div key={`low-${a.id}`} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">{a.name}</p>
                      <p className="text-xs text-amber-600/70 dark:text-amber-400/70">حد الطلب: {a.reorderLevel}</p>
                    </div>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{a.quantity} وحدة</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, loading, icon, className = "" }: {
  title: string; value?: string | number; loading?: boolean; icon: React.ReactNode; className?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="p-1.5 bg-background rounded-md shadow-sm border">{icon}</div>
        </div>
        {loading ? <Skeleton className="h-7 w-20 mt-1" /> : (
          <p className="text-xl font-bold tracking-tight truncate">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
