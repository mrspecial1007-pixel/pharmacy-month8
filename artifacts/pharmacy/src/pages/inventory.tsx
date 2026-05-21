import { useState, useEffect } from "react";
import { useGetInventoryCount, useSaveInventoryCount, getGetInventoryCountQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InventoryRow = { medicineId: number; medicineName: string; barcode: string | null; systemQuantity: number; actualQuantity: number };

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: inventory, isLoading, refetch } = useGetInventoryCount();
  const submit = useSaveInventoryCount();

  useEffect(() => {
    if (inventory) {
      setRows(inventory.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        barcode: item.barcode ?? null,
        systemQuantity: item.systemQuantity,
        actualQuantity: item.systemQuantity,
      })));
    }
  }, [inventory]);

  const filtered = rows.filter((r) =>
    !search || r.medicineName.toLowerCase().includes(search.toLowerCase()) || (r.barcode ?? "").includes(search)
  );

  const updateActual = (medicineId: number, value: string) => {
    const n = parseInt(value);
    if (isNaN(n) || n < 0) return;
    setRows((prev) => prev.map((r) => r.medicineId === medicineId ? { ...r, actualQuantity: n } : r));
  };

  const changedCount = rows.filter((r) => r.actualQuantity !== r.systemQuantity).length;

  const handleSave = () => {
    const items = rows
      .filter((r) => r.actualQuantity !== r.systemQuantity)
      .map((r) => ({ medicineId: r.medicineId, actualQuantity: r.actualQuantity }));

    if (!items.length) {
      toast({ title: "لا توجد تغييرات للحفظ", variant: "destructive" });
      return;
    }

    submit.mutate(
      { data: { items } },
      {
        onSuccess: (res: { savedCount: number; adjustedCount: number }) => {
          qc.invalidateQueries({ queryKey: getGetInventoryCountQueryKey() });
          refetch();
          toast({ title: `تم حفظ الجرد — تم تعديل ${res.adjustedCount} صنف` });
        },
        onError: () => toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الجرد الفعلي</h1>
          <p className="text-muted-foreground mt-1">مقارنة رصيد النظام بالرصيد الفعلي وتصحيح الفروقات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title="تحديث">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleSave} disabled={submit.isPending || !changedCount}>
            <Save className="ml-2 h-4 w-4" />
            {submit.isPending ? "جاري الحفظ..." : `حفظ الجرد${changedCount > 0 ? ` (${changedCount} تعديل)` : ""}`}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
          <p className="text-2xl font-bold mt-1">{rows.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">أصناف تم تعديلها</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{changedCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">إجمالي الفروقات</p>
          <p className="text-2xl font-bold mt-1 text-primary">
            {rows.reduce((s, r) => s + (r.actualQuantity - r.systemQuantity), 0)}
          </p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث بالاسم أو الباركود..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الدواء</TableHead>
                  <TableHead className="text-right">الباركود</TableHead>
                  <TableHead className="text-right">رصيد النظام</TableHead>
                  <TableHead className="text-right">الرصيد الفعلي</TableHead>
                  <TableHead className="text-right">الفرق</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => <TableRow key={i}>{Array(6).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                ) : !filtered.length ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-28 text-muted-foreground">لا توجد بيانات</TableCell></TableRow>
                ) : (
                  filtered.map((item) => {
                    const diff = item.actualQuantity - item.systemQuantity;
                    return (
                      <TableRow key={item.medicineId} className={diff !== 0 ? "bg-amber-50/50 dark:bg-amber-900/10" : "hover:bg-muted/40"}>
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">{item.barcode ?? "—"}</TableCell>
                        <TableCell className="font-semibold">{item.systemQuantity}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={item.actualQuantity}
                            onChange={(e) => updateActual(item.medicineId, e.target.value)}
                            className="w-24 text-center"
                            dir="ltr"
                          />
                        </TableCell>
                        <TableCell className={`font-bold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`} dir="ltr">
                          {diff > 0 ? `+${diff}` : diff}
                        </TableCell>
                        <TableCell>
                          {diff === 0 ? (
                            <span className="text-xs text-muted-foreground">لا تغيير</span>
                          ) : (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${diff > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                              {diff > 0 ? "زيادة" : "نقص"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
