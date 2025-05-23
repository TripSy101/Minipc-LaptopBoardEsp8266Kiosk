import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  maintenanceMode: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, maintenanceMode }) => {
  const getStatusColor = () => {
    if (maintenanceMode) {
      return 'bg-red-500';
    }
    
    switch (status) {
      case ConnectionStatus.Connected:
        return 'bg-green-500';
      case ConnectionStatus.Disconnected:
        return 'bg-yellow-500';
      case ConnectionStatus.Error:
        return 'bg-red-500';
      case ConnectionStatus.Connecting:
        return 'bg-blue-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (maintenanceMode) {
      return 'Maintenance Mode';
    }
    
    switch (status) {
      case ConnectionStatus.Connected:
        return 'ESP8266 Connected';
      case ConnectionStatus.Disconnected:
        return 'ESP8266 Disconnected';
      case ConnectionStatus.Error:
        return 'Connection Error';
      case ConnectionStatus.Connecting:
        return 'Connecting...';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-lg shadow-lg">
      <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`} />
      <span className="text-sm font-medium text-white">{getStatusText()}</span>
    </div>
  );
};

export default StatusIndicator;