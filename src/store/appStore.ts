import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Service, ServiceStatus } from '../types';

interface AppState {
  services: Service[];
  maintenanceMode: boolean;
  adminPassword: string;
  headerConfig: {
    mainHeader: string;
    subHeader: string;
  };
  activeService: Service | null;
  serviceTimers: Record<string, number>;
  updateService: (updatedService: Service) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  removeService: (id: number) => void;
  toggleServiceEnabled: (id: number) => void;
  toggleMaintenanceMode: () => void;
  updateAdminPassword: (password: string) => void;
  setMaintenanceMode: (mode: boolean) => void;
  setHeaderConfig: (config: { mainHeader: string; subHeader: string }) => void;
  setActiveService: (service: Service | null) => void;
  updateServiceTimer: (serviceId: string, timeLeft: number) => void;
  resetServiceTimer: (serviceId: string) => void;
}

const MAX_SERVICES = 20;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      services: [
        {
          id: 1,
          name: 'CARWASH 1',
          description: 'Premium Wash',
          price: 150.00,
          duration: 180,
          timeRemaining: 0,
          status: ServiceStatus.Available,
          type: 'carwash',
          enabled: true
        },
        {
          id: 2,
          name: 'CARWASH 2',
          description: 'Premium Wash',
          price: 150.00,
          duration: 180,
          timeRemaining: 0,
          status: ServiceStatus.Available,
          type: 'carwash',
          enabled: true
        },
        {
          id: 3,
          name: 'SHAMPOO',
          description: 'Foam Treatment',
          price: 50.00,
          duration: 120,
          timeRemaining: 0,
          status: ServiceStatus.Available,
          type: 'shampoo',
          enabled: true
        },
        {
          id: 4,
          name: 'INFLATOR/BLOWER',
          description: 'Tire/Air Drying',
          price: 20.00,
          duration: 60,
          timeRemaining: 0,
          status: ServiceStatus.Available,
          type: 'inflator',
          enabled: true
        },
        {
          id: 5,
          name: 'FAUCET',
          description: 'Water Refill',
          price: 10.00,
          duration: 60,
          timeRemaining: 0,
          status: ServiceStatus.Available,
          type: 'faucet',
          enabled: true
        },
      ],
      maintenanceMode: false,
      adminPassword: 'admin123',
      headerConfig: {
        mainHeader: 'ESQUIMA KIOSK',
        subHeader: '5n1 eCarwash',
      },
      activeService: null,
      serviceTimers: {},
      setMaintenanceMode: (mode) => set({ maintenanceMode: mode }),
      setHeaderConfig: (config) => set({ headerConfig: config }),
      setActiveService: (service) => set({ activeService: service }),
      updateServiceTimer: (serviceId, timeLeft) =>
        set((state) => ({
          serviceTimers: { ...state.serviceTimers, [serviceId]: timeLeft },
        })),
      resetServiceTimer: (serviceId) =>
        set((state) => {
          const { [serviceId]: _, ...rest } = state.serviceTimers;
          return { serviceTimers: rest };
        }),
      updateService: (updatedService) => {
        set((state) => ({
          services: state.services.map((service) => 
            service.id === updatedService.id ? updatedService : service
          ),
        }));
      },
      addService: (newService) => {
        set((state) => {
          if (state.services.length >= MAX_SERVICES) {
            console.warn('Maximum number of services reached');
            return state;
          }
          
          const nextId = Math.max(...state.services.map(s => s.id), 0) + 1;
          return {
            services: [...state.services, { ...newService, id: nextId }]
          };
        });
      },
      removeService: (id) => {
        set((state) => ({
          services: state.services.filter((service) => service.id !== id)
        }));
      },
      toggleServiceEnabled: (id) => {
        set((state) => ({
          services: state.services.map((service) => 
            service.id === id ? { ...service, enabled: !service.enabled } : service
          )
        }));
      },
      toggleMaintenanceMode: () => {
        set((state) => ({
          maintenanceMode: !state.maintenanceMode,
        }));
      },
      updateAdminPassword: (password) => {
        set(() => ({
          adminPassword: password,
        }));
      },
    }),
    {
      name: 'app-storage',
    }
  )
);