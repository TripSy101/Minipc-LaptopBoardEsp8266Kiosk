import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';

const Header: React.FC = () => {
  const maintenanceMode = useAppStore((state) => state.maintenanceMode);
  const headerConfig = useAppStore((state) => state.headerConfig);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <header className="bg-gradient-to-r from-blue-900 to-purple-900 py-3 px-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-white font-light text-3xl md:text-4xl tracking-tight font-poppins">
            {headerConfig.mainHeader}
          </h1>
          <p className="text-yellow-300 text-sm md:text-base font-medium">
            {headerConfig.subHeader}
            {maintenanceMode && <span className="ml-2 text-red-300">(Maintenance Mode)</span>}
          </p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-white/90 text-lg font-light">
            {formatTime(currentTime)}
          </div>
          <div className="text-white/70 text-sm font-medium">
            {formatDate(currentTime)}
          </div>
          <div className="mt-2">
            <Settings className="w-6 h-6 text-white/70" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;