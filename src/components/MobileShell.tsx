import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Compass, Plus, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export function MobileShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, loading } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  if (loading || !session) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 bg-background border-b border-border px-5 py-3 flex items-center justify-between">
        <Link to="/" aria-label="TraX home" className="flex items-center"><Logo className="h-12 w-auto" /></Link>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Track your music journey</span>
      </nav>

      <main className="max-w-md mx-auto pb-32">{children}</main>

      {!hideNav && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-sm z-50">
          <div className="bg-foreground text-background px-3 py-2 flex justify-between items-center rounded-full shadow-2xl ring-4 ring-background/80">
            <NavItem to="/" active={isActive("/") && !isActive("/profile") && !isActive("/add")} label="Explore">
              <Compass className="size-5" strokeWidth={2.2} />
            </NavItem>
            <Link
              to="/add"
              className="size-14 -my-4 bg-accent flex items-center justify-center shrink-0 rounded-full shadow-lg shadow-accent/40 ring-4 ring-background/80"
              aria-label="Add music"
            >
              <Plus className="size-7" strokeWidth={2.5} />
            </Link>
            <NavItem to="/profile" active={isActive("/profile")} label="Profile">
              <User className="size-5" strokeWidth={2.2} />
            </NavItem>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ to, active, label, children }: { to: string; active: boolean; label: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-0.5 px-6 py-2 transition-opacity ${active ? "opacity-100" : "opacity-40"}`}
    >
      {children}
      <span className="text-[9px] font-mono uppercase tracking-widest">{label}</span>
    </Link>
  );
}
