import React, { useState } from 'react';
import ServiceCard from './ServiceCard';
import { useAppStore } from '../store/appStore';
import { useSerialConnection } from '../hooks/useSerialConnection';
import { Service } from '../types';
import PaymentModal from './PaymentModal';

const ServiceGrid: React.FC = () => {
  const services = useAppStore((state) => state.services);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { sendCommand } = useSerialConnection();
  
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setShowPaymentModal(true);
  };
  
  const handleStartService = () => {
    if (selectedService) {
      sendCommand(`START_SERVICE:${selectedService.id}`);
      setShowPaymentModal(false);
    }
  };
  
  const handleCancelPayment = () => {
    setShowPaymentModal(false);
    setSelectedService(null);
  };

  // Filter out disabled services
  const enabledServices = services.filter(service => service.enabled);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full p-2">
      {enabledServices.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onSelect={handleServiceSelect}
        />
      ))}
      
      {showPaymentModal && selectedService && (
        <PaymentModal
          service={selectedService}
          onStart={handleStartService}
          onCancel={handleCancelPayment}
        />
      )}
    </div>
  );
};

export default ServiceGrid;