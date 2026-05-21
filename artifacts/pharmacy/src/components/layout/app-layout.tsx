import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/20">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1400px]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}