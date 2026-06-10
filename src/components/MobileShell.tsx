import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, Search, BookOpen, User, Plus } from "lucide-react";

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-extrabold tracking-tighter text-xl">TraX</Link>
        <div className="flex gap-6 text-[10px] font-mono uppercase tracking-widest text-muted">
          <Link to="/" className={pathname === "/" ? "text-foreground" : ""}>Feed</Link>
          <Link to="/diary" className={pathname === "/diary" ? "text-foreground" : ""}>Diary</Link>
          <Link to="/profile" className={pathname === "/profile" ? "text-foreground" : ""}>Profile</Link>
        </div>
      </nav>

      <main className="max-w-md mx-auto p-4 pb-36">{children}</main>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50">
        <div className="bg-foreground text-background p-1 flex justify-around items-center rounded-sm shadow-2xl ring-4 ring-background">
          <BottomItem to="/" active={pathname === "/"} icon={<Home className="size-4" />} />
          <BottomItem to="/search" active={pathname === "/search"} icon={<Search className="size-4" />} />
          <Link
            to="/album/$id"
            params={{ id: "blue-rev" }}
            className="size-12 bg-accent flex items-center justify-center shrink-0 -my-2 rounded-sm shadow-lg shadow-accent/30"
            aria-label="Log album"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </Link>
          <BottomItem to="/diary" active={pathname === "/diary"} icon={<BookOpen className="size-4" />} />
          <BottomItem to="/profile" active={pathname === "/profile"} icon={<User className="size-4" />} />
        </div>
      </div>
    </div>
  );
}

function BottomItem({ to, active, icon }: { to: string; active: boolean; icon: ReactNode }) {
  return (
    <Link to={to} className={`size-10 flex items-center justify-center transition-opacity ${active ? "opacity-100" : "opacity-40"}`}>
      {icon}
    </Link>
  );
}
