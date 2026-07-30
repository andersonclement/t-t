import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { focusRing } from './tokens';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  /** Renders the count in alert colours (e.g. stock ruptures). */
  alert?: boolean;
  /** Accent reserved for AI-powered tabs. */
  accent?: 'brand' | 'indigo';
}

/**
 * The app's single tab control, in two visual variants:
 *
 * - `underline` for many tabs (inventory, directory)
 * - `segmented` for two or three peers (orders)
 *
 * Both scroll horizontally on narrow screens instead of wrapping or
 * overflowing, and both expose proper `tablist`/`tab` semantics.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  variant = 'underline',
  className,
  'aria-label': ariaLabel = 'Sections',
}: {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  variant?: 'underline' | 'segmented';
  className?: string;
  'aria-label'?: string;
}) {
  const layoutId = React.useId();

  if (variant === 'segmented') {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          'flex items-center gap-1 p-1 bg-slate-100 rounded-xl md:rounded-2xl overflow-x-auto no-scrollbar',
          className
        )}
      >
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative flex-1 flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-colors',
                focusRing,
                active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${layoutId}-segment`}
                  className="absolute inset-0 bg-white rounded-lg md:rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && <TabCount count={tab.count} active={active} alert={tab.alert} />}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-5 md:gap-7 border-b border-slate-100 overflow-x-auto no-scrollbar',
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        const indigo = tab.accent === 'indigo';
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative py-3.5 flex items-center gap-2 text-xs md:text-sm whitespace-nowrap transition-colors shrink-0',
              focusRing,
              active
                ? indigo
                  ? 'text-indigo-700 font-black'
                  : 'text-brand-600 font-black'
                : 'text-slate-400 font-bold hover:text-slate-800'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && <TabCount count={tab.count} active={active} alert={tab.alert} />}
            {active && (
              <motion.span
                layoutId={`${layoutId}-underline`}
                className={cn(
                  'absolute left-0 right-0 -bottom-px h-0.5 rounded-full',
                  indigo ? 'bg-indigo-600' : 'bg-brand-600'
                )}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function TabCount({ count, active, alert }: { count: number; active: boolean; alert?: boolean }) {
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded-md text-[9px] font-black border',
        active
          ? alert
            ? 'bg-rose-500 text-white border-rose-500'
            : 'bg-brand-50 text-brand-600 border-brand-100'
          : alert
            ? 'bg-rose-50 text-rose-500 border-rose-100'
            : 'bg-slate-50 text-slate-400 border-slate-100'
      )}
    >
      {count}
    </span>
  );
}
