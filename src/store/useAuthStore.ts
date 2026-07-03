import { create } from 'zustand';

// Catálogo oficial de roles según la nueva regla
export type Role = 
  | 'ESAVI_INSTITUCIONAL' | 'EPIDEMIO_INSTITUCIONAL' | 'INMUNO_INSTITUCIONAL'
  | 'ESAVI_LOCAL' | 'EPIDEMIO_LOCAL' | 'INMUNO_LOCAL'
  | 'SECRETARIADO' | 'COMITE_EXTERNO';

interface AuthState {
  currentRole: Role;
  setRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentRole: 'ESAVI_INSTITUCIONAL', 
  setRole: (role) => set({ currentRole: role }),
}));