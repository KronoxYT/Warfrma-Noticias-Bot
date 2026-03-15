import { Link, useLocation } from "wouter";
import { Activity, Globe, Crosshair, Zap, Cpu, Menu, X } from "lucide-react";
import { useBotStatus } from "@/hooks/use-status";
import { clsx } from "clsx";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: status } = useBotStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/news", label: "News", icon: Globe },
    { href: "/prices", label: "Prices", icon: Zap },
    { href: "/builds", label: "Builds", icon: Crosshair },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-2 bg-background border border-border rounded-xl">
                <Cpu className="w-8 h-8 text-primary" />
              </div>
              <span className={clsx(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-card",
                status?.online ? "bg-[#3ecf8e] shadow-[0_0_10px_#3ecf8e]" : "bg-destructive shadow-[0_0_10px_red]"
              )} />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-widest neon-text hidden sm:block leading-none">
                WARFRMA <span className="text-foreground">NOTICIAS</span>
              </h1>
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase hidden sm:block mt-1">
                Orbiter Command Terminal
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold tracking-wider uppercase transition-all duration-300 relative",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(201,162,39,0.1)]"
                      : "text-muted-foreground border border-transparent hover:text-foreground hover:bg-white/5 hover:border-border"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-panel border-x-0 rounded-none overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "px-4 py-4 rounded-xl flex items-center gap-3 text-base font-bold tracking-wider uppercase transition-all duration-300",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {children}
      </main>
    </div>
  );
}
