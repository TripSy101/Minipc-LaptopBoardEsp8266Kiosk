import React, { useEffect, useState } from 'react';
import { Car, Droplets, Wind, ShowerHead as Shower, Waves, AlertCircle, Clock } from 'lucide-react';
import { Service, ServiceStatus } from '../types';
import { formatPrice } from '../utils/formatting';
import { useAppStore } from '../store/appStore';

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  const activeService = useAppStore((state) => state.activeService);
  const serviceTimers = useAppStore((state) => state.serviceTimers);
  const updateServiceTimer = useAppStore((state) => state.updateServiceTimer);
  const resetServiceTimer = useAppStore((state) => state.resetServiceTimer);
  const [timeLeft, setTimeLeft] = useState<number>(service.duration);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (activeService?.id === service.id) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            resetServiceTimer(service.id.toString());
            return service.duration;
          }
          const newTime = prev - 1;
          updateServiceTimer(service.id.toString(), newTime);
          return newTime;
        });
      }, 1000);
    } else {
      setTimeLeft(service.duration);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeService, service.id, service.duration, updateServiceTimer, resetServiceTimer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getIcon = () => {
    switch (service.type) {
      case 'carwash':
        return <Car className="w-10 h-10" />;
      case 'shampoo':
        return <Droplets className="w-10 h-10" />;
      case 'inflator':
        return <Wind className="w-10 h-10" />;
      case 'faucet':
        return <Shower className="w-10 h-10" />;
      default:
        return <Waves className="w-10 h-10" />;
    }
  };

  const getStatusClass = () => {
    switch (service.status) {
      case ServiceStatus.Available:
        return "bg-gradient-to-br from-blue-800 to-indigo-900 hover:from-blue-700 hover:to-indigo-800";
      case ServiceStatus.InUse:
        return "bg-gradient-to-br from-amber-700 to-orange-800 cursor-not-allowed";
      case ServiceStatus.Maintenance:
        return "bg-gradient-to-br from-red-800 to-red-900 cursor-not-allowed";
      default:
        return "bg-gradient-to-br from-blue-800 to-indigo-900";
    }
  };

  const handleClick = () => {
    if (service.status === ServiceStatus.Available) {
      onSelect(service);
    }
  };

  const isActive = activeService?.id === service.id;

  return (
    <div 
      className={`rounded-xl p-4 shadow-lg transition-all duration-300 flex flex-col h-full ${getStatusClass()} ${
        service.status === ServiceStatus.Available ? 'transform hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${isActive ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-white p-2 rounded-full bg-black/20">
          {getIcon()}
        </div>
        
        <div className="text-right">
          <div className="text-xl font-bold text-white">{formatPrice(service.price)}</div>
          <div className="flex items-center text-amber-300 text-sm">
            <Clock className="w-3 h-3 mr-1" />
            <span>{isActive ? `⏱️ Time Left: ${formatTime(timeLeft)}` : `⏳ Duration: ${formatTime(service.duration)}`}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <h3 className="text-xl font-bold text-white">{service.name}</h3>
        <p className="text-white/80 text-sm">{service.description}</p>
      </div>
      
      <div className="mt-auto">
        {service.status === ServiceStatus.Available ? (
          <div className="text-white/90 text-sm mt-2">Tap to select</div>
        ) : service.status === ServiceStatus.Maintenance ? (
          <div className="flex items-center text-red-300 text-sm mt-2">
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>Under maintenance</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-300 text-sm mt-2">
            <Clock className="w-3 h-3 mr-1" />
            <span>In use</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;