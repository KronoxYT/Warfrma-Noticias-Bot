import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingDown, User, Shield, Package, Zap } from "lucide-react";
import { usePrice } from "@/hooks/use-prices";
import { clsx } from "clsx";

export default function Prices() {
  const [search, setSearch] = useState("");
  const [queryItem, setQueryItem] = useState("");
  const { data: priceData, isLoading, isError, error } = usePrice(queryItem);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) setQueryItem(search.trim());
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-3">
          <TrendingDown className="w-8 h-8 text-primary" />
          Market Terminal
        </h1>
        <p className="text-muted-foreground text-lg">Query the trading network for optimal acquisition costs.</p>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="w-6 h-6 text-primary group-focus-within:text-white transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Designate item (e.g. Ash Prime Set)..."
            className="w-full bg-card/60 backdrop-blur-md border border-border focus:border-primary focus:ring-1 focus:ring-primary/50 rounded-2xl py-5 pl-14 pr-36 text-lg text-foreground placeholder:text-muted-foreground transition-all outline-none shadow-lg"
          />
          <button
            type="submit"
            disabled={isLoading || !search.trim()}
            className="absolute right-3 top-3 bottom-3 bg-primary hover:bg-primary/80 text-primary-foreground font-display font-bold tracking-widest uppercase px-6 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-[0_0_15px_rgba(201,162,39,0.3)] hover:shadow-[0_0_20px_rgba(201,162,39,0.5)] active:scale-95"
          >
            Query
          </button>
        </form>
        
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Target Shortcuts:</span>
          {["Laetum", "Ash Prime Set", "Kuva Bramma"].map(q => (
            <button
              key={q}
              onClick={() => { setSearch(q); setQueryItem(q); }}
              className="px-3 py-1.5 rounded-md bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 text-xs font-bold tracking-wider uppercase transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-4 text-primary py-12"
          >
            <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <span className="font-display font-bold tracking-[0.2em] text-lg uppercase">Scanning Network...</span>
          </motion.div>
        )}

        {isError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="p-6 glass-panel border-destructive/40 bg-destructive/5 text-destructive rounded-2xl max-w-3xl"
          >
            <h3 className="font-display font-bold tracking-widest text-lg flex items-center gap-2 mb-2 uppercase">
              <AlertTriangle className="w-5 h-5" /> Query Failed
            </h3>
            <p className="text-destructive/80 font-medium">{error?.message || "Item not found in the trading network."}</p>
          </motion.div>
        )}

        {priceData && !isLoading && (
          <motion.div
            key={priceData.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Cheapest Card */}
            <div className="glass-panel neon-border rounded-3xl p-8 lg:col-span-1 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <Zap className="w-32 h-32 text-primary" />
              </div>
              
              <div className="relative z-10">
                <div className="text-xs font-bold tracking-widest text-primary uppercase mb-2">
                  Optimal Acquisition
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-8 leading-tight">
                  {priceData.item}
                </h2>

                <div className="flex flex-col items-start mb-8">
                  <span className="text-6xl sm:text-7xl font-display font-bold text-primary drop-shadow-[0_0_20px_rgba(201,162,39,0.5)]">
                    {priceData.cheapest.platinum}
                  </span>
                  <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase mt-2">
                    Platinum
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-background/50 border border-border">
                    <span className="text-muted-foreground text-sm font-bold uppercase flex items-center gap-2"><User className="w-4 h-4"/> Seller</span>
                    <span className="font-bold text-white">{priceData.cheapest.seller}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-background/50 border border-border">
                    <span className="text-muted-foreground text-sm font-bold uppercase flex items-center gap-2"><Shield className="w-4 h-4"/> Reputation</span>
                    <span className="font-bold text-secondary">{priceData.cheapest.reputation}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-background/50 border border-border">
                    <span className="text-muted-foreground text-sm font-bold uppercase flex items-center gap-2"><Package className="w-4 h-4"/> Available</span>
                    <span className="font-bold text-white">{priceData.cheapest.quantity}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Sellers Table */}
            <div className="glass-panel rounded-3xl lg:col-span-2 overflow-hidden flex flex-col border border-border/50">
              <div className="p-6 sm:p-8 border-b border-border flex justify-between items-center bg-card/40">
                <div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-wide text-white">Top Online Sellers</h3>
                  <p className="text-sm text-muted-foreground mt-1">Sorted by lowest platinum price</p>
                </div>
                <div className="hidden sm:block px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold tracking-widest uppercase">
                  {priceData.totalSellers} Online
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-background/80 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-8 py-5 font-bold">Seller</th>
                      <th className="px-8 py-5 font-bold">Price</th>
                      <th className="px-8 py-5 font-bold">Qty</th>
                      <th className="px-8 py-5 font-bold">Rep</th>
                      <th className="px-8 py-5 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 bg-card/20">
                    {priceData.topSellers.map((seller, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5 font-bold text-white">{seller.seller}</td>
                        <td className="px-8 py-5 font-display font-bold text-primary text-xl">
                          {seller.platinum}<span className="text-sm text-muted-foreground ml-1">p</span>
                        </td>
                        <td className="px-8 py-5 text-muted-foreground font-medium">{seller.quantity}</td>
                        <td className="px-8 py-5 text-secondary font-bold">{seller.reputation}</td>
                        <td className="px-8 py-5 text-right">
                          <span className={clsx(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border",
                            seller.status === "ingame" 
                              ? "bg-[#3ecf8e]/10 text-[#3ecf8e] border-[#3ecf8e]/20" 
                              : "bg-secondary/10 text-secondary border-secondary/20"
                          )}>
                            <span className={clsx("w-2 h-2 rounded-full", seller.status === "ingame" ? "bg-[#3ecf8e] shadow-[0_0_8px_#3ecf8e]" : "bg-secondary shadow-[0_0_8px_#4a8fd4]")} />
                            {seller.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Ensure the icon is imported for the error state
import { AlertTriangle } from "lucide-react";
