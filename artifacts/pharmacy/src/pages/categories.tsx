import { useGetCategories } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Tag } from "lucide-react";

export default function Categories() {
  const { data: categories, isLoading } = useGetCategories();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الفئات</h1>
          <p className="text-muted-foreground mt-1">إدارة فئات وتصنيفات الأدوية</p>
        </div>
        <Button>
          <Plus className="ml-2 h-4 w-4" />
          إضافة فئة
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : categories?.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            لا توجد فئات حالياً
          </div>
        ) : (
          categories?.map((cat) => (
            <Card key={cat.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
                  <Tag className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.medicineCount} دواء</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}