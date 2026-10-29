import React from 'react';
import { cx } from '../utils/cx';

export function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={cx('ui-empty', className)}>
      {icon && <span className="ui-empty__icon">{icon}</span>}
      {title && <div className="ui-empty__title">{title}</div>}
      {description && <p className="ui-empty__description">{description}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  );
}
