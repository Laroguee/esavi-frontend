import { create } from 'zustand';

// Definimos los roles posibles según tu documento
export type Role = 'REFERENTE_ESAVI' | 'EQUIPO_COORDINADOR' | 'ERR_CAMPO' | 'SECRETARIADO' | 'COMITE_EXTERNO';

interface AuthState {
  currentRole: Role;
  setRole: (role: Role) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentRole: 'REFERENTE_ESAVI', // El rol por defecto al abrir la app
  setRole: (role) => set({ currentRole: role }),
}));