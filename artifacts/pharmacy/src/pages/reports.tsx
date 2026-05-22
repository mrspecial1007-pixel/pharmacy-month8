import { useState } from "react";
import {
  useGetDailySalesReport, useGetTopSelling, useGetProfitabilityReport, useGetStockByCategory,
  useGetMedicines, useGetStockMovements, useGetPurchases, useGetExpiryAnalysis, useGetMedicine,
  type ProfitabilityItem,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { Search, TrendingUp, ShoppingBag, Crosshair } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " جنيه";

const MOVE_LABEL: Record<string, string> = { purchase: "شراء", sale: "بيع", return: "مرتجع", inventory: "جرد" };
const MOVE_VAR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  purchase: "default", sale: "secondary", return: "outline", inventory: "outline",
};
const URGENCY_COLOR: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function Reports() {
  const [salesPeriod, setSalesPeriod] = useState<"today" | "month" | "year">("month");
  const [topLimit, setTopLimit] = useState(10);
  const [stockSearch, setStockSearch] = useState("");
  const [staleSearch, setStaleSearch] = useState("");
  const [expiryFilter, setExpiryFilter] = useState<"1month" | "3months" | "6months">("3months");
  const [mvSearch, setMvSearch] = useState("");
  const [mvType, setMvType] = useState<"" | "purchase" | "sale" | "return" | "inventory">("");
  const [purchaseFrom, setPurchaseFrom] = useState("");
  const [purchaseTo, setPurchaseTo] = useState("");
  const [trackSearch, setTrackSearch] = useState("");
  const [trackId, setTrackId] = useState<number | null>(null);
  const [trackInputVal, setTrackInputVal] = useState("");

  const { data: salesData } = useGetDailySalesReport({ period: salesPeriod });
  const { data: topData } = useGetTopSelling({ limit: topLimit });
  const { data: profitItems } = useGetProfitabilityReport();
  const { data: catData } = useGetStockByCategory();
  const { data: allMeds, isLoading: isLoadingMeds } = useGetMedicines({
    search: stockSearch.length > 1 ? stockSearch : undefined,
  });
  const { data: expiryData } = useGetExpiryAnalysis({ period: expiryFilter });
  const { data: stockMoves, isLoading: isLoadingMv } = useGetStockMovements({
    type: mvType || undefined,
  });
  const { data: purchases, isLoading: isLoadingPurchases } = useGetPurchases({
    date_from: purchaseFrom || undefined,
    date_to: purchaseTo || undefined,
  });
  const { data: trackMeds } = useGetMedicines({ search: trackSearch.length > 2 ? trackSearch : undefined });
  // TODO: connect to API — per-item purchase/sale history
  const { data: trackMed } = useGetMedicine(trackId ?? 0, { query: { enabled: !!trackId } as any });

  // Compute profitability totals from array
  const profitData = profitItems as ProfitabilityItem[] | undefined;
  const profitTotalRevenue = profitData?.reduce((s, p) => s + p.totalRevenue, 0) ?? 0;
  const profitTotalCost    = profitData?.reduce((s, p) => s + p.totalCost, 0) ?? 0;
  const profitNetProfit    = profitData?.reduce((s, p) => s + p.profit, 0) ?? 0;

  // Sales chart — mock daily breakdown until API returns it
  const salesChartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { day: d.toLocaleDateString("ar-LY", { month: "short", day: "numeric" }), مبيعات: 0, أرباح: 0 };
  });

  const filteredExpiry = (expiryData ?? []).sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  );

  const staleItems = (allMeds ?? []).filter((m) => m.quantity <= (m.reorderLevel ?? 10));

  // TODO: connect to API — mock item tracking data
  const mockTracking = trackId && trackMed ? {
    purchases: Array.from({ length: 3 }, (_, i) => ({
      date: new Date(Date.now() - (i + 1) * 8 * 86400000).toLocaleDateString("ar-LY"),
      qty: (i + 1) * 10,
      price: trackMed.purchasePrice as number,
      supplier: "مورد رقم " + (i + 1),
    })),
    sales: Array.from({ length: 4 }, (_, i) => ({
      date: new Date(Date.now() - i * 2 * 86400000).toLocaleString("ar-LY"),
      qty: i + 2,
      price: trackMed.salePrice as number,
      shift: `وردية ${i + 1}`,
    })),
  } : null;

  const totalBought = mockTracking?.purchases.reduce((s, p) => s + p.qty * p.price, 0) ?? 0;
  const totalSold   = mockTracking?.sales.reduce((s, p) => s + p.qty * p.price, 0) ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير</h1>
        <p className="text-muted-foreground mt-1">تقارير شاملة للمبيعات والمخزون والمشتريات</p>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="flex-wrap h-auto gap-1 mb-4 justify-start">
          <TabsTrigger value="sales">ملخص المبيعات</TabsTrigger>
          <TabsTrigger value="top">الأكثر مبيعاً</TabsTrigger>
          <TabsTrigger value="profit">الربحية</TabsTrigger>
          <TabsTrigger value="catstock">المخزون بالفئة</TabsTrigger>
          <TabsTrigger value="available">المخزون المتوفر</TabsTrigger>
          <TabsTrigger value="stale">المخزون الراكد</TabsTrigger>
          <TabsTrigger value="expiry">الأقرب انتهاءً</TabsTrigger>
          <TabsTrigger value="purchases">المشتريات</TabsTrigger>
          <TabsTrigger value="movements">حركة المخزون</TabsTrigger>
          <TabsTrigger value="track">تتبع صنف</TabsTrigger>
        </TabsList>

        {/* 1. SALES SUMMARY */}
        <TabsContent value="sales">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">الفترة:</span>
              {([["today", "اليوم"], ["month", "هذا الشهر"], ["year", "هذه السنة"]] as const).map(([v, l]) => (
                <Button key={v} size="sm" variant={salesPeriod === v ? "default" : "outline"} onClick={() => setSalesPeriod(v)}>{l}</Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "إجمالي المبيعات",  value: fmt(salesData?.totalSales ?? 0),    color: "text-primary" },
                { label: "إجمالي الأرباح",   value: fmt(salesData?.totalProfit ?? 0),   color: "text-emerald-600" },
                { label: "عدد الفواتير",     value: String(salesData?.invoiceCount ?? 0), color: "" },
              ].map((c) => (
                <Card key={c.label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{c.label}</p><p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p></CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">المبيعات والأرباح اليومية</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="cS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00897B" stopOpacity={0.3}/><stop offset="95%" stopColor="#00897B" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/><stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="مبيعات" stroke="#00897B" fill="url(#cS)" />
                    <Area type="monotone" dataKey="أرباح" stroke="#4CAF50" fill="url(#cP)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. TOP SELLING */}
        <TabsContent value="top">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">عرض أفضل:</span>
              {[5, 10, 20].map((l) => (
                <Button key={l} size="sm" variant={topLimit === l ? "default" : "outline"} onClick={() => setTopLimit(l)}>{l} أصناف</Button>
              ))}
            </div>
            <Card>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={topData ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="medicineName" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => v + " وحدة"} />
                    <Bar dataKey="totalQuantity" fill="#00897B" radius={[0, 4, 4, 0]} name="الكمية" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. PROFITABILITY */}
        <TabsContent value="profit">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "إجمالي الإيرادات", value: fmt(profitTotalRevenue) },
                { label: "إجمالي التكلفة",   value: fmt(profitTotalCost) },
                { label: "صافي الربح",       value: fmt(profitNetProfit) },
              ].map((c) => <Card key={c.label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{c.label}</p><p className="text-2xl font-bold mt-1">{c.value}</p></CardContent></Card>)}
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">توزيع الربحية بالصنف</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(profitData ?? []).slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="medicineName" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="profit" fill="#4CAF50" radius={[0, 4, 4, 0]} name="الربح" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 4. STOCK BY CATEGORY */}
        <TabsContent value="catstock">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(catData ?? []).map((cat: any) => (
              <Card key={cat.categoryId ?? cat.categoryName}>
                <CardContent className="p-4">
                  <p className="font-semibold">{cat.categoryName ?? "غير مصنف"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{cat.medicineCount} صنف · {cat.totalQuantity} وحدة</p>
                  <p className="text-primary font-bold mt-2">{fmt(cat.totalValue ?? 0)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 5. AVAILABLE STOCK */}
        <TabsContent value="available">
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="البحث باسم الصنف..." value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} className="pl-3 pr-9" />
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">الفئة</TableHead>
                    <TableHead className="text-right">الكمية المتاحة</TableHead>
                    <TableHead className="text-right">الوحدة</TableHead>
                    <TableHead className="text-right">سعر الشراء</TableHead>
                    <TableHead className="text-right">سعر البيع</TableHead>
                    <TableHead className="text-right">القيمة الإجمالية</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {isLoadingMeds ? Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                    !allMeds?.length ? <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">لا توجد أصناف</TableCell></TableRow> :
                    allMeds.map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell>{m.categoryName ? <Badge variant="secondary">{m.categoryName}</Badge> : "—"}</TableCell>
                        <TableCell className={`font-bold ${m.quantity <= (m.reorderLevel ?? 10) ? "text-destructive" : "text-emerald-600"}`}>{m.quantity}</TableCell>
                        <TableCell>{m.unit ?? "—"}</TableCell>
                        <TableCell>{fmt(m.purchasePrice as number)}</TableCell>
                        <TableCell>{fmt(m.salePrice as number)}</TableCell>
                        <TableCell className="font-semibold text-primary">{fmt((m.purchasePrice as number) * m.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              إجمالي قيمة المخزون: <span className="font-bold text-foreground">{fmt(allMeds?.reduce((s, m) => s + (m.purchasePrice as number) * m.quantity, 0) ?? 0)}</span>
            </p>
          </div>
        </TabsContent>

        {/* 6. STALE STOCK */}
        <TabsContent value="stale">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative max-w-xs">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="البحث..." value={staleSearch} onChange={(e) => setStaleSearch(e.target.value)} className="pl-3 pr-9" />
              </div>
              <p className="text-xs text-muted-foreground">يعرض الأصناف المنخفضة المخزون حالياً — سيتم ربطه بـ API</p>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right">آخر حركة</TableHead>
                    <TableHead className="text-right">الانتهاء</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!staleItems.filter((m) => !staleSearch || m.name.includes(staleSearch)).length ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا يوجد مخزون راكد</TableCell></TableRow>
                    ) : staleItems.filter((m) => !staleSearch || m.name.includes(staleSearch)).map((m) => (
                      <TableRow key={m.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{m.name}</TableCell>
                        <TableCell className="text-destructive font-bold">{m.quantity}</TableCell>
                        <TableCell>{fmt((m.purchasePrice as number) * m.quantity)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">—</TableCell>
                        <TableCell className={m.expiryDate && new Date(m.expiryDate) < new Date() ? "text-destructive font-bold" : ""}>{m.expiryDate ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 7. EXPIRY */}
        <TabsContent value="expiry">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">تصفية خلال:</span>
              {([["1month", "شهر"], ["3months", "3 أشهر"], ["6months", "6 أشهر"]] as const).map(([v, l]) => (
                <Button key={v} size="sm" variant={expiryFilter === v ? "default" : "outline"} onClick={() => setExpiryFilter(v)}>{l}</Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "حرجة",  count: filteredExpiry.filter((e) => e.urgency === "critical").length, color: "text-destructive" },
                { label: "قريبة", count: filteredExpiry.filter((e) => e.urgency === "high").length,     color: "text-orange-500" },
                { label: "تنبيه", count: filteredExpiry.filter((e) => e.urgency === "medium").length,   color: "text-yellow-500" },
              ].map((c) => (
                <Card key={c.label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{c.label}</p><p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.count}</p></CardContent></Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-right">الأيام المتبقية</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!filteredExpiry.length ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد أصناف</TableCell></TableRow>
                    ) : filteredExpiry.map((e) => {
                      const daysLeft = e.daysUntilExpiry;
                      return (
                        <TableRow key={e.id} className="hover:bg-muted/40">
                          <TableCell className="font-medium">{e.name}</TableCell>
                          <TableCell>{e.expiryDate}</TableCell>
                          <TableCell className={daysLeft < 0 ? "text-destructive font-bold" : daysLeft < 30 ? "text-orange-500 font-bold" : ""}>
                            {daysLeft < 0 ? "منتهي" : daysLeft + " يوم"}
                          </TableCell>
                          <TableCell>{e.quantity}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${URGENCY_COLOR[e.urgency ?? ""] ?? ""}`}>
                              {e.urgency === "critical" ? "حرجة" : e.urgency === "high" ? "قريبة" : "تنبيه"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 8. PURCHASES */}
        <TabsContent value="purchases">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-medium">من:</span>
              <Input type="date" value={purchaseFrom} onChange={(e) => setPurchaseFrom(e.target.value)} className="w-36" dir="ltr" />
              <span className="text-sm font-medium">إلى:</span>
              <Input type="date" value={purchaseTo} onChange={(e) => setPurchaseTo(e.target.value)} className="w-36" dir="ltr" />
              {(purchaseFrom || purchaseTo) && <Button variant="ghost" size="sm" onClick={() => { setPurchaseFrom(""); setPurchaseTo(""); }}>مسح</Button>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">عدد الفواتير</p><p className="text-2xl font-bold mt-1">{purchases?.length ?? 0}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">إجمالي المشتريات</p><p className="text-2xl font-bold mt-1 text-primary">{fmt(purchases?.reduce((s, p) => s + (p.total ?? 0), 0) ?? 0)}</p></CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">المورد</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">ملاحظات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {isLoadingPurchases ? Array(4).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                    !purchases?.length ? <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا توجد مشتريات</TableCell></TableRow> :
                    purchases.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-sm">{p.invoiceNumber}</TableCell>
                        <TableCell>{p.supplierName ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(p.createdAt).toLocaleDateString("ar-LY")}</TableCell>
                        <TableCell className="font-bold">{fmt(p.total ?? 0)}</TableCell>
                        <TableCell className="text-muted-foreground">{p.status ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">—</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 9. STOCK MOVEMENTS */}
        <TabsContent value="movements">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["", "purchase", "sale", "return", "inventory"] as const).map((t) => (
                <Button key={t} size="sm" variant={mvType === t ? "default" : "outline"} onClick={() => setMvType(t)}>
                  {t === "" ? "الكل" : MOVE_LABEL[t]}
                </Button>
              ))}
              <div className="relative flex-1 min-w-48 mr-auto">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="البحث باسم الصنف..." value={mvSearch} onChange={(e) => setMvSearch(e.target.value)} className="pr-9" />
              </div>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الصنف</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">المرجع</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {isLoadingMv ? Array(5).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) :
                    !stockMoves?.length ? <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد حركات مخزون</TableCell></TableRow> :
                    stockMoves.map((mv) => (
                      <TableRow key={mv.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{mv.medicineName}</TableCell>
                        <TableCell><Badge variant={MOVE_VAR[mv.type] ?? "outline"}>{MOVE_LABEL[mv.type] ?? mv.type}</Badge></TableCell>
                        <TableCell className={`font-bold ${mv.type === "sale" ? "text-destructive" : "text-emerald-600"}`}>
                          {mv.type === "sale" ? `-${mv.quantity}` : `+${mv.quantity}`}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{(mv as any).referenceId ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(mv.createdAt).toLocaleString("ar-LY")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 10. ITEM TRACKING */}
        <TabsContent value="track">
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن صنف بالاسم أو الباركود..."
                value={trackInputVal}
                onChange={(e) => {
                  setTrackInputVal(e.target.value);
                  setTrackSearch(e.target.value);
                  if (!e.target.value) setTrackId(null);
                }}
                className="pl-3 pr-9 h-12 text-lg"
              />
            </div>

            {trackSearch.length > 2 && !trackId && (trackMeds?.length ?? 0) > 0 && (
              <Card>
                <CardContent className="p-2">
                  {trackMeds!.map((m) => (
                    <button key={m.id}
                      className="w-full text-right px-3 py-2 hover:bg-muted rounded-md transition-colors flex justify-between"
                      onClick={() => { setTrackId(m.id); setTrackInputVal(m.name); setTrackSearch(""); }}>
                      <span className="font-medium">{m.name}</span>
                      <span className="text-muted-foreground text-sm">{m.quantity} {m.unit}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {trackId && trackMed && mockTracking && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">{trackMed.name}</h2>
                  <Button variant="ghost" size="sm" onClick={() => { setTrackId(null); setTrackInputVal(""); }}>تغيير الصنف</Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "إجمالي المشتريات",   value: fmt(totalBought) },
                    { label: "إجمالي المبيعات",    value: fmt(totalSold) },
                    { label: "الكمية المتبقية",     value: `${trackMed.quantity} ${trackMed.unit}` },
                    { label: "إجمالي الربح المقدر", value: fmt(totalSold - totalBought) },
                  ].map((c) => (
                    <Card key={c.label}><CardContent className="p-3"><p className="text-xs text-muted-foreground">{c.label}</p><p className="font-bold mt-0.5">{c.value}</p></CardContent></Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><ShoppingBag className="h-4 w-4" /> المشتريات</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-right text-xs">التاريخ</TableHead>
                          <TableHead className="text-right text-xs">الكمية</TableHead>
                          <TableHead className="text-right text-xs">السعر</TableHead>
                          <TableHead className="text-right text-xs">المورد</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {mockTracking.purchases.map((p, i) => (
                            <TableRow key={i}><TableCell className="text-xs">{p.date}</TableCell><TableCell>{p.qty}</TableCell><TableCell>{fmt(p.price)}</TableCell><TableCell className="text-muted-foreground text-xs">{p.supplier}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> المبيعات</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead className="text-right text-xs">التاريخ</TableHead>
                          <TableHead className="text-right text-xs">الكمية</TableHead>
                          <TableHead className="text-right text-xs">السعر</TableHead>
                          <TableHead className="text-right text-xs">الوردية</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {mockTracking.sales.map((s, i) => (
                            <TableRow key={i}><TableCell className="text-xs">{s.date}</TableCell><TableCell>{s.qty}</TableCell><TableCell>{fmt(s.price)}</TableCell><TableCell className="text-muted-foreground text-xs">{s.shift}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-xs text-muted-foreground">// TODO: connect to API — بيانات تتبع الصنف حالياً محاكاة</p>
              </div>
            )}

            {!trackId && trackSearch.length <= 2 && (
              <div className="text-center py-16 text-muted-foreground">
                <Crosshair className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>ابحث عن صنف لعرض تاريخه الكامل</p>
                <p className="text-sm mt-1">(المشتريات، المبيعات، الكمية المتبقية، الربح)</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
