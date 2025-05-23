import { useState, useEffect } from 'react';

export const useAdminPanel = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
  
  const toggleAdmin = () => {
    setIsAdminOpen(!isAdminOpen);
  };
  
  useEffect(() => {
    const handleLongPress = () => {
      setIsAdminOpen(true);
    };
    
    const handleTouchStart = () => {
      const timer = window.setTimeout(handleLongPress, 2000);
      setLongPressTimer(timer);
    };
    
    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    };
    
    const adminTrigger = document.querySelector('.admin-trigger');
    if (adminTrigger) {
      adminTrigger.addEventListener('touchstart', handleTouchStart);
      adminTrigger.addEventListener('touchend', handleTouchEnd);
      adminTrigger.addEventListener('touchcancel', handleTouchEnd);
    }
    
    return () => {
      if (adminTrigger) {
        adminTrigger.removeEventListener('touchstart', handleTouchStart);
        adminTrigger.removeEventListener('touchend', handleTouchEnd);
        adminTrigger.removeEventListener('touchcancel', handleTouchEnd);
      }
      
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);
  
  return { isAdminOpen, toggleAdmin };
};