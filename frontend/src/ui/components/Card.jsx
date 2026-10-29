import React from 'react';
import { cx } from '../utils/cx';

export function Card({
  children,
  title = null,
  subtitle = null,
  tag = null,
  actions = null,
  variant = 'default',
  padding = 'md',
  interactive = false,
  className = '',
  style,
  as: Tag = 'section',
  ...props
}) {
  const hasHeader = Boolean(title || subtitle || tag || actions);

  return (
    <Tag
      className={cx(
        'ui-card',
        variant !== 'default' && `ui-card--${variant}`,
        `ui-card--pad-${padding}`,
        interactive && 'ui-card--interactive',
        className
      )}
      style={style}
      {...props}
    >
      {hasHeader && (
        <header className="ui-card__header">
          <div className="ui-card__heading">
            {title && <div className="ui-card__title">{title}</div>}
            {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
          </div>
          {(tag || actions) && (
            <div className="ui-card__actions">
              {tag}
              {actions}
            </div>
          )}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
    </Tag>
  );
}

export function CardHeader({ title, subtitle, actions, tag, children, className = '' }) {
  return (
    <header className={cx('ui-card__header', className)}>
      <div className="ui-card__heading">
        {title && <div className="ui-card__title">{title}</div>}
        {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
        {children}
      </div>
      {(tag || actions) && (
        <div className="ui-card__actions">
          {tag}
          {actions}
        </div>
      )}
    </header>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={cx('ui-card__body', className)}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <footer className={cx('ui-card__footer', className)}>{children}</footer>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
