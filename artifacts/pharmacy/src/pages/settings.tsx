import { useState, useEffect, useRef } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Building2, Bell, Printer, Users, HardDrive, Edit, Trash2, Plus, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// TODO: connect to API — user management stored in localStorage temporarily
type Role = "admin" | "accountant" | "pharmacist";
type UserRecord = { id: string; fullName: string; username: string; role: Role; active: boolean; permissions: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }> };

const DEFAULT_PERMISSIONS: Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }> = {
  "لوحة التحكم":    { view: true,  add: false, edit: false, delete: false },
  "نقطة البيع":     { view: true,  add: true,  edit: false, delete: false },
  "إدارة الأصناف":  { view: true,  add: true,  edit: true,  delete: true  },
  "المشتريات":       { view: true,  add: true,  edit: false, delete: false },
  "الحسابات":        { view: true,  add: true,  edit: false, delete: false },
  "خزائن البائعين": { view: true,  add: true,  edit: false, delete: false },
  "التقارير":        { view: true,  add: false, edit: false, delete: false },
  "الإعدادات":       { view: false, add: false, edit: false, delete: false },
};

const ROLES: Record<Role, string> = { admin: "مدير", accountant: "محاسب", pharmacist: "صيدلي" };

function getUsers(): UserRecord[] {
  try { return JSON.parse(localStorage.getItem("pharmacy_users") || "[]"); } catch { return []; }
}
function saveUsers(users: UserRecord[]) { localStorage.setItem("pharmacy_users", JSON.stringify(users)); }

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className="text-sm font-medium">{label}</label>{children}</div>;
}

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings();
  const update = useUpdateSettings();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [pharmacyName, setPharmacyName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [expiryWarningDays, setExpiryWarningDays] = useState("30");
  const [printerName, setPrinterName] = useState("");
  const [paperSize, setPaperSize] = useState("80mm");
  const [autoPrint, setAutoPrint] = useState(false);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [userOpen, setUserOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState({ fullName: "", username: "", password: "", role: "pharmacist" as Role });
  const [permUser, setPermUser] = useState<UserRecord | null>(null);
  const [editPerms, setEditPerms] = useState<UserRecord["permissions"]>({});
  const [delUser, setDelUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    if (settings) {
      setPharmacyName((settings as any).pharmacyName ?? "");
      setPhone((settings as any).phone ?? "");
      setAddress((settings as any).address ?? "");
      setReceiptFooter((settings as any).receiptFooter ?? "");
      setLowStockThreshold((settings as any).lowStockThreshold?.toString() ?? "10");
      setExpiryWarningDays((settings as any).expiryWarningDays?.toString() ?? "30");
    }
    setLogo(localStorage.getItem("pharmacy_logo"));
    setPrinterName(localStorage.getItem("pharmacy_printer") ?? "");
    setPaperSize(localStorage.getItem("pharmacy_paper") ?? "80mm");
    setAutoPrint(localStorage.getItem("pharmacy_autoprint") === "true");
    setUsers(getUsers());
  }, [settings]);

  const handleSavePharmacy = () => {
    update.mutate({
      data: {
        pharmacyName: pharmacyName || undefined,
        phone: phone || undefined,
        address: address || undefined,
        invoiceFooter: receiptFooter || undefined,
        lowStockThreshold: parseInt(lowStockThreshold) || 10,
        nearExpiryDays: parseInt(expiryWarningDays) || 30,
      }
    }, {
      onSuccess: () => {
        localStorage.setItem("pharmacy_name", pharmacyName);
        toast({ title: "تم حفظ الإعدادات" });
      }
    });
  };

  const handleSavePrint = () => {
    localStorage.setItem("pharmacy_printer", printerName);
    localStorage.setItem("pharmacy_paper", paperSize);
    localStorage.setItem("pharmacy_autoprint", String(autoPrint));
    toast({ title: "تم حفظ إعدادات الطباعة" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogo(dataUrl);
      localStorage.setItem("pharmacy_logo", dataUrl);
      toast({ title: "تم رفع الشعار" });
    };
    reader.readAsDataURL(file);
  };

  // User management
  const openAddUser = () => {
    setEditingUser(null);
    setUserForm({ fullName: "", username: "", password: "", role: "pharmacist" });
    setUserOpen(true);
  };
  const openEditUser = (u: UserRecord) => {
    setEditingUser(u);
    setUserForm({ fullName: u.fullName, username: u.username, password: "", role: u.role });
    setUserOpen(true);
  };
  const saveUser = () => {
    if (!userForm.fullName || !userForm.username) { toast({ title: "الاسم واسم المستخدم مطلوبان", variant: "destructive" }); return; }
    const updated = editingUser
      ? users.map((u) => u.id === editingUser.id ? { ...u, ...userForm } : u)
      : [...users, { id: Date.now().toString(), ...userForm, active: true, permissions: { ...DEFAULT_PERMISSIONS } }];
    saveUsers(updated); setUsers(updated); setUserOpen(false);
    toast({ title: editingUser ? "تم تعديل المستخدم" : "تم إضافة المستخدم" });
  };
  const confirmDelUser = (u: UserRecord) => { setDelUser(u); };
  const doDelUser = () => {
    const updated = users.filter((u) => u.id !== delUser!.id);
    saveUsers(updated); setUsers(updated); setDelUser(null);
    toast({ title: "تم حذف المستخدم" });
  };
  const openPerms = (u: UserRecord) => { setPermUser(u); setEditPerms({ ...u.permissions }); setPermOpen(true); };
  const savePerms = () => {
    const updated = users.map((u) => u.id === permUser!.id ? { ...u, permissions: editPerms } : u);
    saveUsers(updated); setUsers(updated); setPermOpen(false);
    toast({ title: "تم حفظ الصلاحيات" });
  };

  // Backup
  const exportBackup = () => {
    const data = JSON.stringify({ users: getUsers(), logo: localStorage.getItem("pharmacy_logo"), timestamp: new Date().toISOString() });
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `pharmacy_backup_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  const importRef = useRef<HTMLInputElement>(null);
  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.users) { saveUsers(data.users); setUsers(data.users); }
        if (data.logo) { localStorage.setItem("pharmacy_logo", data.logo); setLogo(data.logo); }
        toast({ title: "تم استعادة النسخة الاحتياطية" });
      } catch { toast({ title: "ملف غير صالح", variant: "destructive" }); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إعدادات المنظومة والصيدلية</p>
      </div>

      <Tabs defaultValue="pharmacy">
        <TabsList className="mb-4">
          <TabsTrigger value="pharmacy" className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> بيانات الصيدلية</TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> التنبيهات</TabsTrigger>
          <TabsTrigger value="print" className="flex items-center gap-1.5"><Printer className="h-3.5 w-3.5" /> الطباعة</TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> المستخدمون</TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5" /> النسخ الاحتياطي</TabsTrigger>
        </TabsList>

        {/* PHARMACY INFO */}
        <TabsContent value="pharmacy">
          <Card>
            <CardHeader><CardTitle>بيانات الصيدلية</CardTitle><CardDescription>المعلومات الأساسية التي تظهر في الفواتير</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? <Skeleton className="h-64 w-full" /> : (
                <>
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-xl border-2 border-dashed border-muted flex items-center justify-center overflow-hidden bg-muted/20 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => logoInputRef.current?.click()}>
                      {logo ? <img src={logo} alt="logo" className="h-full w-full object-cover" /> : <Upload className="h-7 w-7 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium">شعار الصيدلية</p>
                      <p className="text-sm text-muted-foreground mb-2">يظهر في الشريط الجانبي وفي الفواتير</p>
                      <Button size="sm" variant="outline" onClick={() => logoInputRef.current?.click()}><Upload className="ml-1.5 h-3.5 w-3.5" /> رفع شعار</Button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <F label="اسم الصيدلية"><Input value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} placeholder="مثال: صيدلية النور" /></F>
                    <F label="رقم الهاتف"><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="text-right" /></F>
                    <F label="العنوان"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></F>
                  </div>
                  <F label="تذييل الفاتورة"><Textarea value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="شكراً لزيارتكم..." rows={2} /></F>
                  <Button onClick={handleSavePharmacy} disabled={update.isPending}><Save className="ml-2 h-4 w-4" />{update.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALERTS */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader><CardTitle>إعدادات التنبيهات</CardTitle><CardDescription>تحديد حدود التنبيه للمخزون وتواريخ الانتهاء</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? <Skeleton className="h-32 w-full" /> : (
                <>
                  <F label="حد المخزون المنخفض (وحدات)"><Input type="number" min="1" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} dir="ltr" className="max-w-xs" /></F>
                  <F label="تنبيه قرب انتهاء الصلاحية (أيام)"><Input type="number" min="1" value={expiryWarningDays} onChange={(e) => setExpiryWarningDays(e.target.value)} dir="ltr" className="max-w-xs" /></F>
                  <Button onClick={handleSavePharmacy} disabled={update.isPending}><Save className="ml-2 h-4 w-4" />{update.isPending ? "جاري الحفظ..." : "حفظ"}</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRINT SETTINGS */}
        <TabsContent value="print">
          <Card>
            <CardHeader><CardTitle>إعدادات الطباعة</CardTitle><CardDescription>إعدادات الطابعة والفواتير</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <F label="اسم الطابعة"><Input value={printerName} onChange={(e) => setPrinterName(e.target.value)} placeholder="مثال: Printer-80" /></F>
              <F label="حجم الورق">
                <Select value={paperSize} onValueChange={setPaperSize}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80mm">80mm (حرارية)</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
                  </SelectContent>
                </Select>
              </F>
              <div className="flex items-center gap-3">
                <Switch checked={autoPrint} onCheckedChange={setAutoPrint} id="autoprint" />
                <label htmlFor="autoprint" className="text-sm font-medium cursor-pointer">طباعة الفاتورة تلقائياً بعد إتمام البيع</label>
              </div>
              <Button onClick={handleSavePrint}><Save className="ml-2 h-4 w-4" /> حفظ إعدادات الطباعة</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS */}
        <TabsContent value="users">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-lg">إدارة المستخدمين والصلاحيات</h2>
                <p className="text-sm text-muted-foreground">تُخزَّن محلياً مؤقتاً // TODO: connect to API</p>
              </div>
              <Button onClick={openAddUser}><Plus className="ml-2 h-4 w-4" /> إضافة مستخدم</Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">اسم المستخدم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {!users.length ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا يوجد مستخدمون مضافون</TableCell></TableRow>
                    ) : users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-muted/40">
                        <TableCell className="font-medium">{u.fullName}</TableCell>
                        <TableCell className="font-mono text-sm">{u.username}</TableCell>
                        <TableCell><Badge variant="secondary">{ROLES[u.role] ?? u.role}</Badge></TableCell>
                        <TableCell><Badge variant={u.active ? "default" : "outline"}>{u.active ? "نشط" : "موقوف"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => openPerms(u)}>الصلاحيات</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditUser(u)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelUser(u)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BACKUP */}
        <TabsContent value="backup">
          <Card>
            <CardHeader><CardTitle>النسخ الاحتياطي</CardTitle><CardDescription>تصدير واستعادة بيانات الإعدادات المحلية</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                <Card className="flex-1 border-dashed">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <Download className="h-10 w-10 text-primary opacity-70" />
                    <div>
                      <p className="font-semibold">تصدير نسخة احتياطية</p>
                      <p className="text-sm text-muted-foreground mt-0.5">تنزيل ملف JSON يحتوي على الإعدادات والمستخدمين</p>
                    </div>
                    <Button onClick={exportBackup}><Download className="ml-2 h-4 w-4" /> تصدير</Button>
                  </CardContent>
                </Card>
                <Card className="flex-1 border-dashed">
                  <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                    <Upload className="h-10 w-10 text-orange-500 opacity-70" />
                    <div>
                      <p className="font-semibold">استعادة من نسخة احتياطية</p>
                      <p className="text-sm text-muted-foreground mt-0.5">رفع ملف JSON لاستعادة الإعدادات السابقة</p>
                    </div>
                    <Button variant="outline" onClick={() => importRef.current?.click()}><Upload className="ml-2 h-4 w-4" /> استعادة</Button>
                    <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importBackup} />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Add/Edit */}
      <Dialog open={userOpen} onOpenChange={setUserOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editingUser ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <F label="الاسم الكامل *"><Input value={userForm.fullName} onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })} /></F>
            <F label="اسم المستخدم *"><Input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} dir="ltr" className="text-right" /></F>
            <F label={editingUser ? "كلمة المرور الجديدة (اتركها فارغة لعدم التغيير)" : "كلمة المرور *"}>
              <Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} dir="ltr" />
            </F>
            <F label="الدور">
              <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="accountant">محاسب</SelectItem>
                  <SelectItem value="pharmacist">صيدلي</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserOpen(false)}>إلغاء</Button>
            <Button onClick={saveUser}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>صلاحيات — {permUser?.fullName}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-right">الصفحة</TableHead>
              <TableHead className="text-center">عرض</TableHead>
              <TableHead className="text-center">إضافة</TableHead>
              <TableHead className="text-center">تعديل</TableHead>
              <TableHead className="text-center">حذف</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {Object.entries(editPerms).map(([page, perms]) => (
                <TableRow key={page}>
                  <TableCell className="font-medium">{page}</TableCell>
                  {(["view", "add", "edit", "delete"] as const).map((perm) => (
                    <TableCell key={perm} className="text-center">
                      <Switch
                        checked={perms[perm]}
                        onCheckedChange={(v) => setEditPerms((prev) => ({ ...prev, [page]: { ...prev[page], [perm]: v } }))}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPermOpen(false)}>إلغاء</Button>
            <Button onClick={savePerms}><Save className="ml-2 h-4 w-4" /> حفظ الصلاحيات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user confirm */}
      <Dialog open={!!delUser} onOpenChange={() => setDelUser(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">هل تريد حذف المستخدم <span className="font-bold text-foreground">{delUser?.fullName}</span>؟</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDelUser(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={doDelUser}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
