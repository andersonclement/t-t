import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { focusRing, subtitle, titleMd } from './tokens';

const widths = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  xl: 'md:max-w-4xl',
};

/**
 * Dialog used across the app. On mobile it presents as a bottom sheet that can
 * never exceed the viewport; from `md` up it becomes a centred panel.
 *
 * Closes on Escape and on backdrop click, restores focus to the previously
 * focused element, and locks background scroll while open.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  size = 'md',
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  size?: keyof typeof widths;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className={cn(
              'relative w-full bg-white shadow-2xl flex flex-col',
              'rounded-t-[2rem] md:rounded-[2.5rem]',
              'max-h-[92dvh] md:max-h-[85dvh]',
              widths[size]
            )}
          >
            {/* Grab handle, mobile sheet affordance only. */}
            <div aria-hidden="true" className="md:hidden mx-auto mt-3 h-1 w-10 rounded-full bg-slate-200" />

            <div className="flex items-start justify-between gap-4 p-5 md:p-7 pb-3 md:pb-4">
              <div className="flex items-start gap-3 min-w-0">
                {icon && (
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 id={titleId} className={titleMd}>
                    {title}
                  </h2>
                  {description && <p className={cn(subtitle, 'mt-0.5')}>{description}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className={cn(
                  'w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 transition-colors hover:text-slate-900 hover:bg-slate-100',
                  focusRing
                )}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-7 py-2">{children}</div>

            {footer && (
              <div className="p-5 md:p-7 pt-3 md:pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
