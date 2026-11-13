import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

export const DigitalMicroscopeLoupe = ({
  imageUrl,
  title = 'Wall Surface Fracture Photogrammetry',
  pxPerMm = 2.5,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loupeActive, setLoupeActive] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, relX: 0, relY: 0, isHovering: false });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerDims, setContainerDims] = useState({ width: 800, height: 340 });

  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerDims({
            width: entry.contentRect.width || 800,
            height: entry.contentRect.height || 340,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = Math.max(0, Math.min(1, x / rect.width));
    const relY = Math.max(0, Math.min(1, y / rect.height));

    if (isPanning) {
      setPanOffset((prev) => ({
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }

    setCursorPos({ x, y, relX, relY, isHovering: true });
  };

  const handleZoom = (factor) => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.min(4, Math.round((prev + factor) * 10) / 10));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const estimatedXMm = (cursorPos.relX * (640 / pxPerMm)).toFixed(1);
  const estimatedYMm = (cursorPos.relY * (480 / pxPerMm)).toFixed(1);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs">
        <span className="font-medium text-foreground">{title}</span>

        <div className="flex items-center gap-2">
          {cursorPos.isHovering && (
            <Badge variant="outline" className="font-mono text-[11px] tabular-nums">
              X: {estimatedXMm}mm · Y: {estimatedYMm}mm
            </Badge>
          )}

          <Button
            variant={loupeActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setLoupeActive(!loupeActive)}
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>Loupe: {loupeActive ? 'ON' : 'OFF'}</span>
          </Button>

          <div className="inline-flex items-center rounded-md border bg-background p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleZoom(-0.5)}
              disabled={zoomLevel <= 1}
              aria-label="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 font-mono text-[11px] tabular-nums">{zoomLevel.toFixed(1)}x</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleZoom(0.5)}
              disabled={zoomLevel >= 4}
              aria-label="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView} aria-label="Reset zoom">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setCursorPos((prev) => ({ ...prev, isHovering: true }))}
        onMouseLeave={() => {
          setCursorPos((prev) => ({ ...prev, isHovering: false }));
          setIsPanning(false);
        }}
        onMouseDown={(e) => {
          if (zoomLevel > 1) {
            setIsPanning(true);
            setDragStart({ x: e.clientX, y: e.clientY });
          }
        }}
        onMouseUp={() => setIsPanning(false)}
        className={cn(
          'relative h-[340px] select-none overflow-hidden bg-muted',
          zoomLevel > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : loupeActive ? 'cursor-crosshair' : 'cursor-default'
        )}
      >
        <div
          className="h-full w-full origin-center"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <img src={imageUrl} alt="Wall Surface Metrology Frame" className="block h-full w-full object-cover" />
        </div>

        {/* Scale Bar */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col items-center gap-1 rounded border bg-background/90 px-2.5 py-1 font-mono text-[10px]">
          <div className="h-0.5 w-[50px] bg-sky-500" />
          <span>20 mm (50 px)</span>
        </div>

        {/* Magnifier Loupe */}
        {loupeActive && cursorPos.isHovering && zoomLevel === 1 && (
          <div
            className="pointer-events-none absolute z-30 h-32 w-32 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-sky-400 bg-black shadow-xl"
            style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
          >
            <div
              className="absolute"
              style={{
                width: `${containerDims.width * 2.6}px`,
                height: `${containerDims.height * 2.6}px`,
                left: `-${cursorPos.relX * (containerDims.width * 2.6) - 64}px`,
                top: `-${cursorPos.relY * (containerDims.height * 2.6) - 64}px`,
              }}
            >
              <img src={imageUrl} alt="Magnified Specimen" className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-y-0 left-1/2 w-px bg-sky-400/70" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-sky-400/70" />
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-sky-500 px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
              2.6X
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
