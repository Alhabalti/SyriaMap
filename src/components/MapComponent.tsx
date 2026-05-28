import React, { useState, useMemo, useRef } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  MapPin, 
  Layers, 
  CheckCircle,
  Info,
  X,
  Compass,
  Download,
  Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { syriaGovernorates, GovernorateData } from "../data/syriaData";
import syriaGeoJSONData from "../data/syria_governorates.json";
import syriaRepublicLogo from "../assets/images/regenerated_image_1779641320909.svg";

// Helper function to map a GeoJSON feature to our governorate standard keys
function getGovernorateKey(feature: any): string {
  const props = feature.properties || {};
  const values: string[] = [];
  for (const k in props) {
    if (typeof props[k] === 'string') {
      values.push(props[k].toLowerCase());
    }
  }
  
  const searchStr = values.join(" | ");
  
  if (searchStr.includes("rif") || searchStr.includes("ريف")) return "Rif Dimashq";
  if (searchStr.includes("damas") || searchStr.includes("دمشق")) return "Damascus";
  if (searchStr.includes("aleppo") || searchStr.includes("حلب") || searchStr.includes("halab")) return "Aleppo";
  if (searchStr.includes("homs") || searchStr.includes("حمص")) return "Homs";
  if (searchStr.includes("hama") || searchStr.includes("حماة")) return "Hama";
  if (searchStr.includes("latak") || searchStr.includes("lattak") || searchStr.includes("لاذقية")) return "Latakia";
  if (searchStr.includes("tart") || searchStr.includes("طرطوس")) return "Tartus";
  if (searchStr.includes("idlib") || searchStr.includes("إدلب") || searchStr.includes("idleb")) return "Idlib";
  if (searchStr.includes("raqq") || searchStr.includes("رقة")) return "Raqqa";
  if (searchStr.includes("deir") || searchStr.includes("دير") || searchStr.includes("dayr")) return "Deir ez-Zor";
  if (searchStr.includes("hasak") || searchStr.includes("حسكة")) return "Hasakah";
  if (searchStr.includes("dara") || searchStr.includes("درعا")) return "Daraa";
  if (searchStr.includes("suway") || searchStr.includes("sweida") || searchStr.includes("سويداء")) return "Sweida";
  if (searchStr.includes("qunei") || searchStr.includes("قنيطرة") || searchStr.includes("qunay")) return "Quneitra";
  
  return "";
}

interface ProjectedFeature {
  key: string;
  path: string;
  centroid: [number, number]; // [x, y] coordinates for placing names/markers
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface CityLocation {
  name: string;
  coords: [number, number]; // [lng, lat]
  labelOffset?: { x: number; y: number };
}

const rifDimashqCities: CityLocation[] = [
  { name: "دوما", coords: [36.4022, 33.5714], labelOffset: { x: 3, y: -2 } },
  { name: "حرستا", coords: [36.3572, 33.5606], labelOffset: { x: -2, y: -2 } },
  { name: "جرمانا", coords: [36.3456, 33.4925], labelOffset: { x: 3, y: 2 } },
  { name: "صيدنايا", coords: [36.3769, 33.6997], labelOffset: { x: -2, y: -1 } },
  { name: "معلولا", coords: [36.5458, 33.8447], labelOffset: { x: 3, y: -1 } },
  { name: "التل", coords: [36.3267, 33.6106], labelOffset: { x: -3, y: 0 } },
  { name: "يبرود", coords: [36.6575, 33.9686], labelOffset: { x: 0, y: -2 } },
  { name: "الزبداني", coords: [36.0950, 33.7256], labelOffset: { x: -3, y: 0 } },
  { name: "قدسيا", coords: [36.2167, 33.5358], labelOffset: { x: -3, y: -1 } },
  { name: "السيدة زينب", coords: [36.3400, 33.4442], labelOffset: { x: 0, y: 3 } },
  { name: "ببيلا", coords: [36.3275, 33.4681], labelOffset: { x: -3, y: 2 } },
  { name: "القطيفة", coords: [36.5989, 33.7389], labelOffset: { x: 3, y: -1 } },
  { name: "النبك", coords: [36.7289, 34.0253], labelOffset: { x: 0, y: -2 } },
  { name: "داريا", coords: [36.2344, 33.4564], labelOffset: { x: -3, y: 3 } },
];

export default function MapComponent() {
  // State variables Page View, Loading, Error, etc.
  const [geoJSON] = useState<any>(syriaGeoJSONData);

  // Map viewport & pan states
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedGovId, setSelectedGovId] = useState<string | null>(null);
  const [hoveredGovId, setHoveredGovId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "statistics" | "cities">("details");

  // SVG Size references
  const svgWidth = 720;
  const svgHeight = 540;
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Compute scale and projection based on the GeoJSON bounding box
  const { projectedFeatures, projectCoords } = useMemo<{projectedFeatures: ProjectedFeature[], projectCoords: (lng: number, lat: number) => [number, number]}>(() => {
    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) return { projectedFeatures: [], projectCoords: () => [0,0] };

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let hasCoords = false;

    // Traverse bounding box coordinates
    const traverseCoords = (coords: any) => {
      if (Array.isArray(coords) && typeof coords[0] === 'number') {
        const x = coords[0];
        const y = coords[1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        hasCoords = true;
      } else if (Array.isArray(coords)) {
        coords.forEach(traverseCoords);
      }
    };

    geoJSON.features.forEach((feature: any) => {
      traverseCoords(feature.geometry?.coordinates);
    });

    if (!hasCoords) return { projectedFeatures: [], projectCoords: () => [0,0] };

    // Calculate dimensions
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    // Preserve aspect ratio inside the SVG canvas
    const marginRatio = 0.90; // Uses 90% of available space
    const scale = Math.min((svgWidth * marginRatio) / rangeX, (svgHeight * marginRatio) / rangeY);
    
    const offsetX = (svgWidth - rangeX * scale) / 2;
    const offsetY = (svgHeight - rangeY * scale) / 2;

    const project = (lng: number, lat: number): [number, number] => {
      const x = offsetX + (lng - minX) * scale;
      // Flip the coordinates vertically
      const y = svgHeight - (offsetY + (lat - minY) * scale);
      return [x, y];
    };

    const processPolygon = (polygon: any[]): string => {
      return polygon.map((ring: any[]) => {
        const points = ring.map((pt: any) => {
          const [px, py] = project(pt[0], pt[1]);
          return `${px.toFixed(1)},${py.toFixed(1)}`;
        });
        return `M ${points.join(' L ')} Z`;
      }).join(' ');
    };

    const list: ProjectedFeature[] = [];

    // Pre-calculate Damascus projected centroid to anchor Rif Dimashq label perfectly next to it
    let damasCx = 0;
    let damasCy = 0;
    let damasCount = 0;

    geoJSON.features.forEach((feature: any) => {
      const key = getGovernorateKey(feature);
      if (key === "Damascus" && feature.geometry) {
        const findC = (coords: any) => {
          if (Array.isArray(coords) && typeof coords[0] === 'number') {
            const [px, py] = project(coords[0], coords[1]);
            damasCx += px;
            damasCy += py;
            damasCount++;
          } else if (Array.isArray(coords)) {
            coords.forEach(findC);
          }
        };
        findC(feature.geometry.coordinates);
      }
    });

    const damasCenter: [number, number] | null = damasCount > 0 ? [damasCx / damasCount, damasCy / damasCount] : null;

    geoJSON.features.forEach((feature: any) => {
      const key = getGovernorateKey(feature);
      if (!key) return;

      let dPath = '';
      const geom = feature.geometry;
      if (!geom) return;

      if (geom.type === 'Polygon') {
        dPath = processPolygon(geom.coordinates);
      } else if (geom.type === 'MultiPolygon') {
        dPath = geom.coordinates.map((poly: any) => processPolygon(poly)).join(' ');
      }

      // Calculate centroid and boundaries specifically for placing text
      let centroidX = 0;
      let centroidY = 0;
      let count = 0;

      const calcCentroid = (coords: any) => {
        if (Array.isArray(coords) && typeof coords[0] === 'number') {
          const [px, py] = project(coords[0], coords[1]);
          centroidX += px;
          centroidY += py;
          count++;
        } else if (Array.isArray(coords)) {
          coords.forEach(calcCentroid);
        }
      };
      calcCentroid(feature.geometry.coordinates);

      const cx = count > 0 ? centroidX / count : svgWidth / 2;
      const cy = count > 0 ? centroidY / count : svgHeight / 2;

      // Manual adjustments for extremely crescent-shaped governorates
      let finalCx = cx;
      let finalCy = cy;

      if (key === "Rif Dimashq" && damasCenter) {
        // Position Rif Dimashq perfectly adjacent (east-northeast) to Damascus City
        finalCx = damasCenter[0] + 54;
        finalCy = damasCenter[1] - 3;
      } else if (key === "Damascus" && damasCenter) {
        finalCx = damasCenter[0];
        finalCy = damasCenter[1] - 2;
      } else if (key === "Homs") {
        finalCx = cx + 55; // Nudge Homs to the east/right toward Palmyra
        finalCy = cy + 15;
      } else if (key === "Daraa") {
        finalCx = cx + 8;
        finalCy = cy + 12; // Shift Daraa down-right to avoid Quneitra
      } else if (key === "Quneitra") {
        finalCx = cx - 22; // Shift Quneitra left/west inside its boundary
        finalCy = cy - 2;
      } else if (key === "Sweida") {
        finalCx = cx + 18;
        finalCy = cy + 4;
      } else if (key === "Aleppo") {
        finalCx = cx - 15; // Nudge left
      }

      list.push({
        key,
        path: dPath,
        centroid: [finalCx, finalCy],
        bounds: { minX, minY, maxX, maxY }
      });
    });

    // Ensure "Rif Dimashq" (underlying large area) is rendered BEFORE "Damascus" (small nested area)
    // This makes Damascus visible and clickable on top, and ensures their names do not overlap.
    const sortedList = [...list].sort((a, b) => {
      if (a.key === "Rif Dimashq") return -1;
      if (b.key === "Rif Dimashq") return 1;
      if (a.key === "Damascus") return 1;
      if (b.key === "Damascus") return -1;
      return 0;
    });

    return { projectedFeatures: sortedList, projectCoords: project };
  }, [geoJSON]);

  // Selected Governorate Data Object helper
  const selectedGovData = useMemo<GovernorateData | undefined>(() => {
    return syriaGovernorates.find(g => g.id === selectedGovId);
  }, [selectedGovId]);

  const handleSelectGov = (id: string) => {
    setSelectedGovId(selectedGovId === id ? null : id);
    
    // Zoom in slightly on the clicked feature
    if (selectedGovId !== id) {
      const proj = projectedFeatures.find(f => f.key === id);
      if (proj) {
        // If Rif Dimashq is selected, use Damascus centroid for a better visual center since cities surround it
        let [cx, cy] = proj.centroid;
        if (id === "Rif Dimashq") {
           const damas = projectedFeatures.find(f => f.key === "Damascus");
           if (damas) { cx = damas.centroid[0]; cy = damas.centroid[1]; }
        }
        const targetZoom = id === "Damascus" ? 4.5 : (id === "Rif Dimashq" ? 4 : 1.8);
        setViewport({
          x: (svgWidth / 2) - cx * targetZoom,
          y: (svgHeight / 2) - cy * targetZoom,
          zoom: targetZoom
        });
      }
    } else {
      // Zoom out to normal view on toggle off
      setViewport({ x: 0, y: 0, zoom: 1 });
    }
    setActiveTab("details");
  };

  // Zooming helpers
  const handleZoomIn = () => {
    setViewport(prev => {
      const nextZoom = Math.min(prev.zoom * 1.4, 5);
      const x = (svgWidth / 2) - ((svgWidth / 2) - prev.x) * (nextZoom / prev.zoom);
      const y = (svgHeight / 2) - ((svgHeight / 2) - prev.y) * (nextZoom / prev.zoom);
      return { x, y, zoom: nextZoom };
    });
  };

  const handleZoomOut = () => {
    setViewport(prev => {
      const nextZoom = Math.max(prev.zoom / 1.4, 1);
      if (nextZoom === 1) return { x: 0, y: 0, zoom: 1 };
      const x = (svgWidth / 2) - ((svgWidth / 2) - prev.x) * (nextZoom / prev.zoom);
      const y = (svgHeight / 2) - ((svgHeight / 2) - prev.y) * (nextZoom / prev.zoom);
      return { x, y, zoom: nextZoom };
    });
  };

  // Drag and pan logic inside SVG
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    setViewport(prev => ({
      ...prev,
      x: dx,
      y: dy
    }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleExportPNG = () => {
    if (!svgRef.current) return;
    
    try {
      // 1. Clone the SVG element so we do not mutate the live map
      const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
      
      // 2. Set explicit width and height on the cloned SVG corresponding to original aspect ratio
      svgClone.setAttribute("width", "720");
      svgClone.setAttribute("height", "540");
      
      // 3. Remove/Hide custom map viewport scaling buttons or temporary dragging cursors in the export if any (the cloned SVG is just paths & text labels)
      
      // 4. Insert a solid background rect at the beginning of the cloned SVG
      // to match the app's elegant creamy background (#EDEBE0)
      const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bgRect.setAttribute("width", "100%");
      bgRect.setAttribute("height", "100%");
      bgRect.setAttribute("fill", "#EDEBE0");
      svgClone.insertBefore(bgRect, svgClone.firstChild);
      
      // 5. Set universal clean font styles on the cloned SVG so labels render beautifully
      svgClone.setAttribute("style", "font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;");
      
      // 6. Serialize the cloned SVG to XML string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgClone);
      
      // bzip / Blob approach supports Unicode (Arabic chars) perfectly
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const blobURL = window.URL.createObjectURL(svgBlob);
      
      // 7. Create offscreen image to load the SVG
      const image = new Image();
      image.onload = () => {
        // High-res canvas output (2x resolution for printing/sharing: 1440x1080)
        const canvas = document.createElement("canvas");
        canvas.width = 1440;
        canvas.height = 1080;
        const context = canvas.getContext("2d");
        
        if (context) {
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = "high";
          
          // Draw loaded image on the canvas
          context.drawImage(image, 0, 0, 1440, 1080);
          
          try {
            // Convert canvas to base64 PNG data URL
            const pngURL = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.href = pngURL;
            
            // Generate a localized descriptive name for download
            const selectedName = selectedGovId 
              ? `_${syriaGovernorates.find(g => g.id === selectedGovId)?.nameAr || ""}`
              : "";
            downloadLink.download = `خريطة_سوريا_المحافظات${selectedName}.png`;
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          } catch (err) {
            console.error("Error generating or downloading PNG", err);
          }
        }
        
        // Revoke the object URL to release memory
        window.URL.revokeObjectURL(blobURL);
      };
      
      image.onerror = (e) => {
        console.error("Failed to load SVG source for export", e);
        window.URL.revokeObjectURL(blobURL);
      };
      
      image.src = blobURL;
    } catch (error) {
      console.error("Failed to prepare map SVG for export", error);
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 font-sans" dir="rtl">
      
      {/* Sleek Minimal Header */}
      <div className="pb-4 border-b border-[#002623]/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h1 className="flex items-center gap-3">
            <img 
              src={syriaRepublicLogo}
              alt="شعار الجمهورية العربية السورية" 
              className=" w-auto object-contain drop-shadow-md" 
            />
          </h1>
          <p className="text-xs text-[#3d3a3b] mt-2 font-medium">
            تصفح تفاعلي للتقسيم الإداري، الحواضر السكانية، وأهم المعالم الحضارية والجغرافية
          </p>
        </div>
      </div>

      {/* Main Grid: Map & Details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* RIGHT COLUMN: The Interactive Map View (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          
          {/* Map Container */}
          <div 
            style={{ backgroundColor: "#EDEBE0" }}
            className="relative rounded-xl border border-[#002623]/20 overflow-hidden flex flex-col items-center justify-center p-3 min-h-[480px] select-none shadow-sm"
          >
            {/* Legend / Hover indicator */}
            <div className="absolute top-3 right-3 bg-[#edebe0]/90 border border-[#002623]/25 rounded-lg px-3 py-1.5 z-10 shadow-xs flex flex-col gap-0.5 pointer-events-none text-right">
              <span className="text-sm font-black text-[#002623]">
                {hoveredGovId ? syriaGovernorates.find(g => g.id === hoveredGovId)?.nameAr : "سوريا  "}
              </span>
            </div>

            {/* Scale HUD on Map */}
            <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
              <button 
                onClick={handleZoomIn}
                title="تكبير"
                className="p-2 rounded-lg bg-[#FAF9F5] hover:bg-[#edebe0] text-[#002623] border border-[#002623]/20 shadow-xs hover:scale-[1.03] transition-all cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={handleZoomOut}
                title="تصغير"
                className="p-2 rounded-lg bg-[#FAF9F5] hover:bg-[#edebe0] text-[#002623] border border-[#002623]/20 shadow-xs hover:scale-[1.03] transition-all cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            {/* Compass Rose Hud */}
            <div className="absolute top-3 left-3 flex items-center justify-center w-8 h-8 bg-[#FAF9F5]/90 border border-[#002623]/20 rounded-full text-[#002623] pointer-events-none shadow-sm" title="الشمال">
              <Navigation className="w-4 h-4 text-[#b92837] fill-current" style={{ transform: 'rotate(-45deg)' }} />
            </div>

            {/* Export PNG Button Control - bottom left */}
            <div className="absolute bottom-3 left-3 z-10">
              <button 
                onClick={handleExportPNG}
                title="تصدير الخريطة الحالية كصورة عالية الدقة لتبادلها"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF9F5]/95 hover:bg-[#edebe0] text-[#002623] border border-[#002623]/25 shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer text-xs font-bold"
              >
                <Download className="w-4 h-4 text-[#054239]" />
                <span>تحميل الخريطة</span>
              </button>
            </div>

            {/* Real SVG Map Workspace */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-[500px] cursor-grab active:cursor-grabbing transition-shadow"
              style={{ maxHeight: "480px" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* SVG Background Water grid */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#002623" strokeWidth="0.1" opacity="0.12" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Central Map viewport group */}
              <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`} className="transition-transform duration-200 ease-out font-sans">
                
                {/* 1. Draw Paths of Governorates */}
                {[...projectedFeatures].sort((a, b) => {
                  // Invariant: Damascus must always be rendered after Rif Dimashq (so it sits on top)
                  if (a.key === "Rif Dimashq" && b.key === "Damascus") return -1;
                  if (a.key === "Damascus" && b.key === "Rif Dimashq") return 1;

                  // Active selected is drawn later/on top
                  if (selectedGovId === a.key) return 1;
                  if (selectedGovId === b.key) return -1;

                  // Active hovered is drawn just below selected but above others
                  if (hoveredGovId === a.key) return 1;
                  if (hoveredGovId === b.key) return -1;

                  return 0;
                }).map((item) => {
                  const isHovered = hoveredGovId === item.key;
                  const isSelected = selectedGovId === item.key;

                  // Soft beige-sand shades that stand out beautifully from the main `#edebe0` background
                  let fillColor = "#D8D4C2"; // default solid earthy sand
                  if (isSelected) {
                    fillColor = "#002623"; // Deep forest selected state (high contrast, beautiful)
                  } else if (isHovered) {
                    fillColor = "#054239"; // Hover forest green
                  }

                  const [cx, cy] = item.centroid;

                  return (
                    <motion.g
                      key={item.key}
                      style={{
                        transformOrigin: `${cx}px ${cy}px`,
                      }}
                      className="cursor-pointer"
                    >
                      <motion.path
                        d={item.path}
                        fill={fillColor}
                        stroke="#EDEBE0" // creamy border matching page background
                        strokeWidth={isSelected ? 2.5 / viewport.zoom : 1.2 / viewport.zoom}
                        animate={{
                          strokeWidth: isSelected ? 2.5 / viewport.zoom : 1.2 / viewport.zoom,
                        }}
                        transition={{ duration: 0.2 }}
                        onMouseEnter={() => setHoveredGovId(item.key)}
                        onMouseLeave={() => setHoveredGovId(null)}
                        onClick={() => handleSelectGov(item.key)}
                      />
                    </motion.g>
                  );
                })}

                {/* 2. Removed labels as requested */}
                
                {/* 3. Render Cities for Rif Dimashq when selected */}
                {selectedGovId === "Rif Dimashq" && rifDimashqCities.map((city, idx) => {
                  const [px, py] = projectCoords(city.coords[0], city.coords[1]);
                  const offsetX = city.labelOffset?.x || 0;
                  const offsetY = city.labelOffset?.y || -5;
                  return (
                    <g key={`city-${idx}`} transform={`translate(${px}, ${py})`}>
                      <motion.circle 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: idx * 0.05 }}
                        r={viewport.zoom > 1.4 ? "0.8" : "2"}
                        fill="#b92837"
                        stroke="#FAF9F5"
                        strokeWidth="0.4"
                        className="drop-shadow-sm cursor-help"
                      />
                      <motion.text
                        initial={{ opacity: 0, x: offsetX, y: offsetY + 3 }}
                        animate={{ opacity: 1, x: offsetX, y: offsetY }}
                        transition={{ delay: idx * 0.05 + 0.1 }}
                        textAnchor="middle"
                        fill="#002623"
                        fontSize={Math.max(1.8, 5 / viewport.zoom)}
                        fontWeight="800"
                        className="font-sans antialiased select-none pointer-events-none drop-shadow-md"
                        style={{ textShadow: "0px 0px 3px rgba(255,255,255,1), 0px 0px 2px rgba(255,255,255,1)" }}
                      >
                        {city.name}
                      </motion.text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>


        </div>

        {/* LEFT COLUMN: Sidebar Explore panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          
          {/* Details / Interactive Panel View */}
          <div 
            style={{ borderColor: "#002623" }}
            className="flex-1 rounded-xl border border-[#002623]/20 bg-[#FAF9F5]/70 overflow-hidden flex flex-col min-h-[440px]"
          >
            <AnimatePresence mode="wait">
              {!selectedGovId ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex-1 flex flex-col justify-center p-6 select-none bg-[#002623]/5 w-full"
                >
                  <div className="w-full">
                    <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                      {syriaGovernorates.map((gov) => (
                        <button
                          key={gov.id}
                          onClick={() => handleSelectGov(gov.id)}
                          className="py-3 px-3.5 text-xs text-center bg-[#EDEBE0] hover:bg-[#002623] hover:text-[#EDEBE0] rounded-lg border border-[#002623]/10 transition-all text-[#002623] cursor-pointer font-bold duration-200 active:scale-95 shadow-xs"
                        >
                          {gov.nameAr}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                // Selected Governorate Details Panel
                <motion.div
                  key={selectedGovId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex-1 flex flex-col h-full bg-[#FAF9F5] w-full"
                >
                  
                  {/* Header Information Card */}
                  <div className="p-4 bg-[#EDEBE0] border-b border-[#002623]/15 flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[9px] text-[#3d3a3b] font-bold block">صحيفة المحافظة الإدارية</span>
                      <h2 className="text-lg font-black text-[#002623] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#4a151e]" />
                        {selectedGovData?.nameAr}
                        <span className="text-xs text-[#3d3a3b] font-mono font-normal mr-1">({selectedGovData?.nameEn})</span>
                      </h2>
                    </div>
                    <button
                      onClick={() => setSelectedGovId(null)}
                      title="إغلاق التحديد"
                      className="p-1 rounded bg-[#002623]/5 hover:bg-[#4a151e]/10 text-[#4a151e] transition-all border border-[#002623]/10 cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Tabs selection details/statistics/landmarks */}
                  <div className="flex border-b border-[#002623]/10 bg-[#FAF9F5] text-xs">
                    <button
                      onClick={() => setActiveTab("details")}
                      className={`flex-1 py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
                        activeTab === "details" ? "text-[#002623] border-b-2 border-[#002623] bg-[#002623]/5" : "text-[#3d3a3b] hover:bg-[#002623]/5"
                      }`}
                    >
                      الملخص العام
                    </button>
                    <button
                      onClick={() => setActiveTab("cities")}
                      className={`flex-1 py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
                        activeTab === "cities" ? "text-[#002623] border-b-2 border-[#002623] bg-[#002623]/5" : "text-[#3d3a3b] hover:bg-[#002623]/5"
                      }`}
                    >
                      المدن الهامة ({selectedGovData?.cities.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("statistics")}
                      className={`flex-1 py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
                        activeTab === "statistics" ? "text-[#002623] border-b-2 border-[#002623] bg-[#002623]/5" : "text-[#3d3a3b] hover:bg-[#002623]/5"
                      }`}
                    >
                      أرقام وجغرافيا
                    </button>
                  </div>

                  {/* Content View Section based on activeTab */}
                  <div className="p-4 flex-1 overflow-y-auto max-h-[340px] space-y-3.5">
                    
                    {activeTab === "details" && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        {/* Description */}
                        <div className="space-y-1">
                          <span className="text-xs text-[#3d3a3b] font-bold block">نبذة عامة:</span>
                          <p className="text-xs text-[#002623] leading-relaxed font-sans font-medium">
                            {selectedGovData?.description}
                          </p>
                        </div>

                        <hr className="border-[#002623]/10" />

                        {/* Climate */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#002623]/10">
                            <span className="text-[#3d3a3b] block font-bold mb-0.5">الحالة المناخية:</span>
                            <span className="text-[#002623] font-semibold">{selectedGovData?.climate}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-[#FAF9F5] border border-[#002623]/10">
                            <span className="text-[#3d3a3b] block font-bold mb-0.5">النشاط الاقتصادي:</span>
                            <span className="text-[#002623] font-semibold">{selectedGovData?.economy}</span>
                          </div>
                        </div>

                        <hr className="border-[#002623]/10" />

                        {/* Landmarks */}
                        <div className="space-y-1.5">
                          <span className="text-xs text-[#3d3a3b] font-bold flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-[#4a151e]" />
                            أبرز المعالم العريقة والتاريخية:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {selectedGovData?.landmarks.map((landmark, idx) => (
                              <motion.span
                                key={idx}
                                whileTap={{ scale: 1.15 }}
                                className="text-[10px] px-2 py-0.5 rounded border border-[#002623]/20 bg-[#FAF9F5] text-[#002623] flex items-center gap-1 font-bold cursor-pointer select-none"
                              >
                                <CheckCircle className="w-3 h-3 text-[#054239]" />
                                {landmark}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "cities" && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2.5"
                      >
                        <span className="text-xs text-[#3d3a3b] font-bold block">أهم الحواضر، البلدات والمراكز السكنية:</span>
                        
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          {selectedGovData?.cities.map((city, idx) => (
                            <div 
                              key={idx}
                              className="p-2 rounded bg-[#FAF9F5] text-[#002623] font-bold border border-[#002623]/10 flex items-center justify-between"
                            >
                              <span>{city}</span>
                              <span className="font-mono text-[8px] text-[#3d3a3b] bg-[#EDEBE0] px-1.5 py-0.5 rounded border border-[#002623]/10">منطقة</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "statistics" && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className="space-y-2">
                          {/* Area Stat */}
                          <div className="p-2.5 rounded border border-[#002623]/10 bg-[#FAF9F5] flex justify-between items-center text-xs">
                            <span className="text-[#3d3a3b] font-bold">المساحة الجغرافية:</span>
                            <span className="font-mono text-xs font-black text-[#002623]">{selectedGovData?.area}</span>
                          </div>

                          {/* Population Stat */}
                          <div className="p-2.5 rounded border border-[#002623]/10 bg-[#FAF9F5] flex justify-between items-center text-xs">
                            <span className="text-[#3d3a3b] font-bold">التعداد السكاني التقريبي:</span>
                            <span className="text-[#002623] font-black">{selectedGovData?.population}</span>
                          </div>
                        </div>

                        {/* Informative advice */}
                        <div className="p-2.5 rounded bg-[#EDEBE0]/40 border border-[#002623]/10 text-[11px] text-[#3d3a3b] leading-relaxed flex gap-2 font-medium">
                          <Info className="w-4 h-4 text-[#002623] shrink-0 mt-0.5" />
                          <div>
                            القيم والمسوحات الجغرافية تتطابق مع سجلات الموارد الرسمية الصادرة.
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </div>
                  

                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
              

    </div>
  );
}
