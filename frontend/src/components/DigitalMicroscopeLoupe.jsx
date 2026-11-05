import React, { useState, useRef, useEffect } from 'react';
import {
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconCrosshair
} from './UI/Icons';
import { DesignTokens } from '../tokens';

export const DigitalMicroscopeLoupe = ({
  imageUrl,
  title = "Wall Surface Fracture Photogrammetry",
  pxPerMm = 2.5,
  defects: _defects = [],
  highlightedDefectId: _highlightedDefectId = null,
  onDefectClick: _onDefectClick = null
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loupeActive, setLoupeActive] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, relX: 0, relY: 0, isHovering: false });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerDims, setContainerDims] = useState({ width: 800, height: 400 });

  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setContainerDims({
            width: entry.contentRect.width || 800,
            height: entry.contentRect.height || 400
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
      setPanOffset(prev => ({
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y)
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }

    setCursorPos({ x, y, relX, relY, isHovering: true });
  };

  const handleMouseEnter = () => {
    setCursorPos(prev => ({ ...prev, isHovering: true }));
  };

  const handleMouseLeave = () => {
    setCursorPos(prev => ({ ...prev, isHovering: false }));
    setIsPanning(false);
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleZoom = (factor) => {
    setZoomLevel(prev => {
      const next = Math.max(1, Math.min(4, Math.round((prev + factor) * 10) / 10));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Convert normalized coordinate to real-world millimeters
  const estimatedXMm = (cursorPos.relX * (640 / pxPerMm)).toFixed(1);
  const estimatedYMm = (cursorPos.relY * (480 / pxPerMm)).toFixed(1);

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '10px',
      overflow: 'hidden',
      background: 'var(--surface)',
      position: 'relative',
      boxShadow: 'var(--shadow-subtle)'
    }}>
      {/* Top Engineering Micro-HUD Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        background: 'var(--surface-alt)',
        borderBottom: '1px solid var(--border)',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulseBeacon 2s infinite' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        </div>

        {/* Zoom & Loupe Controls Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Spatial Coordinates Readout */}
          {cursorPos.isHovering && (
            <div style={{
              fontFamily: DesignTokens.typography.mono,
              fontSize: '11px',
              color: 'var(--accent-cyan)',
              background: 'var(--surface)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)'
            }}>
              X: {estimatedXMm}mm &middot; Y: {estimatedYMm}mm
            </div>
          )}

          {/* Loupe Toggle */}
          <button
            type="button"
            onClick={() => setLoupeActive(!loupeActive)}
            title="Toggle 2.5x Optical Loupe"
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              background: loupeActive ? 'var(--pastel-blue-bg)' : 'var(--surface)',
              color: loupeActive ? 'var(--pastel-blue-text)' : 'var(--text-secondary)',
              border: `1px solid ${loupeActive ? 'var(--pastel-blue-border)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <IconCrosshair size={13} />
            <span>Loupe: {loupeActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Zoom Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--surface)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => handleZoom(-0.5)}
              disabled={zoomLevel <= 1}
              style={{ padding: '4px', color: zoomLevel <= 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: zoomLevel <= 1 ? 'default' : 'pointer' }}
            >
              <IconZoomOut size={14} />
            </button>
            <span style={{ fontSize: '11px', fontFamily: DesignTokens.typography.mono, padding: '0 6px', color: 'var(--text-primary)' }}>
              {zoomLevel.toFixed(1)}x
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.5)}
              disabled={zoomLevel >= 4}
              style={{ padding: '4px', color: zoomLevel >= 4 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: zoomLevel >= 4 ? 'default' : 'pointer' }}
            >
              <IconZoomIn size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={resetView}
            title="Reset Zoom & Pan"
            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <IconMaximize size={13} />
          </button>
        </div>
      </div>

      {/* Main Image Viewport with Pan & Loupe */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
          position: 'relative',
          height: '340px',
          overflow: 'hidden',
          cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : (loupeActive ? 'crosshair' : 'default'),
          userSelect: 'none',
          backgroundColor: 'var(--canvas-elevated)'
        }}
      >
        {/* The Base Wall Image with Zoom and Pan */}
        <div style={{
          width: '100%',
          height: '100%',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.15s ease-out'
        }}>
          <img
            src={imageUrl}
            alt="Wall Surface Metrology Frame"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>

        {/* Optical Scanning Line HUD */}
        <div className="scan-laser-line" />
        <div className="scan-hud-grid" />

        {/* Optical Corner HUD brackets */}
        <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderLeft: '2px solid var(--accent-cyan)', borderTop: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderRight: '2px solid var(--accent-cyan)', borderTop: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderLeft: '2px solid var(--accent-cyan)', borderBottom: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderRight: '2px solid var(--accent-cyan)', borderBottom: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />

        {/* Millimeter Scale Bar in Bottom Right */}
        <div style={{
          position: 'absolute',
          bottom: 14,
          right: 14,
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '4px',
          padding: '4px 10px',
          color: '#F8FAFC',
          fontSize: '10px',
          fontFamily: DesignTokens.typography.mono,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          gap: '2px'
        }}>
          <div style={{ width: '50px', height: '3px', background: 'var(--accent-cyan)', borderRadius: '1px' }} />
          <span>20 mm (50 px)</span>
        </div>

        {/* Floating Digital Microscope Magnifying Loupe */}
        {loupeActive && cursorPos.isHovering && zoomLevel === 1 && (
          <div style={{
            position: 'absolute',
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            width: '130px',
            height: '130px',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '2px solid var(--accent-cyan)',
            boxShadow: '0 0 0 3px rgba(6, 182, 212, 0.3), 0 10px 25px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 30,
            background: '#000000'
          }}>
            {/* Magnified Image Projection */}
            <div style={{
              width: `${containerDims.width * 2.6}px`,
              height: `${containerDims.height * 2.6}px`,
              position: 'absolute',
              left: `-${cursorPos.relX * (containerDims.width * 2.6) - 65}px`,
              top: `-${cursorPos.relY * (containerDims.height * 2.6) - 65}px`,
            }}>
              <img
                src={imageUrl}
                alt="Magnified Specimen"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Precision Microscopic Crosshairs */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(6, 182, 212, 0.7)' }} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: 'rgba(6, 182, 212, 0.7)' }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '16px',
              height: '16px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px dashed var(--accent-cyan)'
            }} />

            {/* Loupe Zoom Tag */}
            <div style={{
              position: 'absolute',
              bottom: '6px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(6, 182, 212, 0.9)',
              color: 'var(--canvas-elevated)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '8px',
              fontWeight: 800,
              fontFamily: DesignTokens.typography.mono
            }}>
              2.6X MAG
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
