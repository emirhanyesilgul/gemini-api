import React, { useState, useEffect } from 'react';
import type { AzureSettings } from '../types';

interface AzureSettingsProps {
  initialSettings: AzureSettings;
  onSave: (settings: AzureSettings) => void;
}

export const AzureSettingsForm: React.FC<AzureSettingsProps> = ({ initialSettings, onSave }) => {
  const [settings, setSettings] = useState<AzureSettings>(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-400">CDN Settings</h2>
      <p className="text-center text-gray-400 mb-6">Enter your Azure Blob Storage details to upload images.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="storageUrl" className="block text-sm font-medium text-gray-300">Storage URL</label>
          <input
            type="text"
            id="storageUrl"
            name="storageUrl"
            value={settings.storageUrl}
            onChange={handleChange}
            placeholder="https://your-storage.blob.core.windows.net"
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="container" className="block text-sm font-medium text-gray-300">Container</label>
          <input
            type="text"
            id="container"
            name="container"
            value={settings.container}
            onChange={handleChange}
            placeholder="your-container-name"
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="token" className="block text-sm font-medium text-gray-300">SAS Token</label>
          <input
            type="password"
            id="token"
            name="token"
            value={settings.token}
            onChange={handleChange}
            placeholder="?sv=2020-08-04&..."
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};
