import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { padMd, subtitle, surface, titleSm } from './tokens';

const tones = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
};

export type BadgeTone = keyof typeof tones;

/** Status pill. Keep every status label in the app on this component. */
export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Placeholder for an empty list or a filtered-away result set. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
          {icon}
        </div>
      )}
      <p className={titleSm}>{title}</p>
      {description && <p className={cn(subtitle, 'mt-1 max-w-sm')}>{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Full-surface loading state, sized to sit where a card would. */
export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className={cn(surface, padMd, 'flex flex-col items-center justify-center gap-3 py-16')}>
      <Loader2 className="animate-spin text-brand-600" size={28} />
      <p className={subtitle}>{label}</p>
    </div>
  );
}

/** Shimmer block for skeleton screens. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-slate-100 rounded-xl', className)} />;
}

/** Inline contextual message (errors, warnings, tips). */
export function Alert({
  tone = 'info',
  icon,
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: 'bg-blue-50/60 border-blue-100 text-blue-800',
    warning: 'bg-amber-50/60 border-amber-100 text-amber-800',
    danger: 'bg-red-50/60 border-red-100 text-red-800',
    success: 'bg-emerald-50/60 border-emerald-100 text-emerald-800',
  }[tone];

  return (
    <div className={cn('flex items-start gap-3 p-3.5 md:p-4 rounded-xl md:rounded-2xl border', styles, className)}>
      {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="min-w-0 text-xs md:text-sm font-medium">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
