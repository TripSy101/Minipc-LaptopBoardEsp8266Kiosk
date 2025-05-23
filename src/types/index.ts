export enum ServiceStatus {
  Available = 'Available',
  InUse = 'In Use',
  Maintenance = 'Maintenance'
}

export enum ConnectionStatus {
  Connected = 'connected',
  Disconnected = 'disconnected',
  Error = 'error',
  Connecting = 'connecting'
}

export type ServiceType = 'carwash' | 'shampoo' | 'inflator' | 'faucet' | 'other';

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in seconds
  timeRemaining: number; // in seconds
  status: ServiceStatus;
  type: ServiceType;
  enabled: boolean; // New field to control service visibility
}

export interface ServiceConfig {
  maxServices: number;
  minDuration: number;
  maxDuration: number;
  minPrice: number;
  maxPrice: number;
}