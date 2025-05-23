import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
  const [animationState, setAnimationState] = useState<'initial' | 'active' | 'complete'>('initial');
  
  useEffect(() => {
    // Start animation after a short delay
    const initialTimer = setTimeout(() => {
      setAnimationState('active');
    }, 100);
    
    // Set completion state after animation is done
    const completionTimer = setTimeout(() => {
      setAnimationState('complete');
    }, 2500);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(completionTimer);
    };
  }, []);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900">
      <div 
        className={`transform transition-all duration-1000 ease-out ${
          animationState === 'initial' ? 'scale-90 opacity-0' : 
          animationState === 'active' ? 'scale-100 opacity-100' : 
          'scale-110 opacity-0'
        }`}
      >
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            ESQUIMA KIOSK
          </h1>
          <p className="text-xl text-yellow-300">5n1 eCarwash</p>
        </div>
        
        <div className="mt-8 relative h-2 w-64 bg-slate-700 rounded-full overflow-hidden mx-auto">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{
              width: animationState === 'initial' ? '0%' : 
                   animationState === 'active' ? '100%' : '100%',
              transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>
        
        <div className="mt-4 text-center text-slate-400 text-sm">
          Loading system...
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;