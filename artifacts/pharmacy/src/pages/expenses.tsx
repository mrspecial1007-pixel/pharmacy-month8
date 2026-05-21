import { useGetExpenses } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Expenses() {
  const { data: expenses, isLoading } = useGetExpenses({});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المصاريف</h1>
          <p className="text-muted-foreground mt-1">سجل النفقات والمصروفات التشغيلية</p>
        </div>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          إضافة مصروف
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">التصنيف</TableHead>
                <TableHead className="text-right">الوصف</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : expenses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">لا توجد مصاريف</TableCell>
                </TableRow>
              ) : (
                expenses?.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{new Date(expense.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell className="font-medium">{expense.category}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.description || '-'}</TableCell>
                    <TableCell className="font-bold text-rose-600">${expense.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}