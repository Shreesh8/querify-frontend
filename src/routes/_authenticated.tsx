import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex h-14 items-center justify-between border-b border-glass-border bg-background/60 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Premium AI Business Intelligence
              </span>
            </div>
            <Button size="sm" asChild className="bg-gradient-to-r from-primary to-accent-violet text-primary-foreground shadow-glow hover:opacity-90">
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