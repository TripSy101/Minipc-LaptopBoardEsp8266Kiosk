import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import ServiceSettings from './ServiceSettings';
import SystemSettings from './SystemSettings';
import LogViewer from './LogViewer';

interface AdminPanelProps {
  onClose: () => void;
}

type Tab = 'services' | 'system' | 'logs';

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  
  const adminPassword = useAppStore((state) => state.adminPassword);
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };
  
  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-[90%] max-w-md animate-scale-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Admin Login</h2>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white p-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-[95%] h-[90%] max-w-4xl animate-scale-in flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-700 mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'services' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/70 hover:text-white'}`}
            onClick={() => setActiveTab('services')}
          >
            Services
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'system' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/70 hover:text-white'}`}
            onClick={() => setActiveTab('system')}
          >
            System
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'logs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/70 hover:text-white'}`}
            onClick={() => setActiveTab('logs')}
          >
            Logs
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {activeTab === 'services' && <ServiceSettings />}
          {activeTab === 'system' && <SystemSettings />}
          {activeTab === 'logs' && <LogViewer />}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;