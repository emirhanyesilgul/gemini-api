
import React, { useState, useRef } from 'react';
import type { InputCategory } from '../types';
import { UploadIcon } from './icons';


interface FileUploadProps {
  onFileUpload: (data: InputCategory[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, setIsProcessing }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      setIsProcessing(false); // Reset processing state on new file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            onFileUpload(data);
          } else {
            throw new Error("Uploaded file is not a valid JSON array.");
          }
        } catch (err) {
          setError("Failed to parse JSON. Please upload a valid file.");
          onFileUpload([]);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        onFileUpload([]);
      };
      reader.readAsText(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-400">Upload Product Data</h2>
      <p className="text-center text-gray-400 mb-6">Upload your product JSON file to begin.</p>
      
      <div className="flex flex-col items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".txt,.json"
        />
        <button
          onClick={handleButtonClick}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
        >
          <UploadIcon />
          <span>Choose File</span>
        </button>
        {fileName && <p className="mt-4 text-gray-300">Selected file: <span className="font-semibold text-green-400">{fileName}</span></p>}
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  );
};
