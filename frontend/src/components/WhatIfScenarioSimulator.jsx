import React, { useState } from 'react';
import { Card, Badge, Button } from './UI/Components';
import {
  IconSliders,
  IconShieldCheck,
  IconClock,
  IconTrendingDown,
  IconCheck
} from './UI/Icons';
import { DesignTokens } from '../tokens';

export const WhatIfScenarioSimulator = ({
  currentShi = 76.0,
  baseRul = 14.5,
  onScenarioChange
}) => {
  const [stressFactor, setStressFactor] = useState(1.0); // 0.7x to 1.8x
  const [applyEpoxy, setApplyEpoxy] = useState(false);
  const [applySilaneSealer, setApplySilaneSealer] = useState(false);

  // Calculate adjusted RUL based on scenario inputs
  let effectiveDegradationRate = 1.8 * stressFactor;
  let bonusYears = 0;

  if (applyEpoxy) {
    bonusYears += 5.5;
    effectiveDegradationRate *= 0.65;
  }
  if (applySilaneSealer) {
    bonusYears += 3.0;
    effectiveDegradationRate *= 0.8;
  }

  const simulatedRul = Math.max(0.5, Math.round(((baseRul * (1 / stressFactor)) + bonusYears) * 10) / 10);
  const rulDelta = (simulatedRul - baseRul).toFixed(1);

  // Financial impact calculation
  const preventativeCost = (applyEpoxy ? 3200 : 0) + (applySilaneSealer ? 1600 : 800);
  const deferredCost = Math.round(35000 + (100 - currentShi) * 450);
  const potentialSavings = Math.max(0, deferredCost - preventativeCost);

  return (
    <div style={{
      background: 'var(--surface-alt)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '20px',
      marginTop: '20px',
      boxShadow: 'var(--shadow-subtle)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'var(--pastel-blue-bg)',
            color: 'var(--pastel-blue-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <IconSliders size={16} />
          </span>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Prognostic "What-If" Degradation &amp; Lifecycle Simulator
            </h4>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Simulate microclimate variations and preventative rehabilitation impacts on structural longevity
            </div>
          </div>
        </div>

        <Badge variant={Number(rulDelta) >= 0 ? 'success' : 'danger'} size="sm">
          {Number(rulDelta) >= 0 ? `+${rulDelta} Yrs Longevity` : `${rulDelta} Yrs Accelerated`}
        </Badge>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* Left: Interactive Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Stress Factor Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Environmental Aggressiveness:
              </span>
              <span style={{ fontSize: '12px', fontFamily: DesignTokens.typography.mono, color: 'var(--accent-cyan)' }}>
                {stressFactor.toFixed(1)}x {stressFactor > 1.1 ? '(High Moisture / Salt)' : stressFactor < 0.9 ? '(Sheltered)' : '(Nominal)'}
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.8"
              step="0.1"
              value={stressFactor}
              onChange={(e) => setStressFactor(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>0.7x (Dry Indoor)</span>
              <span>1.0x (Standard)</span>
              <span>1.8x (Severe Marine/Freeze)</span>
            </div>
          </div>

          {/* Intervention Toggles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Remedial Engineering Interventions:
            </span>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: applyEpoxy ? 'var(--pastel-green-bg)' : 'var(--surface)',
              border: `1px solid ${applyEpoxy ? 'var(--pastel-green-border)' : 'var(--border)'}`,
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.15s ease'
            }}>
              <input
                type="checkbox"
                checked={applyEpoxy}
                onChange={(e) => setApplyEpoxy(e.target.checked)}
                style={{ accentColor: 'var(--accent-emerald)', width: '16px', height: '16px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Low-Viscosity Epoxy Pressure Grouting
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Restores internal shear continuity &middot; Adds ~5.5 years RUL
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: applySilaneSealer ? 'var(--pastel-blue-bg)' : 'var(--surface)',
              border: `1px solid ${applySilaneSealer ? 'var(--pastel-blue-border)' : 'var(--border)'}`,
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.15s ease'
            }}>
              <input
                type="checkbox"
                checked={applySilaneSealer}
                onChange={(e) => setApplySilaneSealer(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Hydrophobic Silane Surface Impregnation
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Halts water and chloride penetration &middot; Adds ~3.0 years RUL
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Right: Simulated Outcomes & Financial ROI */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Simulated Life Prognosis &amp; ROI
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'var(--surface-alt)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Baseline RUL</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {baseRul.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 400 }}>Yrs</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-alt)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Simulated RUL</div>
              <div style={{
                fontSize: '18px',
                fontWeight: 700,
                color: simulatedRul >= baseRul ? 'var(--accent-emerald)' : 'var(--accent-red)',
                marginTop: '2px'
              }}>
                {simulatedRul.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 400 }}>Yrs</span>
              </div>
            </div>
          </div>

          {/* Capital Savings Calculator */}
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Preventative Action Cost:</span>
              <strong style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--text-primary)' }}>
                ${preventativeCost.toLocaleString()}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Deferred Major Shoring Cost:</span>
              <strong style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--accent-red)' }}>
                ${deferredCost.toLocaleString()}
              </strong>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              background: 'var(--pastel-green-bg)',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid var(--pastel-green-border)',
              marginTop: '4px'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--pastel-green-text)' }}>Net Projected Savings:</span>
              <strong style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--pastel-green-text)' }}>
                ${potentialSavings.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
