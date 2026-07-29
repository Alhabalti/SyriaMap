/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import MapComponent from "./components/MapComponent";
import { Compass, Sparkles, Star, MapPin, Github, Instagram, Globe, Moon, Sun } from "lucide-react";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen arabesque-background py-4 px-2 sm:px-6 flex items-center justify-center font-sans antialiased text-primary">
      {/* Dark Mode Toggle */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-card border border-primary/20 text-primary shadow-sm hover:scale-110 transition-all"
        title="تبديل الوضع الليلي/النهاري"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Frameless clean container for the simplified minimalist dashboard */}
      <div 
        id="app_main_container_frame"
        className="max-w-[1320px] w-full flex flex-col justify-between overflow-hidden min-h-[90vh] md:min-h-[92vh]"
      >
        {/* Dynamic content core (embeds MapComponent) */}
        <main className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col justify-between">
          <MapComponent />
        </main>

        {/* Simplified footer matching user request */}
        <footer 
          id="app_technical_footer"
          className="text-primary/70 pb-6 text-center text-xs font-bold border-t border-primary/15 pt-4 mt-4 flex flex-col items-center gap-3"
        >
          <span>تم التطوير بواسطة عبدالله الحبالتي</span>
          <div className="flex items-center gap-4 text-primary/70">
            <a href="https://github.com/Alhabalti" target="_blank" rel="noreferrer" className="hover:text-primary hover:scale-110 transition-transform">
              <Github className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/abdullah_alhabalti/" target="_blank" rel="noreferrer" className="hover:text-primary hover:scale-110 transition-transform">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://alhabalti.de/" target="_blank" rel="noreferrer" className="hover:text-primary hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
