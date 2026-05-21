import { useGetDashboardSummary, useGetDashboardSalesChart, useGetDashboardAlerts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Pill, CircleDollarSign, TrendingUp, AlertCircle, PackageSearch, PackageMinus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetDashboardAlerts();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على أداء الصيدلية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard 
          title="مبيعات اليوم" 
          value={summary?.todaySales.toFixed(2)} 
          loading={isLoadingSummary} 
          icon={<CircleDollarSign className="h-5 w-5 text-primary" />} 
          prefix="$"
        />
        <StatCard 
          title="صافي الربح" 
          value={summary?.netProfit.toFixed(2)} 
          loading={isLoadingSummary} 
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} 
          prefix="$"
        />
        <StatCard 
          title="إجمالي الأدوية" 
          value={summary?.totalMedicines} 
          loading={isLoadingSummary} 
          icon={<Pill className="h-5 w-5 text-blue-500" />} 
        />
        <StatCard 
          title="قيمة المخزون" 
          value={summary?.stockValue.toFixed(2)} 
          loading={isLoadingSummary} 
          icon={<PackageSearch className="h-5 w-5 text-purple-500" />} 
          prefix="$"
        />
        <StatCard 
          title="منتهية الصلاحية" 
          value={summary?.expiredCount} 
          loading={isLoadingSummary} 
          icon={<AlertCircle className="h-5 w-5 text-destructive" />} 
          className="border-destructive/20 bg-destructive/5"
        />
        <StatCard 
          title="منخفض المخزون" 
          value={summary?.lowStockCount} 
          loading={isLoadingSummary} 
          icon={<PackageMinus className="h-5 w-5 text-amber-500" />} 
          className="border-amber-500/20 bg-amber-500/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>المبيعات والأرباح (آخر 7 أيام)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {/* Chart placeholder since Recharts setup takes more files. I will use a simple placeholder for now. */}
            <div className="text-muted-foreground">جاري تحميل الرسم البياني...</div>
          </CardContent>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>التنبيهات</CardTitle>
            <CardDescription>أدوية تتطلب الانتباه</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {isLoadingAlerts ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : alerts?.nearExpiry?.length === 0 && alerts?.lowStock?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-2 text-muted" />
                <p>لا توجد تنبيهات حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts?.nearExpiry.map(alert => (
                  <div key={`exp-${alert.id}`} className="flex items-center justify-between p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <div>
                      <p className="font-medium text-destructive">{alert.name}</p>
                      <p className="text-xs text-destructive/80">ينتهي في {alert.expiryDate}</p>
                    </div>
                    <div className="text-sm font-semibold text-destructive">{alert.quantity} وحدة</div>
                  </div>
                ))}
                {alerts?.lowStock.map(alert => (
                  <div key={`low-${alert.id}`} className="flex items-center justify-between p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-500">{alert.name}</p>
                      <p className="text-xs text-amber-700/80 dark:text-amber-500/80">حد إعادة الطلب: {alert.reorderLevel}</p>
                    </div>
                    <div className="text-sm font-semibold text-amber-700 dark:text-amber-500">{alert.quantity} وحدة</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  loading, 
  icon, 
  prefix = "", 
  className = "" 
}: { 
  title: string; 
  value?: string | number; 
  loading?: boolean; 
  icon: React.ReactNode;
  prefix?: string;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4 sm:p-6 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">{title}</p>
          <div className="p-2 bg-background rounded-md shadow-sm border">{icon}</div>
        </div>
        <div className="mt-2">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <h3 className="text-2xl font-bold tracking-tight">
              {prefix}{value}
            </h3>
          )}
        </div>
      </CardContent>
    </Card>
  );
}