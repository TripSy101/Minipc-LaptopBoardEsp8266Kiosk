import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';

const HeaderConfig: React.FC = () => {
  const headerConfig = useAppStore((state) => state.headerConfig);
  const setHeaderConfig = useAppStore((state) => state.setHeaderConfig);
  
  const [mainHeader, setMainHeader] = useState(headerConfig.mainHeader);
  const [subHeader, setSubHeader] = useState(headerConfig.subHeader);

  const handleSave = () => {
    setHeaderConfig({
      mainHeader,
      subHeader,
    });
  };

  const handleReset = () => {
    setMainHeader('ESQUIMA KIOSK');
    setSubHeader('5n1 eCarwash');
    setHeaderConfig({
      mainHeader: 'ESQUIMA KIOSK',
      subHeader: '5n1 eCarwash',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Header Configuration</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="mainHeader" className="block text-sm font-medium text-gray-700 mb-1">
            Main Header
          </label>
          <input
            type="text"
            id="mainHeader"
            value={mainHeader}
            onChange={(e) => setMainHeader(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter main header text"
          />
        </div>

        <div>
          <label htmlFor="subHeader" className="block text-sm font-medium text-gray-700 mb-1">
            Sub-header
          </label>
          <input
            type="text"
            id="subHeader"
            value={subHeader}
            onChange={(e) => setSubHeader(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="Enter sub-header text"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderConfig; 