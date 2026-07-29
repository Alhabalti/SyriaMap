import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { fetchGovernorateWikiData, WikiData } from "../services/wikipediaApi";

interface CityWikiCardProps {
  cityName: string;
}

export default function CityWikiCard({ cityName }: CityWikiCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [wikiData, setWikiData] = useState<WikiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = async () => {
    if (!isExpanded && !wikiData && !error) {
      setLoading(true);
      try {
        const data = await fetchGovernorateWikiData(cityName, true); // true = isCity
        setWikiData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="col-span-1 rounded bg-card border border-primary/10 overflow-hidden flex flex-col transition-all">
      <button 
        onClick={toggleExpand}
        className="w-full p-2 text-primary font-bold flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors text-right"
      >
        <span>{cityName}</span>
        <span className="font-mono text-[8px] text-text-dim bg-bg px-1.5 py-0.5 rounded border border-primary/10 whitespace-nowrap">
          {isExpanded ? "طي" : "معلومات"}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-primary/10 bg-bg/50"
          >
            <div className="p-3 text-xs space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-4 opacity-70">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1"></div>
                  <span className="text-[9px] font-bold text-primary">جاري البحث...</span>
                </div>
              ) : error ? (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-[10px] text-center font-bold">
                  {error}
                </div>
              ) : wikiData ? (
                <div className="space-y-2">
                  {wikiData.originalImageUrl && (
                    <div className="rounded overflow-hidden border border-primary/15 shadow-sm flex items-center justify-center bg-black/5">
                      <img 
                        src={wikiData.originalImageUrl} 
                        alt={`صورة لـ ${wikiData.title}`} 
                        className="w-full h-auto max-h-24 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <p className="text-[10px] text-primary leading-relaxed font-sans font-medium text-justify">
                    {wikiData.extract}
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
