import React from 'react';
import { Activity, Bot, Cpu, Crosshair, ChevronRight } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ScalaStreamPanel } from '../components/ScalaStreamPanel';
import { useTheme } from '../context/themeContextDef';

const NAV_TABS = [
  { id: 'live', label: 'Live', icon: <Bot className="h-3.5 w-3.5" /> },
  { id: 'inspection', label: 'Inspection', icon: <Crosshair className="h-3.5 w-3.5" /> },
  { id: 'health_reports', label: 'Health & Reports', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'scala_stream', label: 'Scala Stream', icon: <Cpu className="h-3.5 w-3.5" /> },
];

export const ScalaStreamPage = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar
        roverStatus="CONNECTED"
        tabs={NAV_TABS}
        activeTab="scala_stream"
        onTabChange={(tabId) => {
          if (tabId === 'live') window.location.hash = '#/live';
          else if (tabId === 'inspection') window.location.hash = '#/inspection';
          else if (tabId === 'health_reports') window.location.hash = '#/health';
          else if (tabId === 'scala_stream') window.location.hash = '#/scala';
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <a href="#/" className="hover:text-foreground">Dashboard</a>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">Scala Stream Engine (Port 8090)</span>
          </div>
          <a href="#/" className="text-foreground underline-offset-4 hover:underline">
            Back to Inspection Overview
          </a>
        </div>

        <ScalaStreamPanel />
      </main>

      <footer className="border-t py-4 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
          <span>Agile Rover · Structural Health &amp; Telemetry</span>
          <span>Scala 3 / Apache Pekko Streams</span>
        </div>
      </footer>
    </div>
  );
};
