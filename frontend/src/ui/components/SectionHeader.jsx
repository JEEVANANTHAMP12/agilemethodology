import React from 'react';
import { cx } from '../utils/cx';

export function SectionHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={cx('ui-section-header', className)}>
      <div>
        {eyebrow && <div className="ui-section-header__eyebrow">{eyebrow}</div>}
        {title && <div className="ui-section-header__title">{title}</div>}
        {description && <p className="ui-section-header__description">{description}</p>}
      </div>
      {actions && <div className="ui-section-header__actions">{actions}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={cx('ui-page-header', className)}>
      <div>
        {eyebrow && <div className="ui-page-header__eyebrow">{eyebrow}</div>}
        {title && <h1 className="ui-page-header__title">{title}</h1>}
        {description && <p className="ui-page-header__description">{description}</p>}
      </div>
      {actions && <div className="ui-page-header__actions">{actions}</div>}
    </div>
  );
}
