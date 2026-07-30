import React from 'react';
import { Building2, Leaf, Pill, ShieldCheck, User } from 'lucide-react';
import type { Role } from '../lib/roles';

/**
 * Icons live here rather than in the role registry because that file is plain
 * TypeScript and carries no JSX.
 */
export function RoleIcon({ role, size = 18 }: { role: Role; size?: number }) {
  switch (role) {
    case 'pharmacist':
      return <Pill size={size} />;
    case 'clinic':
      return <Building2 size={size} />;
    case 'naturopath':
      return <Leaf size={size} />;
    case 'admin':
      return <ShieldCheck size={size} />;
    default:
      return <User size={size} />;
  }
}
