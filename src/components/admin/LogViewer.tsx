import React, { useEffect, useState } from 'react';
import { RefreshCw, Download, Search } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  serviceId: number;
  action: string;
  status: string;
  amount?: number;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Mock function to load logs - in production this would fetch from SQLite via Python backend
  const loadLogs = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data
    const mockLogs: LogEntry[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
      serviceId: Math.floor(Math.random() * 5) + 1,
      action: ['START', 'COMPLETE', 'PAYMENT', 'ERROR'][Math.floor(Math.random() * 4)],
      status: ['SUCCESS', 'FAILED', 'PENDING'][Math.floor(Math.random() * 3)],
      amount: Math.floor(Math.random() * 100) + 10
    }));
    
    setLogs(mockLogs);
    setLoading(false);
  };
  
  useEffect(() => {
    loadLogs();
  }, []);
  
  const handleExport = () => {
    // In production, this would trigger a download of the logs from the backend
    alert('Export functionality would be implemented here');
  };
  
  const filteredLogs = logs.filter(log => {
    if (!filter) return true;
    const searchTerm = filter.toLowerCase();
    return (
      log.serviceId.toString().includes(searchTerm) ||
      log.action.toLowerCase().includes(searchTerm) ||
      log.status.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Transaction Logs</h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={loadLogs}
            className="p-2 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={handleExport}
            className="p-2 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/40 transition-colors"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-white/50" />
        </div>
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        />
      </div>
      
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/60">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-white/20 border-t-white rounded-full mb-2"></div>
            <p>Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-white/60">
            <p>No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4 text-white/80">ID</th>
                  <th className="py-3 px-4 text-white/80">Timestamp</th>
                  <th className="py-3 px-4 text-white/80">Service</th>
                  <th className="py-3 px-4 text-white/80">Action</th>
                  <th className="py-3 px-4 text-white/80">Status</th>
                  <th className="py-3 px-4 text-white/80">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800">
                    <td className="py-3 px-4 text-white">{log.id}</td>
                    <td className="py-3 px-4 text-white">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 text-white">Service {log.serviceId}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.action === 'START' ? 'bg-blue-900/50 text-blue-400' :
                        log.action === 'COMPLETE' ? 'bg-green-900/50 text-green-400' :
                        log.action === 'PAYMENT' ? 'bg-purple-900/50 text-purple-400' :
                        'bg-red-900/50 text-red-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.status === 'SUCCESS' ? 'bg-green-900/50 text-green-400' :
                        log.status === 'FAILED' ? 'bg-red-900/50 text-red-400' :
                        'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">
                      {log.amount ? `₱${log.amount.toFixed(2)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;