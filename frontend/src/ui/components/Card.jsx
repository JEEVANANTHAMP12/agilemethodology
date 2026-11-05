import React, { useRef } from 'react';
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
  spotlight = false,
  className = '',
  style,
  as: Tag = 'section',
  onPointerMove,
  onPointerLeave,
  ...props
}) {
  const hasHeader = Boolean(title || subtitle || tag || actions);
  const spotlightRef = useRef(null);

  const handlePointerMove = (event) => {
    if (spotlight && spotlightRef.current) {
      const rect = spotlightRef.current.getBoundingClientRect();
      spotlightRef.current.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
      spotlightRef.current.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    }
    onPointerMove?.(event);
  };

  const handlePointerLeave = (event) => {
    onPointerLeave?.(event);
  };

  return (
    <Tag
      ref={spotlight ? spotlightRef : undefined}
      className={cx(
        'ui-card',
        variant !== 'default' && `ui-card--${variant}`,
        `ui-card--pad-${padding}`,
        interactive && 'ui-card--interactive',
        spotlight && 'ui-card--spotlight',
        className
      )}
      style={style}
      onPointerMove={spotlight ? handlePointerMove : onPointerMove}
      onPointerLeave={spotlight ? handlePointerLeave : onPointerLeave}
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
