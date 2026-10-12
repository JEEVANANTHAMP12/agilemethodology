import React, { useState } from 'react';
import {
  IconRover,
  IconUser,
  IconLogOut,
  IconRefresh,
  IconPrinter
} from './UI/Icons';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({
  roverStatus = 'CONNECTED',
  tabs = [],
  activeTab = '',
  onTabChange = () => {},
  onSync = null,
  onOpenReport = null,
  hasReport = false
}) => {
  const { user, logout } = useAuth();
  const [hoveredTab, setHoveredTab] = useState(null);

  const isConnected = roverStatus === 'CONNECTED';

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          pointerEvents: 'auto',
          filter: 'drop-shadow(0 4px 18px rgba(0, 0, 0, 0.35))',
          maxWidth: '100vw',
        }}
      >
        {/* Left Shoulder S-Curve Wing */}
        <svg
          width="24"
          height="44"
          viewBox="0 0 24 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', flexShrink: 0, marginRight: '-1px' }}
        >
          <path d="M 0,0 C 12,0 12,44 24,44 L 24,0 Z" fill="#000000" />
        </svg>

        {/* Center Black Island Body */}
        <div
          style={{
            background: '#000000',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: '20px',
            fontFamily: '"Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* Brand Logo & Name */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              cursor: 'default',
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {/* Glowing Blue Squircle App Icon */}
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #7ad5f5 0%, #0066ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0, 102, 255, 0.45)',
                color: '#FFFFFF',
              }}
            >
              <IconRover size={15} color="#FFFFFF" />
            </div>

            {/* Brand Title & Status Beacon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '-0.02em',
                }}
              >
                Agile Rover
              </span>
              <span
                title={isConnected ? 'Rover Online' : roverStatus}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isConnected ? '#10B981' : '#F59E0B',
                  boxShadow: isConnected ? '0 0 8px #10B981' : '0 0 8px #F59E0B',
                  display: 'inline-block',
                }}
              />
            </div>
          </div>

          {/* Navigation Links */}
          {tabs.length > 0 && (
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isHovered = hoveredTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    onMouseEnter={() => setHoveredTab(tab.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: '4px 2px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#FFFFFF' : (isHovered ? '#FFFFFF' : '#9E9E9E'),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'color 0.15s ease',
                      whiteSpace: 'nowrap',
                      position: 'relative',
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        style={{
                          background: '#EF4444',
                          color: '#FFFFFF',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '999px',
                          lineHeight: 1.2,
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '12px',
                          height: '2px',
                          borderRadius: '1px',
                          background: '#FFFFFF',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Controls: White Pill Button, User & Sign Out */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0,
            }}
          >
            {/* White Pill Action Button (Matches reference screenshot's Download pill) */}
            {onSync && (
              <button
                onClick={onSync}
                style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  borderRadius: '9999px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F0F0F0';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <IconRefresh size={12} color="#000000" />
                <span>Sync</span>
              </button>
            )}

            {hasReport && onOpenReport && (
              <button
                onClick={onOpenReport}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                <IconPrinter size={12} color="#FFFFFF" />
                <span>Dossier</span>
              </button>
            )}

            {/* User chip */}
            {user && (
              <div
                title={`${user.full_name || user.username} (${user.role})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#E0E0E0',
                  fontSize: '11px',
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                  }}
                >
                  <IconUser size={10} />
                </div>
                <span>{user.username}</span>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9E9E9E',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#9E9E9E';
              }}
            >
              <IconLogOut size={13} />
            </button>
          </div>
        </div>

        {/* Right Shoulder S-Curve Wing */}
        <svg
          width="24"
          height="44"
          viewBox="0 0 24 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', flexShrink: 0, marginLeft: '-1px' }}
        >
          <path d="M 0,0 L 0,44 C 12,44 12,0 24,0 Z" fill="#000000" />
        </svg>
      </div>
    </header>
  );
};
