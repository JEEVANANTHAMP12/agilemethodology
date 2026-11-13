import React from 'react';
import { Bot, RefreshCw, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '../lib/utils';

export const Navbar = ({
  roverStatus = 'CONNECTED',
  tabs = [],
  activeTab = '',
  onTabChange = () => {},
  onSync = null,
  isSyncing = false,
  theme = 'dark',
  onToggleTheme = () => {},
}) => {
  const isConnected = roverStatus === 'CONNECTED';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <a href="#/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border bg-muted">
              <Bot className="h-4 w-4" />
            </span>
            <span>Agile Rover</span>
          </a>
          <Badge variant={isConnected ? 'success' : 'destructive'} className="hidden sm:inline-flex">
            {isConnected ? 'Online' : roverStatus}
          </Badge>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Primary workspaces">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="ml-0.5 rounded-full bg-destructive px-1.5 py-0.2 text-[10px] font-semibold text-destructive-foreground">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>

          {onSync && (
            <Button variant="outline" size="sm" onClick={onSync} loading={isSyncing}>
              {!isSyncing && <RefreshCw className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Sync</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
