import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 
  | 'ESAVI_LOCAL' | 'INMUNO_LOCAL' | 'EPIDEMIO_LOCAL' 
  | 'INMUNO_INSTITUCIONAL' | 'EPIDEMIO_INSTITUCIONAL' | 'ESAVI_INSTITUCIONAL' 
  | 'SECRETARIADO' | 'COMITE_EXTERNO' | 'ERR';

const MOCK_USERS = [
  { email: 'medico.ss@minsal.gob.sv', password: 'Clinico2026', role: 'ESAVI_LOCAL' as Role, name: 'Médico Clínico' },
  { email: 'inmuno.puesto@minsal.gob.sv', password: 'Inmuno2026', role: 'INMUNO_LOCAL' as Role, name: 'Personal de Enfermería' },
  { email: 'epidemio.local@minsal.gob.sv', password: 'Local2026', role: 'EPIDEMIO_LOCAL' as Role, name: 'Epidemiólogo Local' },
  { email: 'inmuno.institucional@minsal.gob.sv', password: 'InmunoCentral2026', role: 'INMUNO_INSTITUCIONAL' as Role, name: 'Jefatura de Inmunizaciones' },
  { email: 'epidemio.institucional@srs.gob.sv', password: 'Episrs2026', role: 'EPIDEMIO_INSTITUCIONAL' as Role, name: 'Epidemiología Nivel Central' },
  { email: 'referente.esavi@srs.gob.sv', password: 'Referente2026', role: 'ESAVI_INSTITUCIONAL' as Role, name: 'Referente General ESAVI' },
  { email: 'secretario.comite@srs.gob.sv', password: 'Secretario2026', role: 'SECRETARIADO' as Role, name: 'Secretariado Técnico' },
  { email: 'experto.comite@srs.gob.sv', password: 'Experto2026', role: 'COMITE_EXTERNO' as Role, name: 'Comité Independiente' },
];

interface AuthState {
  isAuthenticated: boolean;
  currentRole: Role | null;
  userEmail: string | null;
  userName: string | null;
  logisticaCompletada: boolean;
  casoAprobadoParaComite: boolean; // <-- La variable que faltaba
  
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  setRole: (role: Role) => void;
  setLogisticaCompletada: (estado: boolean) => void;
  setCasoAprobadoParaComite: (estado: boolean) => void; // <-- La función que faltaba
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      currentRole: null,
      userEmail: null,
      userName: null,
      logisticaCompletada: false,
      casoAprobadoParaComite: false,

      login: (email: string, pass: string) => {
        const user = MOCK_USERS.find(u => u.email === email && u.password === pass);
        if (user) {
          set({
            isAuthenticated: true,
            currentRole: user.role,
            userEmail: user.email,
            userName: user.name
          });
          return true;
        }
        return false;
      },

      logout: () => set({ 
        isAuthenticated: false, 
        currentRole: null, 
        userEmail: null, 
        userName: null,
        logisticaCompletada: false,
        casoAprobadoParaComite: false
      }),
      
      setRole: (role: Role) => set({ currentRole: role }), 
      setLogisticaCompletada: (estado) => set({ logisticaCompletada: estado }),
      setCasoAprobadoParaComite: (estado) => set({ casoAprobadoParaComite: estado }),
    }),
    {
      name: 'esavi-auth-storage',
    }
  )
);