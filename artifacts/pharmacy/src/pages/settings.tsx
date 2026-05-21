import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Building2, Settings2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Form = {
  pharmacyName: string; address: string; phone: string;
  lowStockThreshold: string; nearExpiryDays: string; taxRate: string;
  invoiceFooter: string; printerName: string;
};

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const update = useUpdateSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<Form>({
    pharmacyName: "", address: "", phone: "", lowStockThreshold: "10",
    nearExpiryDays: "90", taxRate: "0", invoiceFooter: "", printerName: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        pharmacyName: settings.pharmacyName ?? "",
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        lowStockThreshold: settings.lowStockThreshold?.toString() ?? "10",
        nearExpiryDays: settings.nearExpiryDays?.toString() ?? "90",
        taxRate: (settings.taxRate as number)?.toString() ?? "0",
        invoiceFooter: settings.invoiceFooter ?? "",
        printerName: settings.printerName ?? "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    update.mutate(
      {
        data: {
          pharmacyName: form.pharmacyName || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
          nearExpiryDays: parseInt(form.nearExpiryDays) || 90,
          taxRate: parseFloat(form.taxRate) || 0,
          invoiceFooter: form.invoiceFooter || undefined,
          printerName: form.printerName || undefined,
        },
      },
      { onSuccess: () => toast({ title: "تم حفظ الإعدادات بنجاح" }) }
    );
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5"><label className="text-sm font-medium">{label}</label>{children}</div>
  );

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[220px] w-full" />
      <Skeleton className="h-[280px] w-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
          <p className="text-muted-foreground mt-1">إعدادات وتفضيلات النظام</p>
        </div>
        <Button onClick={handleSave} disabled={update.isPending}>
          <Save className="ml-2 h-4 w-4" />
          {update.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> بيانات الصيدلية</CardTitle>
          <CardDescription>المعلومات الأساسية التي تظهر في الفواتير والتقارير</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <F label="اسم الصيدلية">
            <Input value={form.pharmacyName} onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })} placeholder="صيدلية النور" />
          </F>
          <F label="رقم الهاتف">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" className="text-right" placeholder="05XXXXXXXX" />
          </F>
          <F label="العنوان" >
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="شارع، حي، مدينة" className="md:col-span-2" />
          </F>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-sm font-medium">تذييل الفاتورة</label>
            <Textarea value={form.invoiceFooter} onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })} rows={2} placeholder="شكراً لزيارتكم..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-amber-500" /> إعدادات التنبيهات</CardTitle>
          <CardDescription>حدود التنبيه لمستوى المخزون وتواريخ الانتهاء</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <F label="حد المخزون المنخفض (وحدة)">
            <Input type="number" min="1" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} dir="ltr" />
          </F>
          <F label="تنبيه قرب الانتهاء (يوم)">
            <Input type="number" min="1" value={form.nearExpiryDays} onChange={(e) => setForm({ ...form, nearExpiryDays: e.target.value })} dir="ltr" />
          </F>
          <F label="نسبة ضريبة القيمة المضافة (%)">
            <Input type="number" min="0" max="100" step="0.5" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} dir="ltr" />
          </F>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-blue-500" /> إعدادات الطباعة</CardTitle>
          <CardDescription>إعداد الطابعة الحرارية لطباعة الفواتير</CardDescription>
        </CardHeader>
        <CardContent>
          <F label="اسم الطابعة">
            <Input value={form.printerName} onChange={(e) => setForm({ ...form, printerName: e.target.value })} placeholder="مثال: POS-58 Thermal Printer" />
          </F>
        </CardContent>
      </Card>
    </div>
  );
}
