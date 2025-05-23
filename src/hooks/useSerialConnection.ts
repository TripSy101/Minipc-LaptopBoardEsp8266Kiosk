import { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const useSerialConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.Disconnected);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Poll ESP8266 status
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/esp/status`);
        const data = await response.json();
        
        setConnectionStatus(data.connected ? ConnectionStatus.Connected : ConnectionStatus.Disconnected);
        setError(null);
        
        if (data.last_message) {
          setMessages(prev => [...prev, data.last_message]);
        }
      } catch (err) {
        setConnectionStatus(ConnectionStatus.Error);
        setError('Failed to connect to ESP8266');
        console.error('Error polling ESP8266 status:', err);
      }
    };
    
    // Initial poll
    pollStatus();
    
    // Poll every 5 seconds
    const interval = setInterval(pollStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const sendCommand = async (command: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/esp/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send command');
      }
      
      setMessages(prev => [...prev, `Sent: ${command}`]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send command');
      console.error('Error sending command:', err);
    }
  };
  
  const reconnect = async () => {
    try {
      setConnectionStatus(ConnectionStatus.Connecting);
      setError(null);
      
      // Send reset command
      await sendCommand('RESET');
      
      // Wait for reconnection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check status
      const response = await fetch(`${API_BASE_URL}/esp/status`);
      const data = await response.json();
      
      setConnectionStatus(data.connected ? ConnectionStatus.Connected : ConnectionStatus.Disconnected);
      
      if (data.connected) {
        setMessages(prev => [...prev, 'ESP8266 reconnected']);
      } else {
        throw new Error('Failed to reconnect');
      }
    } catch (err) {
      setConnectionStatus(ConnectionStatus.Error);
      setError(err instanceof Error ? err.message : 'Failed to reconnect');
      console.error('Error reconnecting:', err);
    }
  };
  
  return {
    connectionStatus,
    messages,
    error,
    sendCommand,
    reconnect
  };
};