import { create } from 'zustand';

export interface Establecimiento {
  id: number;
  nombre: string;
  tipo: string;
  sibasi: string;
  institucionMacro: string;
  activo: boolean;
}

interface CatalogState {
  establecimientos: Establecimiento[];
  loading: boolean;
  setEstablecimientos: (data: Establecimiento[]) => void;
  setLoading: (status: boolean) => void;
}

export const useCatalogStore = create<CatalogState>()((set) => ({
  establecimientos: [],
  loading: false,
  setEstablecimientos: (data) => set({ establecimientos: data }),
  setLoading: (status) => set({ loading: status }),
}));
