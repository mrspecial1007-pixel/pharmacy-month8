import { useState } from "react";
import { useGetMedicines, useCreateMedicine, useUpdateMedicine, useDeleteMedicine, getGetMedicinesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";

export default function Medicines() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low_stock" | "expired">("all");
  
  const { data: medicines, isLoading } = useGetMedicines({
    search: search.length > 2 ? search : undefined,
    filter: filter === "all" ? undefined : filter
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الأدوية</h1>
          <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف الأدوية من المخزون</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>الكل</Button>
          <Button variant={filter === "low_stock" ? "default" : "outline"} onClick={() => setFilter("low_stock")}>منخفض</Button>
          <Button variant={filter === "expired" ? "default" : "outline"} onClick={() => setFilter("expired")}>منتهي</Button>
          <Button className="mr-4">
            <Plus className="ml-2 h-4 w-4" />
            إضافة دواء
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="البحث عن دواء..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3 pr-9"
              dir="rtl"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الدواء</TableHead>
                <TableHead className="text-right">الاسم العلمي</TableHead>
                <TableHead className="text-right">المخزون</TableHead>
                <TableHead className="text-right">الوحدة</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">سعر البيع</TableHead>
                <TableHead className="text-right">الإنتاج</TableHead>
                <TableHead className="text-right">الانتهاء</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(9).fill(0).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : medicines?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                medicines?.map((med) => (
                  <TableRow key={med.id}>
                    <TableCell className="font-medium">{med.name}</TableCell>
                    <TableCell>{med.scientificName}</TableCell>
                    <TableCell>
                      <span className={med.quantity <= (med.reorderLevel || 10) ? "text-destructive font-bold" : ""}>
                        {med.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{med.unit}</TableCell>
                    <TableCell>{med.location}</TableCell>
                    <TableCell>{med.salePrice}</TableCell>
                    <TableCell>{med.productionDate}</TableCell>
                    <TableCell>
                      <span className={new Date(med.expiryDate || "") < new Date() ? "text-destructive font-bold" : ""}>
                        {med.expiryDate}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
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