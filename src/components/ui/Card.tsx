import React from 'react';
import { cn } from '../../lib/utils';
import { padMd, padSm, surface, surfaceSm } from './tokens';

/**
 * Primary content surface. `size="sm"` gives the tighter radius and padding
 * used for tiles nested inside a larger card.
 */
export function Card({
  children,
  size = 'md',
  padded = true,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: 'sm' | 'md';
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        size === 'sm' ? surfaceSm : surface,
        padded && (size === 'sm' ? padSm : padMd),
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** `Card` rendered as a `<section>`, with the standard inner rhythm. */
export function CardSection({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn(surface, padMd, 'space-y-4 md:space-y-6', className)} {...rest}>
      {children}
    </section>
  );
}

/**
 * Compact metric tile. Used in the KPI row at the top of the data screens.
 * `tone` picks the icon chip colour; keep values on the shared palette.
 */
export function StatCard({
  label,
  value,
  unit,
  icon,
  tone = 'bg-emerald-50',
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  tone?: string;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(surfaceSm, padSm, 'flex flex-col gap-3', className)}>
      {icon && (
        <div
          className={cn(
            'w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0',
            tone
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
          {label}
        </p>
        <div className="flex items-baseline gap-1 mt-0.5 min-w-0">
          <span className="text-xl md:text-2xl font-display font-black text-slate-900 truncate">
            {value}
          </span>
          {unit && <span className="text-[9px] md:text-[10px] font-bold text-slate-400 shrink-0">{unit}</span>}
        </div>
        {hint && <p className="text-[9px] md:text-[10px] text-slate-400 font-medium mt-1">{hint}</p>}
      </div>
    </div>
  );
}

/**
 * Responsive KPI row. Two columns on mobile so tiles stay legible, expanding
 * to `columns` from the medium breakpoint up.
 */
export function StatGrid({
  columns = 4,
  children,
  className,
}: {
  columns?: 2 | 3 | 4 | 5;
  children: React.ReactNode;
  className?: string;
}) {
  const md = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
  }[columns];

  return (
    <div className={cn('grid grid-cols-2 gap-3 md:gap-4', md, className)}>{children}</div>
  );
}
