import { useState } from "react";
import { useGetSuppliers, useGetCustomers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Accounts() {
  const { data: suppliers, isLoading: isLoadingSuppliers } = useGetSuppliers({});
  const { data: customers, isLoading: isLoadingCustomers } = useGetCustomers({});

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الحسابات</h1>
        <p className="text-muted-foreground mt-1">إدارة حسابات الموردين والعملاء</p>
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="suppliers">حسابات الموردين</TabsTrigger>
          <TabsTrigger value="customers">حسابات العملاء</TabsTrigger>
        </TabsList>
        
        <TabsContent value="suppliers">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المورد</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSuppliers ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : suppliers?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.phone}</TableCell>
                      <TableCell dir="ltr" className="text-right font-semibold text-destructive">{s.balance}</TableCell>
                      <TableCell>
                        <Button size="sm">تسجيل دفعة</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customers">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">الرصيد</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingCustomers ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        {Array(4).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : customers?.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell dir="ltr" className="text-right font-semibold text-emerald-600">{c.balance}</TableCell>
                      <TableCell>
                        <Button size="sm">تحصيل دفعة</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}