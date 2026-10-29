/**
 * Backward-compatible facade over the Agile UI library.
 * Existing feature components can keep importing from `./UI/Components`,
 * while all new work should import from `../../ui`.
 */
export { Button, Card, Badge, Input, Modal } from '../../ui';

export const FauxWindowHeader = ({ title }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '8px 14px',
      background: 'var(--surface-alt)',
      borderBottom: '1px solid var(--border)',
      fontSize: 11,
      color: 'var(--text-secondary)',
      fontWeight: 500,
    }}
  >
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent-red)', opacity: 0.7 }} />
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent-amber)', opacity: 0.7 }} />
      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent-emerald)', opacity: 0.7 }} />
    </div>
    <span style={{ flex: 1, textAlign: 'center', color: 'var(--text-primary)', fontWeight: 600 }}>{title}</span>
  </div>
);
