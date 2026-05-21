import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Package,
  Receipt,
  CreditCard,
  ArrowLeftRight,
  Clock,
  ClipboardList,
  TrendingUp,
  ScrollText,
  AlertTriangle,
  BarChart3,
  Tag,
  Truck,
  Users,
  Wallet,
  Settings
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/pos", label: "نقطة البيع", icon: ShoppingCart },
  { href: "/medicines", label: "إدارة الأدوية", icon: Pill },
  { href: "/purchases", label: "المشتريات", icon: Package },
  { href: "/sales-history", label: "سجل المبيعات", icon: Receipt },
  { href: "/accounts", label: "الحسابات", icon: CreditCard },
  { href: "/returns", label: "المرتجعات", icon: ArrowLeftRight },
  { href: "/shifts", label: "وردية الكاشير", icon: Clock },
  { href: "/inventory", label: "الجرد الفعلي", icon: ClipboardList },
  { href: "/stock-movements", label: "حركة المخزون", icon: TrendingUp },
  { href: "/audit-log", label: "سجل العمليات", icon: ScrollText },
  { href: "/expiry-analysis", label: "تحليل الانتهاء", icon: AlertTriangle },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/categories", label: "الفئات", icon: Tag },
  { href: "/suppliers", label: "الموردين", icon: Truck },
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/expenses", label: "المصاريف", icon: Wallet },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar side="right" className="border-l-0 border-r border-sidebar-border" variant="inset">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-4 py-2">
        <div className="flex items-center gap-2 w-full justify-start text-sidebar-primary">
          <Pill className="h-6 w-6" />
          <span className="font-bold text-lg text-sidebar-foreground">منظومة</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={location === item.href}
                className="justify-start gap-3 h-10 px-3 font-medium transition-colors rounded-md"
              >
                <Link href={item.href} className="flex items-center gap-3 w-full">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}