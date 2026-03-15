import { motion } from "framer-motion";
import { ExternalLink, Calendar, Radio } from "lucide-react";
import { useNews } from "@/hooks/use-news";
import { format } from "date-fns";

export default function News() {
  const { data: news, isLoading, isError } = useNews();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-3">
          <Radio className="w-8 h-8 text-secondary" />
          Communications Hub
        </h1>
        <p className="text-muted-foreground text-lg">Intercepted dispatches and updates from Digital Extremes.</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-secondary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-secondary border-t-transparent animate-spin" />
          </div>
        </div>
      )}

      {isError && (
        <div className="p-6 glass-panel border-destructive/50 text-destructive rounded-xl text-center">
          <p className="font-bold text-lg">TRANSMISSION FAILED</p>
          <p className="text-sm mt-1">Unable to establish connection with the news feed.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news?.map((article, i) => (
          <motion.a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            key={article.link + i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group glass-panel rounded-2xl overflow-hidden neon-border-hover flex flex-col border-border/80"
          >
            <div className="aspect-video w-full bg-card/80 relative overflow-hidden">
              {article.imageLink ? (
                <img
                  src={article.imageLink}
                  alt={article.message}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-muted/30">
                  <Globe className="w-16 h-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-90" />
              
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 text-secondary text-xs font-bold uppercase tracking-widest bg-background/80 backdrop-blur-md w-max px-3 py-1.5 rounded-lg border border-secondary/30">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(article.date), "MMM dd, yyyy")}
                </div>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-foreground leading-snug mb-6 group-hover:text-primary transition-colors">
                {article.message || "Encrypted Warframe Update"}
              </h3>
              
              <div className="mt-auto flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                Read Dispatch <ExternalLink className="w-4 h-4" />
              </div>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
