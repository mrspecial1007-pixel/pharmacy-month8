import { useState } from "react";
import { useGetStockMovements } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  purchase: { label: "شراء", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  sale:     { label: "بيع",  color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
  return:   { label: "مرتجع", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  inventory:{ label: "جرد",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
};

export default function StockMovements() {
  const [type, setType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: movements, isLoading } = useGetStockMovements({
    type: type !== "all" ? type : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">حركة المخزون</h1>
        <p className="text-muted-foreground mt-1">سجل تحركات الأدوية الواردة والصادرة</p>
      </div>

      <Card>
        <CardHeader className="py-4 border-b">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="نوع الحركة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="purchase">شراء</SelectItem>
                <SelectItem value="sale">بيع</SelectItem>
                <SelectItem value="return">مرتجع</SelectItem>
                <SelectItem value="inventory">جرد</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-36" dir="ltr" />
            <span className="text-muted-foreground text-sm">إلى</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-36" dir="ltr" />
            {(dateFrom || dateTo || type !== "all") && (
              <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); setType("all"); }}>مسح الفلاتر</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الدواء</TableHead>
                  <TableHead className="text-right">نوع الحركة</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">المرجع</TableHead>
                  <TableHead className="text-right">التاريخ والوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => <TableRow key={i}>{Array(5).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                ) : !movements?.length ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-28 text-muted-foreground">لا توجد حركات مخزون</TableCell></TableRow>
                ) : (
                  movements.map((m) => {
                    const t = TYPE_MAP[m.type] ?? { label: m.type, color: "bg-muted text-muted-foreground" };
                    const qty = m.quantity as number;
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{m.medicineName}</TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${t.color}`}>{t.label}</span>
                        </TableCell>
                        <TableCell dir="ltr" className={`font-bold text-right ${qty > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {qty > 0 ? `+${qty}` : qty}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm font-mono">{m.reference ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{new Date(m.createdAt).toLocaleString("ar-SA")}</TableCell>
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
