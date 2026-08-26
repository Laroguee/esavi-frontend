import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 
  | 'ESAVI_LOCAL' | 'INMUNO_LOCAL' | 'EPIDEMIO_LOCAL' 
  | 'INMUNO_INSTITUCIONAL' | 'EPIDEMIO_INSTITUCIONAL' | 'ESAVI_INSTITUCIONAL' 
  | 'SECRETARIADO' | 'COMITE_EXTERNO' | 'ERR';

export interface MockUser {
  id?: number;
  dui?: string;
  email: string;
  password?: string;
  role: Role;
  name: string;
  institucionMacro: string;
  establecimiento: string;
  activo?: boolean;
}


interface AuthState {
  isAuthenticated: boolean;
  currentRole: Role | null;
  userEmail: string | null;
  userName: string | null;
  userEstablecimiento: string | null;
  logisticaCompletada: boolean;
  casoAprobadoParaComite: boolean;
  
  setSession: (user: MockUser) => void;
  setRole: (role: Role) => void;
  logout: () => void;
  setLogisticaCompletada: (estado: boolean) => void;
  setCasoAprobadoParaComite: (estado: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentRole: null,
      userEmail: null,
      userName: null,
      userEstablecimiento: null,
      logisticaCompletada: false,
      casoAprobadoParaComite: false,

      setSession: (user: MockUser) => set({
        isAuthenticated: true,
        currentRole: user.role,
        userEmail: user.email,
        userName: user.name,
        userEstablecimiento: user.establecimiento
      }),

      setRole: (role: Role) => set({ currentRole: role }),

      logout: () => set({ 
        isAuthenticated: false, 
        currentRole: null, 
        userEmail: null, 
        userName: null,
        userEstablecimiento: null,
        logisticaCompletada: false,
        casoAprobadoParaComite: false
      }),
      
      setLogisticaCompletada: (estado) => set({ logisticaCompletada: estado }),
      setCasoAprobadoParaComite: (estado) => set({ casoAprobadoParaComite: estado }),
    }),
    {
      name: 'esavi-auth-storage',
    }
  )
);