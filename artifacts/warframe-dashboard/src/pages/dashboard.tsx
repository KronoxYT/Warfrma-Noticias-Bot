import { motion } from "framer-motion";
import { Users, Server, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { useBotStatus } from "@/hooks/use-status";

export default function Dashboard() {
  const { data: status, isLoading, isError } = useBotStatus();

  const stats = [
    { 
      label: "Network Status", 
      value: status?.online ? "ONLINE" : "OFFLINE", 
      sub: status?.name || "Establishing connection...", 
      icon: status?.online ? ShieldCheck : AlertTriangle, 
      color: status?.online ? "text-[#3ecf8e]" : "text-destructive" 
    },
    { 
      label: "System Uptime", 
      value: status?.uptimeFormatted || "—", 
      sub: "Since last initialization", 
      icon: Clock, 
      color: "text-secondary" 
    },
    { 
      label: "Linked Relays", 
      value: status?.guildCount ?? "—", 
      sub: "Active Discord servers", 
      icon: Server, 
      color: "text-primary" 
    },
    { 
      label: "Tenno Reached", 
      value: status?.userCount ?? "—", 
      sub: "Across all active relays", 
      icon: Users, 
      color: "text-purple-400" 
    },
  ];

  return (
    <div className="space-y-8 flex-1">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 lg:p-16 neon-border"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Space background" 
            className="w-full h-full object-cover opacity-40 mix-blend-screen" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Live Telemetry Active
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 leading-tight">
            SYSTEM <span className="text-primary">OVERVIEW</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground font-sans max-w-lg leading-relaxed">
            Monitor the real-time operational status, network distribution, and integration metrics of the Warfrma Noticias network.
          </p>
        </div>
      </motion.section>

      {isError && (
        <div className="p-6 glass-panel border-destructive/50 text-destructive rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-6 h-6" />
          <span className="font-semibold tracking-wide">Failed to retrieve telemetry data from the core system.</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 rounded-2xl bg-card/50 border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-2xl p-6 neon-border-hover relative overflow-hidden group flex flex-col justify-between min-h-[160px]"
              >
                <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 group-hover:rotate-12 group-hover:scale-110">
                  <Icon className={`w-32 h-32 ${stat.color}`} />
                </div>
                
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                    {stat.label}
                  </span>
                  <Icon className={`w-5 h-5 ${stat.color} opacity-80`} />
                </div>
                
                <div className="relative z-10">
                  <div className={`text-3xl sm:text-4xl font-display font-bold ${stat.color} mb-1 drop-shadow-md`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-semibold">
                    {stat.sub}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
