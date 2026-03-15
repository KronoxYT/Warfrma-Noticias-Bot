import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Zap, Crosshair, Wrench, Database } from "lucide-react";
import { useBuilds } from "@/hooks/use-builds";
import { clsx } from "clsx";

export default function Builds() {
  const { data: builds, isLoading, isError } = useBuilds();
  const [filter, setFilter] = useState<"all" | "warframe" | "weapon">("all");
  const [search, setSearch] = useState("");

  const filteredBuilds = builds?.filter(b => {
    const matchesType = filter === "all" || b.type === filter;
    const query = search.toLowerCase();
    const matchesSearch = !query ||
      b.displayName.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query) ||
      b.mods.some(m => m.toLowerCase().includes(query));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-8 flex-1 flex flex-col">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Arsenal Schematics
        </h1>
        <p className="text-muted-foreground text-lg">Optimized combat configurations for maximum lethality.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center glass-panel p-4 rounded-2xl border-border">
        <div className="flex gap-2 p-1.5 bg-background/50 border border-border rounded-xl w-full md:w-auto overflow-x-auto">
          {(["all", "warframe", "weapon"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold tracking-widest uppercase transition-all whitespace-nowrap flex-1 md:flex-none text-center",
                filter === f
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(201,162,39,0.3)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {f === "all" ? "All Loadouts" : f + "s"}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, description, or mod..."
            className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 pl-12 pr-4 text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-80 rounded-3xl bg-card border border-border/50 animate-pulse" />)}
        </div>
      )}

      {isError && (
        <div className="p-6 glass-panel border-destructive/50 text-destructive rounded-2xl text-center font-bold tracking-widest uppercase py-12">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          Failed to access arsenal database.
        </div>
      )}

      {filteredBuilds?.length === 0 && !isLoading && (
        <div className="text-center py-20 text-muted-foreground glass-panel rounded-3xl border border-dashed border-border flex-1 flex flex-col items-center justify-center">
          <Wrench className="w-16 h-16 mb-6 opacity-20" />
          <p className="text-xl font-display uppercase tracking-widest font-bold text-white mb-2">No Schematics Found</p>
          <p className="text-sm">Adjust your filtering parameters to find available loadouts.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredBuilds?.map((build, i) => (
          <motion.div
            key={build.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-panel rounded-3xl overflow-hidden neon-border-hover flex flex-col group relative"
          >
            <div className="p-6 sm:p-8 border-b border-border bg-card/40 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:rotate-45 group-hover:scale-125">
                {build.type === 'warframe' ? <Zap className="w-40 h-40 text-secondary" /> : <Crosshair className="w-40 h-40 text-primary" />}
              </div>
              
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className={clsx(
                    "text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 mb-2",
                    build.type === 'warframe' ? "text-secondary" : "text-primary"
                  )}>
                    {build.type === 'warframe' ? <Zap className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5" />}
                    {build.type}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">{build.displayName}</h3>
                </div>
                <span className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest border",
                  build.difficulty.toLowerCase() === "beginner" ? "bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20" :
                  build.difficulty.toLowerCase() === "advanced" ? "bg-destructive/10 text-destructive border-destructive/20" :
                  "bg-primary/10 text-primary border-primary/20"
                )}>
                  {build.difficulty}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col bg-background/20">
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                {build.description}
              </p>

              <div className="mb-8 flex-1">
                <h4 className="text-xs font-bold tracking-widest text-white uppercase mb-4 flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-muted-foreground" /> Mod Configuration
                </h4>
                <div className="flex flex-wrap gap-2">
                  {build.mods.map(mod => (
                    <span key={mod} className="px-2.5 py-1.5 bg-card border border-border/60 hover:border-border hover:bg-white/5 transition-colors rounded-lg text-xs text-foreground font-semibold">
                      {mod}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-5 border-t border-border/50 text-sm font-bold tracking-wider uppercase">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    Forma: <strong className="text-primary text-base">{build.forma ?? "?"}</strong>
                  </span>
                </div>
                <span className="text-secondary">
                  {build.mods.length} Mods
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
