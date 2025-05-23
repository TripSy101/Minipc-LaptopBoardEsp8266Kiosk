import React, { useState, useEffect } from 'react';
import { Coins, Play, X } from 'lucide-react';
import { Service } from '../types';
import { formatPrice } from '../utils/formatting';
import { useSerialConnection } from '../hooks/useSerialConnection';

interface PaymentModalProps {
  service: Service;
  onStart: () => void;
  onCancel: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  service, 
  onStart, 
  onCancel 
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'waiting' | 'received' | 'error'>('waiting');
  const { messages } = useSerialConnection();
  
  // Listen for coin inserted message from ESP8266
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage === 'COIN_INSERTED') {
      setPaymentStatus('received');
    }
  }, [messages]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-800 rounded-xl shadow-2xl p-6 w-[90%] max-w-md animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Payment</h2>
          <button 
            onClick={onCancel}
            className="text-white/70 hover:text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="text-white/80 mb-2">Selected Service:</div>
          <div className="text-xl font-bold text-white">{service.name}</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">
            {formatPrice(service.price)}
          </div>
        </div>
        
        <div className="bg-slate-900 rounded-lg p-4 mb-6">
          {paymentStatus === 'waiting' ? (
            <div className="flex flex-col items-center">
              <Coins className="w-12 h-12 text-yellow-400 mb-3 animate-pulse-slow" />
              <div className="text-lg font-medium text-white text-center">
                Please insert coins
              </div>
              <div className="text-white/60 text-sm text-center mt-1">
                Waiting for payment...
              </div>
            </div>
          ) : paymentStatus === 'received' ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-lg font-medium text-white text-center">
                Payment received!
              </div>
              <div className="text-white/60 text-sm text-center mt-1">
                Press START to begin
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-3">
                <X className="w-8 h-8 text-white" />
              </div>
              <div className="text-lg font-medium text-white text-center">
                Payment error
              </div>
              <div className="text-white/60 text-sm text-center mt-1">
                Please try again
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-between gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={onStart}
            disabled={paymentStatus !== 'received'}
            className={`flex-1 py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
              paymentStatus === 'received'
                ? 'bg-green-600 hover:bg-green-500'
                : 'bg-gray-600 opacity-50 cursor-not-allowed'
            } transition-colors`}
          >
            <Play className="w-4 h-4" />
            <span>START</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;