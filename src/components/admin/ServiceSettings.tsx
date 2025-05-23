import React, { useState } from 'react';
import { Edit2, Save, Trash2, Plus, Power } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Service, ServiceStatus, ServiceType } from '../../types';
import { formatPrice } from '../../utils/formatting';

const ServiceSettings: React.FC = () => {
  const { services, updateService, addService, removeService, toggleServiceEnabled } = useAppStore();
  
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 0,
    type: 'carwash' as ServiceType
  });
  
  const handleEdit = (service: Service) => {
    setEditingService(service);
    setEditForm({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      type: service.type
    });
  };
  
  const handleSave = () => {
    if (editingService) {
      const updatedService = {
        ...editingService,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        duration: editForm.duration,
        type: editForm.type
      };
      
      updateService(updatedService);
      setEditingService(null);
    }
  };
  
  const handleAdd = () => {
    const newService: Omit<Service, 'id'> = {
      name: editForm.name,
      description: editForm.description,
      price: editForm.price,
      duration: editForm.duration,
      type: editForm.type,
      status: ServiceStatus.Available,
      timeRemaining: 0,
      enabled: true
    };
    
    addService(newService);
    setShowAddForm(false);
    setEditForm({
      name: '',
      description: '',
      price: 0,
      duration: 0,
      type: 'carwash'
    });
  };
  
  const handleCancel = () => {
    setEditingService(null);
    setShowAddForm(false);
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Service Settings</h3>
        
        <button
          onClick={() => setShowAddForm(true)}
          disabled={services.length >= 20}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>
      
      <div className="bg-slate-900 rounded-lg p-4 mb-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-2 px-4 text-white/80">ID</th>
              <th className="py-2 px-4 text-white/80">Name</th>
              <th className="py-2 px-4 text-white/80">Price</th>
              <th className="py-2 px-4 text-white/80">Duration</th>
              <th className="py-2 px-4 text-white/80">Status</th>
              <th className="py-2 px-4 text-white/80">Enabled</th>
              <th className="py-2 px-4 text-white/80">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id} className="border-b border-slate-800">
                <td className="py-3 px-4 text-white">{service.id}</td>
                <td className="py-3 px-4 text-white">{service.name}</td>
                <td className="py-3 px-4 text-white">{formatPrice(service.price)}</td>
                <td className="py-3 px-4 text-white">{service.duration}s</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    service.status === ServiceStatus.Available 
                      ? 'bg-green-900/50 text-green-400' 
                      : service.status === ServiceStatus.InUse
                      ? 'bg-amber-900/50 text-amber-400'
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {service.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleServiceEnabled(service.id)}
                    className={`p-1 rounded-full ${
                      service.enabled 
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/40' 
                        : 'bg-red-600/20 text-red-400 hover:bg-red-600/40'
                    } transition-colors`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-1 rounded-full bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeService(service.id)}
                      className="p-1 rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {(editingService || showAddForm) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-[90%] max-w-lg">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Price (₱)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editForm.duration}
                    onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value, 10)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Type
                </label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({...editForm, type: e.target.value as ServiceType})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="carwash">Carwash</option>
                  <option value="shampoo">Shampoo</option>
                  <option value="inflator">Inflator/Blower</option>
                  <option value="faucet">Faucet</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={editingService ? handleSave : handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingService ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSettings;