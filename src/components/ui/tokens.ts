/**
 * Design tokens for the Dokta interface.
 *
 * These class strings are the single source of truth for surface styling.
 * Views should compose them (via `cn`) rather than re-typing raw Tailwind,
 * so that a change here propagates to every screen.
 */

/** Vertical rhythm for a page root and for stacked sections inside a column. */
export const stack = 'space-y-6 md:space-y-8';

/** Bottom breathing room so the mobile tab bar never overlaps the last card. */
export const pageBottom = 'pb-16';

/** Large surfaces: page header, primary sections, panels. */
export const surface =
  'bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm';

/** Nested surfaces: stat cards, list rows, tiles inside a `surface`. */
export const surfaceSm =
  'bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm';

/** Inert rows inside a card (list items, breakdown lines). */
export const surfaceMuted = 'bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl';

/** Padding scales, matched to the surface they sit on. */
export const padLg = 'p-6 md:p-8';
export const padMd = 'p-5 md:p-8';
export const padSm = 'p-4 md:p-5';

/** Typography. */
export const eyebrow = 'text-xs text-slate-400 font-bold uppercase tracking-widest';
export const titleLg = 'text-xl md:text-3xl font-display font-bold text-slate-900';
export const titleMd = 'text-base md:text-xl font-display font-bold text-slate-900';
export const titleSm = 'text-sm md:text-base font-display font-bold text-slate-900';
export const subtitle = 'text-xs md:text-sm text-slate-500 font-medium';

/** Form controls. */
export const inputCls =
  'w-full px-4 py-3 rounded-xl md:rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-600 focus:bg-white focus:ring-2 focus:ring-brand-600/10 disabled:opacity-60 disabled:cursor-not-allowed';

/** Callers own the gap below the label, so this carries no margin. */
export const labelCls =
  'block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest';

/** Focus ring applied to interactive elements for keyboard accessibility. */
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
