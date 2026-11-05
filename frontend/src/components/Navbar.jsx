import React from 'react';
import {
  Bot,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { Badge, Button, Tooltip } from '../ui';

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
    <header className="ui-nav">
      <div className="ui-nav__inner">
        <a className="ui-nav__brand" href="#/" aria-label="Agile Rover dashboard">
          <span className="ui-nav__mark">
            <Bot size={17} />
          </span>
          <span className="ui-nav__brand-text">
            <span className="ui-nav__brand-title">Agile Rover</span>
            <span className="ui-nav__brand-sub">Structural Intelligence</span>
          </span>
          <span className={`ui-nav__live ${isConnected ? '' : 'is-offline'}`} title={`Rover status: ${roverStatus}`}>
            <span className="ui-live-dot" />
            {isConnected ? 'Online' : roverStatus}
          </span>
        </a>

        <nav className="ui-nav__links" aria-label="Dashboard workspaces">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ui-nav__link ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge ? <span className="ui-nav__badge">{tab.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="ui-nav__actions">
          <Tooltip label={theme === 'dark' ? 'Light theme' : 'Dark theme'} position="bottom">
            <button
              type="button"
              className="ui-icon-btn"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </Tooltip>

          {onSync && (
            <Button
              variant="outline"
              size="sm"
              loading={isSyncing}
              icon={<RefreshCw size={13} />}
              onClick={onSync}
            >
              Sync
            </Button>
          )}

          {!isConnected && (
            <Badge variant="danger" size="sm" dot>
              {roverStatus}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
};
