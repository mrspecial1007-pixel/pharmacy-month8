import { useState } from "react";
import {
  useGetCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  getGetCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ICONS = ["💊", "💉", "🩺", "🩹", "🧪", "🌿", "❤️", "🦷", "👁️", "🧴"];

export default function Categories() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💊");
  const [deleting, setDeleting] = useState<{ id: number; name: string } | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: categories, isLoading } = useGetCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const del = useDeleteCategory();
  const invalidate = () => qc.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });

  const openAdd = () => { setName(""); setIcon("💊"); setEditing(null); setOpen(true); };
  const openEdit = (c: NonNullable<typeof categories>[number]) => {
    setName(c.name); setIcon(c.icon ?? "💊"); setEditing(c.id); setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) { toast({ title: "الاسم مطلوب", variant: "destructive" }); return; }
    if (editing) {
      update.mutate({ id: editing, data: { name, icon } }, { onSuccess: () => { setOpen(false); invalidate(); toast({ title: "تم تحديث الفئة" }); } });
    } else {
      create.mutate({ data: { name, icon } }, { onSuccess: () => { setOpen(false); invalidate(); toast({ title: "تم إضافة الفئة" }); } });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الفئات</h1>
          <p className="text-muted-foreground mt-1">إدارة فئات وتصنيفات الأدوية</p>
        </div>
        <Button onClick={openAdd}><Plus className="ml-2 h-4 w-4" /> إضافة فئة</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)
        ) : !categories?.length ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>لا توجد فئات حالياً</p>
          </div>
        ) : (
          categories.map((cat) => (
            <Card key={cat.id} className="hover:border-primary/50 transition-colors group relative overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                <div className="text-4xl mb-1">{cat.icon ?? "💊"}</div>
                <h3 className="font-semibold text-lg">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.medicineCount} دواء</p>
                <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleting({ id: cat.id, name: cat.name })}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "تعديل الفئة" : "إضافة فئة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">اسم الفئة *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: مضادات حيوية" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الأيقونة</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`text-2xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${icon === ic ? "border-primary bg-primary/10" : "border-transparent hover:border-muted"}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف الفئة <span className="font-bold text-foreground">{deleting?.name}</span>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => del.mutate({ id: deleting!.id }, { onSuccess: () => { setDeleting(null); invalidate(); toast({ title: "تم حذف الفئة" }); } })} disabled={del.isPending}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
