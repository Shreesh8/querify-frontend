import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    await new Promise<void>((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve();
        if (!user) {
          throw redirect({ to: "/login", search: { redirect: location.href } });
        }
      });
    });
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-14 items-center justify-between border-b border-glass-border bg-background/60 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                AI Business Intelligence
              </span>
            </div>
            <Button size="sm" asChild className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow">
              <Link to="/app/datasets/new">
                <Plus className="mr-1 h-4 w-4" /> New dataset
              </Link>
            </Button>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
