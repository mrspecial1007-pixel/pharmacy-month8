import { useGetSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إعدادات وتفضيلات النظام</p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[250px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الصيدلية</CardTitle>
              <CardDescription>المعلومات الأساسية للصيدلية التي تظهر في الفواتير</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">اسم الصيدلية</label>
                  <Input defaultValue={settings?.pharmacyName} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">رقم الهاتف</label>
                  <Input defaultValue={settings?.phone || ''} dir="ltr" className="text-right" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">العنوان</label>
                  <Input defaultValue={settings?.address || ''} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات التشغيل</CardTitle>
              <CardDescription>القيم الافتراضية والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">حد المخزون المنخفض (افتراضي)</label>
                  <Input type="number" defaultValue={settings?.lowStockThreshold} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">أيام التنبيه بقرب الانتهاء</label>
                  <Input type="number" defaultValue={settings?.nearExpiryDays} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">نسبة الضريبة (%)</label>
                  <Input type="number" defaultValue={settings?.taxRate} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تذييل الفاتورة</label>
                  <Input defaultValue={settings?.invoiceFooter || ''} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ الإعدادات
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}