import { ReactNode } from "react";
import { NavBar } from "./nav-bar";
import { useAuth } from "@/lib/auth";

export function Layout({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  const { user } = useAuth();
  
  return (
    <div className="min-h-[100dvh] bg-muted/20 flex justify-center">
      <div className="w-full max-w-[420px] bg-background shadow-2xl relative flex flex-col min-h-[100dvh]">
        <main className={`flex-1 overflow-y-auto flex flex-col ${showNav && user ? 'pb-20' : ''}`}>
          {children}
        </main>
        {showNav && user && <NavBar />}
      </div>
    </div>
  );
}
