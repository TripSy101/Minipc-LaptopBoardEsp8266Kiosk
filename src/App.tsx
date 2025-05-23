import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import ServiceGrid from './components/ServiceGrid';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';
import AdminPanel from './components/admin/AdminPanel';
import StatusIndicator from './components/StatusIndicator';
import { useAdminPanel } from './hooks/useAdminPanel';
import { useOrientation } from './hooks/useOrientation';
import { useSerialConnection } from './hooks/useSerialConnection';
import { useAppStore } from './store/appStore';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { isAdminOpen, toggleAdmin } = useAdminPanel();
  const orientation = useOrientation();
  const { connectionStatus } = useSerialConnection();
  const maintenanceMode = useAppStore((state) => state.maintenanceMode);

  // Handle splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className={`flex flex-col h-full bg-slate-900 ${orientation === 'portrait' ? 'portrait' : 'landscape'}`}>
      {/* Admin panel trigger area */}
      <div 
        className="admin-trigger cursor-pointer min-h-[50px] min-w-[50px] bg-transparent" 
        onContextMenu={(e) => {
          e.preventDefault();
          console.log('Admin trigger clicked');
          toggleAdmin();
        }}
        onMouseDown={() => {
          const timer = setTimeout(() => {
            console.log('Long press detected');
            toggleAdmin();
          }, 3000);
          const handleMouseUp = () => clearTimeout(timer);
          document.addEventListener('mouseup', handleMouseUp, { once: true });
        }}
      />
      
      <Header />
      
      <main className="flex-1 overflow-hidden p-2">
        {maintenanceMode ? (
          <div className="h-full flex items-center justify-center">
            <div className="bg-red-900/80 p-6 rounded-lg text-center animate-pulse">
              <h2 className="text-2xl font-bold mb-2">MAINTENANCE MODE</h2>
              <p className="text-white/80">System is currently under maintenance</p>
              <p className="mt-4 text-sm">Please check back later or contact support</p>
            </div>
          </div>
        ) : (
          <ServiceGrid />
        )}
      </main>
      
      <StatusIndicator status={connectionStatus} maintenanceMode={maintenanceMode} />
      <Footer />
      
      {isAdminOpen && <AdminPanel onClose={toggleAdmin} />}
    </div>
  );
};

export default App;