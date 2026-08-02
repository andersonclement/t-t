import React from 'react';
import { cn } from '../../lib/utils';
import { eyebrow, padLg, stack, pageBottom, subtitle, surface, titleLg, titleMd } from './tokens';

/**
 * Root wrapper for a screen. Owns the page's vertical rhythm and the bottom
 * gutter that keeps content clear of the mobile tab bar. The horizontal
 * gutter and max width come from `Shell`, so never re-declare them here.
 */
export function PageContainer({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(stack, pageBottom, className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * The banner at the top of every screen: eyebrow, title, optional subtitle,
 * and a slot on the right for badges or actions. Collapses to a single column
 * on mobile.
 */
export function PageHeader({
  eyebrow: eyebrowText,
  title,
  subtitle: subtitleText,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative overflow-hidden',
        surface,
        padLg,
        className
      )}
    >
      {/* Decorative wash, purely presentational. */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 -z-10"
      />
      <div className="space-y-1 min-w-0">
        {eyebrowText && <p className={eyebrow}>{eyebrowText}</p>}
        <h1 className={titleLg}>{title}</h1>
        {subtitleText && <p className={subtitle}>{subtitleText}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:gap-3 shrink-0">{actions}</div>}
    </header>
  );
}

/**
 * Heading for a section inside a card, with the accent bar used across the app.
 * `action` renders a text link on the trailing edge.
 */
export function SectionHeader({
  title,
  action,
  accent = 'bg-emerald-600',
  className,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 className={cn(titleMd, 'flex items-center gap-2 min-w-0')}>
        <span aria-hidden="true" className={cn('w-1 h-5 rounded-full shrink-0', accent)} />
        <span className="truncate">{title}</span>
      </h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Two-thirds / one-third responsive split used by the dashboard-style screens. */
export function SplitLayout({
  main,
  aside,
  className,
}: {
  main: React.ReactNode;
  aside: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8', className)}>
      <div className={cn('lg:col-span-2', stack)}>{main}</div>
      <div className={stack}>{aside}</div>
    </div>
  );
}
