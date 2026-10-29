import React from 'react';
import {
  IconRover,
  IconRefresh,
  IconSun,
  IconMoon,
  IconVolume,
  IconVolumeX,
  IconPrinter,
  IconGrid,
} from './UI/Icons';
import { Badge, Button, Tooltip } from '../ui';

export const Navbar = ({
  roverStatus = 'CONNECTED',
  tabs = [],
  activeTab = '',
  onTabChange = () => {},
  onSync = null,
  onOpenReport = null,
  hasReport = false,
  theme = 'dark',
  onToggleTheme = () => {},
  soundEnabled = false,
  onToggleSound = () => {},
}) => {
  const isConnected = roverStatus === 'CONNECTED';

  return (
    <header className="ui-nav">
      <div className="ui-nav__inner">
        <a className="ui-nav__brand" href="#/" aria-label="Agile Rover dashboard">
          <span className="ui-nav__mark">
            <IconRover size={17} />
          </span>
          <span className="ui-nav__brand-text">
            <span className="ui-nav__brand-title">Agile Rover</span>
            <span className="ui-nav__brand-sub">Structural Intelligence</span>
          </span>
          <span className={`ui-nav__live ${isConnected ? '' : 'is-offline'}`} title={`Rover status: ${roverStatus}`}>
            <span className="ui-live-dot" />
            {isConnected ? 'Live' : roverStatus}
          </span>
        </a>

        <nav className="ui-nav__links" aria-label="Dashboard modules">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`ui-nav__link ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge ? <span className="ui-nav__badge">{tab.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div className="ui-nav__actions">
          <Tooltip label="Open the UI kit" position="bottom">
            <a className="ui-icon-btn ui-nav__hide-sm" href="#/ui-kit" aria-label="Open UI kit">
              <IconGrid size={14} />
            </a>
          </Tooltip>

          <span className="ui-nav__divider ui-nav__hide-sm" />

          {hasReport && onOpenReport && (
            <Button
              variant="secondary"
              size="sm"
              className="ui-nav__hide-sm"
              icon={<IconPrinter size={13} />}
              onClick={onOpenReport}
            >
              Dossier
            </Button>
          )}

          <Tooltip label={theme === 'dark' ? 'Light theme' : 'Dark theme'} position="bottom">
            <button
              type="button"
              className="ui-icon-btn"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
            </button>
          </Tooltip>

          <Tooltip label={soundEnabled ? 'Mute acoustic feedback' : 'Enable acoustic feedback'} position="bottom">
            <button
              type="button"
              className={`ui-icon-btn ${soundEnabled ? 'is-active' : ''}`}
              onClick={onToggleSound}
              aria-pressed={soundEnabled}
              aria-label="Toggle acoustic feedback"
            >
              {soundEnabled ? <IconVolume size={14} /> : <IconVolumeX size={14} />}
            </button>
          </Tooltip>

          {onSync && (
            <Button variant="primary" size="sm" icon={<IconRefresh size={13} />} onClick={onSync}>
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
