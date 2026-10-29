import React from 'react';
import { cx } from '../utils/cx';

export function Tabs({ items = [], value, onChange, className = '', ariaLabel = 'Tabs' }) {
  return (
    <div className={cx('ui-tabs', className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cx('ui-tabs__tab', active && 'is-active')}
            onClick={() => onChange?.(item.id)}
          >
            {item.icon}
            {item.label && <span>{item.label}</span>}
            {item.badge ? <span className="ui-tabs__badge">{item.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl({ items = [], value, onChange, label, className = '', ariaLabel }) {
  return (
    <div className={cx('ui-segmented', className)} role="group" aria-label={ariaLabel || label}>
      {label && <span className="ui-segmented__label">{label}</span>}
      {items.map((item) => (
        <button
          key={item.id ?? item.value}
          type="button"
          aria-pressed={value === (item.id ?? item.value)}
          className={cx('ui-segmented__item', value === (item.id ?? item.value) && 'is-active')}
          onClick={() => onChange?.(item.id ?? item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
