import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { Badge } from './UI/Components';
import { DesignTokens } from '../tokens';
import { WhatIfComparisonChart } from '../ui';

export const WhatIfScenarioSimulator = ({
  currentShi = 76.0,
  baseRul = 14.5,
  onScenarioChange: _onScenarioChange
}) => {
  const [stressFactor, setStressFactor] = useState(1.0); // 0.7x to 1.8x
  const [applyEpoxy, setApplyEpoxy] = useState(false);
  const [applySilaneSealer, setApplySilaneSealer] = useState(false);

  // Calculate adjusted RUL based on scenario inputs
  let bonusYears = 0;

  if (applyEpoxy) {
    bonusYears += 5.5;
  }
  if (applySilaneSealer) {
    bonusYears += 3.0;
  }

  const simulatedRul = Math.max(0.5, Math.round(((baseRul * (1 / stressFactor)) + bonusYears) * 10) / 10);
  const rulDelta = (simulatedRul - baseRul).toFixed(1);

  // Financial impact calculation
  const preventativeCost = (applyEpoxy ? 3200 : 0) + (applySilaneSealer ? 1600 : 800);
  const deferredCost = Math.round(35000 + (100 - currentShi) * 450);
  const potentialSavings = Math.max(0, deferredCost - preventativeCost);

  return (
    <div
      style={{
        background: 'var(--surface-alt)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        marginTop: '20px',
        boxShadow: 'var(--shadow-subtle)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sliders size={16} />
          </span>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Prognostic Scenario Simulator &amp; Remediation Analysis
            </h4>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Simulate dynamic mechanical loading, environmental stressors, and intervention protocols
            </div>
          </div>
        </div>

        <Badge variant={Number(rulDelta) >= 0 ? 'success' : 'danger'}>
          {Number(rulDelta) >= 0 ? `+${rulDelta} Years Life Extension` : `${rulDelta} Years Life Reduction`}
        </Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Left Column: Input Sliders & Intervention Checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Stress Factor Slider */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Traffic &amp; Environmental Stress Multiplier:</span>
              <strong style={{ color: stressFactor > 1.0 ? '#f59e0b' : '#2dd4bf', fontFamily: DesignTokens.typography.mono }}>
                {stressFactor}x ({stressFactor < 1 ? 'Reduced' : stressFactor === 1 ? 'Nominal' : 'Elevated'} Load)
              </strong>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.8"
              step="0.1"
              value={stressFactor}
              onChange={(e) => setStressFactor(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>0.7x (Sheltered)</span>
              <span>1.0x (Baseline)</span>
              <span>1.8x (Heavy Cyclic Shocks)</span>
            </div>
          </div>

          {/* Intervention Protocol Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: applyEpoxy ? 'rgba(45, 212, 191, 0.12)' : 'var(--surface)',
                border: `1px solid ${applyEpoxy ? 'var(--accent-primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={applyEpoxy}
                onChange={(e) => setApplyEpoxy(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Structural Epoxy Micro-Injection
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Restores internal shear continuity &middot; Adds ~5.5 years RUL
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: applySilaneSealer ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface)',
                border: `1px solid ${applySilaneSealer ? 'var(--accent-secondary)' : 'var(--border)'}`,
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                type="checkbox"
                checked={applySilaneSealer}
                onChange={(e) => setApplySilaneSealer(e.target.checked)}
                style={{ accentColor: 'var(--accent-secondary)', width: '16px', height: '16px' }}
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

        {/* Middle Column: Modern Recharts WhatIfComparisonChart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Degradation Curve Shift
            </span>
            <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
              <span style={{ color: '#f59e0b' }}>-- Baseline</span>
              <span style={{ color: '#2dd4bf' }}>— Remediated</span>
            </div>
          </div>
          <WhatIfComparisonChart
            currentShi={currentShi}
            baseRul={baseRul}
            simulatedRul={simulatedRul}
            height={160}
          />
        </div>

        {/* Right Column: Simulated Outcomes & Financial ROI */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
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
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: simulatedRul >= baseRul ? '#10b981' : '#ef4444',
                  marginTop: '2px'
                }}
              >
                {simulatedRul.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 400 }}>Yrs</span>
              </div>
            </div>
          </div>

          {/* Capital Savings Calculator */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Preventative Action Cost:</span>
              <strong style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--text-primary)' }}>
                ${preventativeCost.toLocaleString()}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Deferred Major Shoring Cost:</span>
              <strong style={{ fontFamily: DesignTokens.typography.mono, color: '#ef4444' }}>
                ${deferredCost.toLocaleString()}
              </strong>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                marginTop: '4px'
              }}
            >
              <span style={{ fontWeight: 600, color: '#34d399' }}>Net Projected Savings:</span>
              <strong style={{ fontFamily: DesignTokens.typography.mono, color: '#34d399' }}>
                ${potentialSavings.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
