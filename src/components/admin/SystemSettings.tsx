import React, { useState } from 'react';
import { Save, Power, RotateCcw, PenTool as Tool, Play, Square, Clock, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useSerialConnection } from '../../hooks/useSerialConnection';
import HeaderConfig from './HeaderConfig';

const SystemSettings: React.FC = () => {
  const { toggleMaintenanceMode, maintenanceMode, adminPassword, updateAdminPassword } = useAppStore();
  const { connectionStatus, reconnect, sendCommand, error } = useSerialConnection();
  
  const [password, setPassword] = useState(adminPassword);
  const [testMode, setTestMode] = useState(false);
  const [simulatingService, setSimulatingService] = useState<number | null>(null);
  
  const handleSavePassword = () => {
    if (password.trim().length > 0) {
      updateAdminPassword(password);
      alert('Password updated successfully');
    } else {
      alert('Password cannot be empty');
    }
  };
  
  const handleResetESP = () => {
    if (confirm('Are you sure you want to reset the ESP8266?')) {
      sendCommand('RESET');
    }
  };

  const simulateService = async (serviceId: number) => {
    if (simulatingService === serviceId) {
      await sendCommand(`SERVICE${serviceId}_OFF`);
      setSimulatingService(null);
    } else {
      await sendCommand(`SERVICE${serviceId}_ON`);
      setSimulatingService(serviceId);
    }
  };

  return (
    <div className="p-2">
      <h3 className="text-xl font-semibold text-white mb-4">System Settings</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/80 rounded-lg text-white flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3">System Status</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Maintenance Mode</span>
              <button
                onClick={toggleMaintenanceMode}
                className={`px-4 py-2 rounded-lg ${
                  maintenanceMode ? 'bg-red-600 animate-pulse' : 'bg-blue-600'
                } text-white flex items-center`}
              >
                <Tool className="w-4 h-4 mr-2" />
                {maintenanceMode ? 'Disable' : 'Enable'}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">ESP8266 Connection</span>
              <button
                onClick={reconnect}
                disabled={connectionStatus === 'connecting'}
                className={`px-4 py-2 rounded-lg ${
                  connectionStatus === 'connecting' ? 'bg-gray-600' : 'bg-green-600'
                } text-white flex items-center`}
              >
                <RotateCcw className={`w-4 h-4 mr-2 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnect'}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Reset ESP8266</span>
              <button
                onClick={handleResetESP}
                className="px-4 py-2 rounded-lg bg-yellow-600 text-white"
              >
                Reset
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80">Test Mode</span>
              <button
                onClick={() => setTestMode(!testMode)}
                className={`px-4 py-2 rounded-lg ${
                  testMode ? 'bg-purple-600' : 'bg-slate-600'
                } text-white`}
              >
                {testMode ? 'Disable' : 'Enable'} Test Mode
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-3">Security</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            
            <button
              onClick={handleSavePassword}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Password
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <HeaderConfig />
      </div>
      
      {testMode && (
        <div className="bg-slate-900 rounded-lg p-4 mt-6">
          <h4 className="text-lg font-medium text-white mb-3">Test Controls</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((id) => (
              <div key={id} className="flex flex-col gap-2">
                <button
                  onClick={() => simulateService(id)}
                  className={`px-3 py-2 rounded-lg ${
                    simulatingService === id ? 'bg-red-600' : 'bg-green-600'
                  } text-sm text-white hover:opacity-90 transition-colors flex items-center justify-center`}
                >
                  {simulatingService === id ? (
                    <>
                      <Square className="w-4 h-4 mr-1" />
                      Stop Service {id}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Start Service {id}
                    </>
                  )}
                </button>
                <button
                  onClick={() => sendCommand(`START_SERVICE:${id}`)}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-500 transition-colors flex items-center justify-center"
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Start Timer {id}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => sendCommand('COIN_INSERTED')}
              className="px-4 py-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition-colors flex items-center justify-center"
            >
              <Power className="w-4 h-4 mr-2" />
              Simulate Coin Insert
            </button>
            <button
              onClick={() => sendCommand('RESET')}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Services
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;