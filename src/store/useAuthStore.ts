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

export const ESTABLECIMIENTOS_MOCK = [
  'Hospital Nacional Rosales',
  'Unidad de Salud Barrios',
  'Hospital Nacional Zacamil',
  'Región Metropolitana',
  'Nivel Central'
];

export const MOCK_USERS: MockUser[] = [
  // Nivel Central
  { id: 1, dui: '00000001-1', email: 'epidemio.institucional@srs.gob.sv', password: 'Episrs2026', role: 'EPIDEMIO_INSTITUCIONAL', name: 'Epidemiología Nivel Central', institucionMacro: 'MINSAL', establecimiento: 'Nivel Central', activo: true },
  { id: 2, dui: '00000002-2', email: 'referente.esavi@srs.gob.sv', password: 'Referente2026', role: 'ESAVI_INSTITUCIONAL', name: 'Referente General ESAVI', institucionMacro: 'MINSAL', establecimiento: 'Nivel Central', activo: true },
  { id: 3, dui: '00000003-3', email: 'secretario.comite@srs.gob.sv', password: 'Secretario2026', role: 'SECRETARIADO', name: 'Secretariado Técnico', institucionMacro: 'MINSAL', establecimiento: 'Nivel Central', activo: true },
  { id: 4, dui: '00000004-4', email: 'experto.comite@srs.gob.sv', password: 'Experto2026', role: 'COMITE_EXTERNO', name: 'Comité Independiente', institucionMacro: 'MINSAL', establecimiento: 'Nivel Central', activo: true },

  // Región Metropolitana
  { id: 5, dui: '00000005-5', email: 'inmuno.institucional@minsal.gob.sv', password: 'InmunoCentral2026', role: 'INMUNO_INSTITUCIONAL', name: 'Jefatura de Inmunizaciones', institucionMacro: 'MINSAL', establecimiento: 'Región Metropolitana', activo: true },
  { id: 6, dui: '00000006-6', email: 'medico.rm@minsal.gob.sv', password: 'Clave2026', role: 'ESAVI_LOCAL', name: 'Dr. Región Metro', institucionMacro: 'MINSAL', establecimiento: 'Región Metropolitana', activo: true },
  { id: 7, dui: '00000007-7', email: 'inmuno.rm@minsal.gob.sv', password: 'Clave2026', role: 'INMUNO_LOCAL', name: 'Enf. Región Metro', institucionMacro: 'MINSAL', establecimiento: 'Región Metropolitana', activo: true },
  { id: 8, dui: '00000008-8', email: 'epidemio.rm@minsal.gob.sv', password: 'Clave2026', role: 'EPIDEMIO_LOCAL', name: 'Epi. Región Metro', institucionMacro: 'MINSAL', establecimiento: 'Región Metropolitana', activo: true },

  // Hospital Nacional Rosales
  { id: 9, dui: '00000009-9', email: 'medico.ss@minsal.gob.sv', password: 'Clinico2026', role: 'ESAVI_LOCAL', name: 'Médico Clínico', institucionMacro: 'MINSAL', establecimiento: 'Hospital Nacional Rosales', activo: true },
  { id: 10, dui: '00000010-0', email: 'inmuno.rosales@minsal.gob.sv', password: 'Clave2026', role: 'INMUNO_LOCAL', name: 'Enf. HNR', institucionMacro: 'MINSAL', establecimiento: 'Hospital Nacional Rosales', activo: true },
  { id: 11, dui: '00000011-1', email: 'epidemio.rosales@minsal.gob.sv', password: 'Clave2026', role: 'EPIDEMIO_LOCAL', name: 'Epi. HNR', institucionMacro: 'MINSAL', establecimiento: 'Hospital Nacional Rosales', activo: true },

  // Unidad de Salud Barrios
  { id: 12, dui: '00000012-2', email: 'medico.barrios@minsal.gob.sv', password: 'Clave2026', role: 'ESAVI_LOCAL', name: 'Dr. Barrios', institucionMacro: 'MINSAL', establecimiento: 'Unidad de Salud Barrios', activo: true },
  { id: 13, dui: '00000013-3', email: 'inmuno.puesto@minsal.gob.sv', password: 'Inmuno2026', role: 'INMUNO_LOCAL', name: 'Personal de Enfermería', institucionMacro: 'MINSAL', establecimiento: 'Unidad de Salud Barrios', activo: true },
  { id: 14, dui: '00000014-4', email: 'epidemio.local@minsal.gob.sv', password: 'Local2026', role: 'EPIDEMIO_LOCAL', name: 'Epidemiólogo Local', institucionMacro: 'MINSAL', establecimiento: 'Unidad de Salud Barrios', activo: true },
  
  // Hospital Nacional Zacamil
  { id: 15, dui: '00000015-5', email: 'medico.zacamil@minsal.gob.sv', password: 'Clinico2026', role: 'ESAVI_LOCAL', name: 'Dr. López', institucionMacro: 'MINSAL', establecimiento: 'Hospital Nacional Zacamil', activo: true },
  { id: 16, dui: '00000016-6', email: 'inmuno.zacamil@minsal.gob.sv', password: 'Inmuno2026', role: 'INMUNO_LOCAL', name: 'Lic. Pérez', institucionMacro: 'MINSAL', establecimiento: 'Hospital Nacional Zacamil', activo: true },
  { id: 17, dui: '00000017-7', email: 'epidemio.zacamil@minsal.gob.sv', password: 'Local2026', role: 'EPIDEMIO_LOCAL', name: 'Dra. Méndez', institucionMacro: 'MINSAL', establecimiento: 'Hospital Nacional Zacamil', activo: true },
];

interface AuthState {
  isAuthenticated: boolean;
  currentRole: Role | null;
  userEmail: string | null;
  userName: string | null;
  logisticaCompletada: boolean;
  casoAprobadoParaComite: boolean; // <-- La variable que faltaba
  
  usuarios: MockUser[];
  
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  setRole: (role: Role) => void;
  setLogisticaCompletada: (estado: boolean) => void;
  setCasoAprobadoParaComite: (estado: boolean) => void;
  agregarUsuario: (user: MockUser) => void;
  editarUsuario: (email: string, updated: Partial<MockUser>) => void;
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
      usuarios: MOCK_USERS,

      agregarUsuario: (user) => set((state) => ({ usuarios: [...state.usuarios, user] })),
      editarUsuario: (email, updated) => set((state) => ({
        usuarios: state.usuarios.map(u => u.email === email ? { ...u, ...updated } : u)
      })),

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
      
      setRole: (role: Role) => {
        const mockUser = MOCK_USERS.find(u => u.role === role);
        set({ 
          currentRole: role, 
          ...(mockUser ? { userEmail: mockUser.email, userName: mockUser.name } : {}) 
        });
      },
      setLogisticaCompletada: (estado) => set({ logisticaCompletada: estado }),
      setCasoAprobadoParaComite: (estado) => set({ casoAprobadoParaComite: estado }),
    }),
    {
      name: 'esavi-auth-storage',
    }
  )
);