import { useState } from "react";
import {
  useGetMedicines, useCreateMedicine, useUpdateMedicine, useDeleteMedicine,
  useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  getGetMedicinesQueryKey, getGetCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit, Trash2, AlertTriangle, Pill, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fmt = (n: number) => n.toLocaleString("ar-LY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " جنيه";

type MedForm = {
  name: string; barcode: string; scientificName: string; manufacturer: string;
  unit: string; stripCount: string; categoryId: string; location: string;
  purchasePrice: string; salePrice: string; reorderLevel: string;
  productionDate: string; expiryDate: string;
};
const EMPTY_MED: MedForm = {
  name: "", barcode: "", scientificName: "", manufacturer: "",
  unit: "علبة", stripCount: "", categoryId: "", location: "",
  purchasePrice: "", salePrice: "", reorderLevel: "10",
  productionDate: "", expiryDate: "",
};

const CAT_ICONS = ["💊", "💉", "🩺", "🩹", "🧪", "🌿", "❤️", "🦷", "👁️", "🧴"];

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-sm font-medium">{label}</label>{children}</div>;
}

export default function Medicines() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low_stock" | "expired" | "near_expiry">("all");

  // Medicine dialog
  const [medOpen, setMedOpen] = useState(false);
  const [medEditing, setMedEditing] = useState<number | null>(null);
  const [medForm, setMedForm] = useState<MedForm>(EMPTY_MED);
  const [medDeleting, setMedDeleting] = useState<{ id: number; name: string } | null>(null);

  // Category dialog
  const [catOpen, setCatOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<number | null>(null);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("💊");
  const [catDeleting, setCatDeleting] = useState<{ id: number; name: string } | null>(null);

  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: medicines, isLoading } = useGetMedicines({
    search: search.length > 1 ? search : undefined,
    filter: filter === "all" ? undefined : filter,
  });
  const { data: categories, isLoading: isLoadingCat } = useGetCategories();

  const createMed = useCreateMedicine();
  const updateMed = useUpdateMedicine();
  const delMed = useDeleteMedicine();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const delCat = useDeleteCategory();

  const invMed = () => qc.invalidateQueries({ queryKey: getGetMedicinesQueryKey() });
  const invCat = () => qc.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });

  // Medicine handlers
  const openAddMed = () => { setMedForm(EMPTY_MED); setMedEditing(null); setMedOpen(true); };
  const openEditMed = (m: NonNullable<typeof medicines>[number]) => {
    setMedForm({
      name: m.name, barcode: m.barcode ?? "", scientificName: m.scientificName ?? "",
      manufacturer: m.manufacturer ?? "", unit: m.unit ?? "علبة",
      stripCount: (m as any).stripCount?.toString() ?? "",
      categoryId: m.categoryId?.toString() ?? "", location: m.location ?? "",
      purchasePrice: (m.purchasePrice as number)?.toString() ?? "",
      salePrice: (m.salePrice as number)?.toString() ?? "",
      reorderLevel: m.reorderLevel?.toString() ?? "10",
      productionDate: m.productionDate ?? "", expiryDate: m.expiryDate ?? "",
    });
    setMedEditing(m.id); setMedOpen(true);
  };
  const saveMed = () => {
    if (!medForm.name.trim()) { toast({ title: "اسم الصنف مطلوب", variant: "destructive" }); return; }
    const payload = {
      name: medForm.name, barcode: medForm.barcode || null, scientificName: medForm.scientificName || null,
      manufacturer: medForm.manufacturer || null, unit: medForm.unit || null,
      stripCount: medForm.unit === "علبة" && medForm.stripCount ? parseInt(medForm.stripCount) : null,
      categoryId: medForm.categoryId ? parseInt(medForm.categoryId) : null,
      location: medForm.location || null,
      purchasePrice: parseFloat(medForm.purchasePrice) || 0,
      salePrice: parseFloat(medForm.salePrice) || 0,
      reorderLevel: parseInt(medForm.reorderLevel) || 10,
      productionDate: medForm.productionDate || null,
      expiryDate: medForm.expiryDate || null,
    };
    if (medEditing) {
      updateMed.mutate({ id: medEditing, data: payload }, { onSuccess: () => { setMedOpen(false); invMed(); toast({ title: "تم تحديث الصنف" }); } });
    } else {
      createMed.mutate({ data: { ...payload, quantity: 0 } }, { onSuccess: () => { setMedOpen(false); invMed(); toast({ title: "تم إضافة الصنف" }); } });
    }
  };

  // Category handlers
  const openAddCat = () => { setCatName(""); setCatIcon("💊"); setCatEditing(null); setCatOpen(true); };
  const openEditCat = (c: NonNullable<typeof categories>[number]) => {
    setCatName(c.name); setCatIcon(c.icon ?? "💊"); setCatEditing(c.id); setCatOpen(true);
  };
  const saveCat = () => {
    if (!catName.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    if (catEditing) {
      updateCat.mutate({ id: catEditing, data: { name: catName, icon: catIcon } }, { onSuccess: () => { setCatOpen(false); invCat(); toast({ title: "تم تحديث الفئة" }); } });
    } else {
      createCat.mutate({ data: { name: catName, icon: catIcon } }, { onSuccess: () => { setCatOpen(false); invCat(); toast({ title: "تم إضافة الفئة" }); } });
    }
  };

  const isExpired = (d?: string | null) => d && new Date(d) < new Date();
  const isLow = (qty: number, level?: number | null) => qty <= (level ?? 10);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة الأصناف</h1>
        <p className="text-muted-foreground mt-1">إدارة الأدوية والمستلزمات وتصنيفاتها</p>
      </div>

      <Tabs defaultValue="medicines">
        <TabsList className="mb-4">
          <TabsTrigger value="medicines" className="flex items-center gap-1.5"><Pill className="h-3.5 w-3.5" /> الأصناف</TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> الفئات</TabsTrigger>
        </TabsList>

        {/* ── MEDICINES TAB ── */}
        <TabsContent value="medicines">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "low_stock", "expired", "near_expiry"] as const).map((f) => (
                  <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                    {f === "all" ? "الكل" : f === "low_stock" ? "منخفض" : f === "expired" ? "منتهي" : "قريب الانتهاء"}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="البحث بالاسم أو الباركود..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-9" />
                </div>
                <Button onClick={openAddMed}><Plus className="ml-2 h-4 w-4" /> إضافة صنف</Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right min-w-[160px]">الصنف</TableHead>
                        <TableHead className="text-right">الاسم العلمي</TableHead>
                        <TableHead className="text-right">الفئة</TableHead>
                        <TableHead className="text-right">المخزون</TableHead>
                        <TableHead className="text-right">الوحدة</TableHead>
                        <TableHead className="text-right">الأشرطة/علبة</TableHead>
                        <TableHead className="text-right">سعر الشراء</TableHead>
                        <TableHead className="text-right">سعر البيع</TableHead>
                        <TableHead className="text-right">الانتهاء</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        Array(6).fill(0).map((_, i) => <TableRow key={i}>{Array(10).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>)
                      ) : !medicines?.length ? (
                        <TableRow><TableCell colSpan={10} className="text-center h-28 text-muted-foreground"><Pill className="h-8 w-8 mx-auto mb-2 opacity-30" />لا توجد أصناف</TableCell></TableRow>
                      ) : (
                        medicines.map((med) => (
                          <TableRow key={med.id} className="hover:bg-muted/40">
                            <TableCell className="font-medium">{med.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{med.scientificName ?? "—"}</TableCell>
                            <TableCell>{med.categoryName ? <Badge variant="secondary">{med.categoryName}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell>
                              <span className={`font-bold ${isLow(med.quantity, med.reorderLevel) ? "text-destructive" : "text-emerald-600"}`}>{med.quantity}</span>
                            </TableCell>
                            <TableCell>{med.unit ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{(med as any).stripCount ?? "—"}</TableCell>
                            <TableCell>{fmt(med.purchasePrice as number)}</TableCell>
                            <TableCell className="font-semibold text-primary">{fmt(med.salePrice as number)}</TableCell>
                            <TableCell><span className={isExpired(med.expiryDate) ? "text-destructive font-bold" : ""}>{med.expiryDate ?? "—"}</span></TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMed(med)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setMedDeleting({ id: med.id, name: med.name })}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── CATEGORIES TAB ── */}
        <TabsContent value="categories">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={openAddCat}><Plus className="ml-2 h-4 w-4" /> إضافة فئة</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {isLoadingCat ? (
                Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
              ) : !categories?.length ? (
                <div className="col-span-full p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>لا توجد فئات حالياً</p>
                </div>
              ) : (
                categories.map((cat) => (
                  <Card key={cat.id} className="hover:border-primary/50 transition-colors group">
                    <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                      <div className="text-4xl mb-1">{cat.icon ?? "💊"}</div>
                      <h3 className="font-semibold">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground">{cat.medicineCount} صنف</p>
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCat(cat)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCatDeleting({ id: cat.id, name: cat.name })}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Medicine Add/Edit Dialog ── */}
      <Dialog open={medOpen} onOpenChange={setMedOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{medEditing ? "تعديل الصنف" : "إضافة صنف جديد"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <F label="اسم الصنف *"><Input value={medForm.name} onChange={(e) => setMedForm({ ...medForm, name: e.target.value })} placeholder="مثال: باراسيتامول 500مج" /></F>
            <F label="الاسم العلمي"><Input value={medForm.scientificName} onChange={(e) => setMedForm({ ...medForm, scientificName: e.target.value })} /></F>
            <F label="الباركود"><Input value={medForm.barcode} onChange={(e) => setMedForm({ ...medForm, barcode: e.target.value })} dir="ltr" /></F>
            <F label="الشركة المصنعة"><Input value={medForm.manufacturer} onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })} /></F>
            <F label="الفئة">
              <Select value={medForm.categoryId} onValueChange={(v) => setMedForm({ ...medForm, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="الوحدة">
              <Select value={medForm.unit} onValueChange={(v) => setMedForm({ ...medForm, unit: v, stripCount: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["علبة", "شريط", "زجاجة", "أنبوب", "حقنة", "كيس", "قطعة"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </F>
            {medForm.unit === "علبة" && (
              <F label="عدد الأشرطة في العبوة">
                <Input type="number" min="1" value={medForm.stripCount} onChange={(e) => setMedForm({ ...medForm, stripCount: e.target.value })} placeholder="مثال: 2" dir="ltr" />
              </F>
            )}
            <F label="سعر الشراء (جنيه)"><Input type="number" min="0" step="0.01" value={medForm.purchasePrice} onChange={(e) => setMedForm({ ...medForm, purchasePrice: e.target.value })} dir="ltr" /></F>
            <F label="سعر البيع (جنيه)"><Input type="number" min="0" step="0.01" value={medForm.salePrice} onChange={(e) => setMedForm({ ...medForm, salePrice: e.target.value })} dir="ltr" /></F>
            <F label="حد إعادة الطلب"><Input type="number" min="0" value={medForm.reorderLevel} onChange={(e) => setMedForm({ ...medForm, reorderLevel: e.target.value })} dir="ltr" /></F>
            <F label="الموقع في المستودع"><Input value={medForm.location} onChange={(e) => setMedForm({ ...medForm, location: e.target.value })} placeholder="مثال: رف A-3" /></F>
            <F label="تاريخ الإنتاج"><Input type="date" value={medForm.productionDate} onChange={(e) => setMedForm({ ...medForm, productionDate: e.target.value })} dir="ltr" /></F>
            <F label="تاريخ الانتهاء"><Input type="date" value={medForm.expiryDate} onChange={(e) => setMedForm({ ...medForm, expiryDate: e.target.value })} dir="ltr" /></F>
          </div>
          {medForm.unit === "علبة" && medForm.stripCount && parseFloat(medForm.salePrice) > 0 && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary">
              💡 سعر الشريط = {fmt(parseFloat(medForm.salePrice) / parseInt(medForm.stripCount) || 0)} (يحسب تلقائياً)
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMedOpen(false)}>إلغاء</Button>
            <Button onClick={saveMed} disabled={createMed.isPending || updateMed.isPending}>{createMed.isPending || updateMed.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Medicine */}
      <Dialog open={!!medDeleting} onOpenChange={() => setMedDeleting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف <span className="font-bold text-foreground">{medDeleting?.name}</span>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMedDeleting(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => delMed.mutate({ id: medDeleting!.id }, { onSuccess: () => { setMedDeleting(null); invMed(); toast({ title: "تم الحذف" }); } })} disabled={delMed.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Add/Edit */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{catEditing ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <F label="اسم الفئة *"><Input value={catName} onChange={(e) => setCatName(e.target.value)} /></F>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الأيقونة</label>
              <div className="flex flex-wrap gap-2">
                {CAT_ICONS.map((ic) => (
                  <button key={ic} onClick={() => setCatIcon(ic)}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${catIcon === ic ? "border-primary bg-primary/10" : "border-transparent hover:border-muted"}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCatOpen(false)}>إلغاء</Button>
            <Button onClick={saveCat} disabled={createCat.isPending || updateCat.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category */}
      <Dialog open={!!catDeleting} onOpenChange={() => setCatDeleting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف الفئة <span className="font-bold text-foreground">{catDeleting?.name}</span>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCatDeleting(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => delCat.mutate({ id: catDeleting!.id }, { onSuccess: () => { setCatDeleting(null); invCat(); toast({ title: "تم الحذف" }); } })} disabled={delCat.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
