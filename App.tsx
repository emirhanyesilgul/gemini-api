import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { InputCategory, ProcessedCategory, OutputCategory, AzureSettings } from './types';
import { generateImage } from './services/geminiService';
import { uploadImageToAzure } from './services/cdnService';
import { FileUpload } from './components/FileUpload';
import { CategoryGrid } from './components/CategoryGrid';
import { ZapIcon, DownloadIcon, RefreshIcon, KeyIcon, PauseIcon, PlayIcon } from './components/icons';
import { AzureSettingsForm } from './components/AzureSettings';
import { EditPromptModal } from './components/EditPromptModal';

declare global {
    // FIX: Moved the `AIStudio` interface into the `declare global` block.
    // This resolves a TypeScript error where the locally-scoped `AIStudio` type conflicted with the
    // expectation of a global type for augmenting the `Window` interface.
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const App: React.FC = () => {
  const [rawCategories, setRawCategories] = useState<InputCategory[]>([]);
  const [processedCategories, setProcessedCategories] = useState<ProcessedCategory[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [azureSettings, setAzureSettings] = useState<AzureSettings>({
    storageUrl: '',
    container: '',
    token: '',
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<ProcessedCategory | null>(null);
  const [isProcessingItem, setIsProcessingItem] = useState<boolean>(false);
  
  useEffect(() => {
    try {
        const savedSettings = localStorage.getItem('azureSettings');
        if (savedSettings) {
            setAzureSettings(JSON.parse(savedSettings));
        }
    } catch (error) {
        console.error("Failed to parse Azure settings from localStorage", error);
    }

    const checkApiKey = async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsKeySelected(hasKey);
        } else {
            setIsKeySelected(true); // Fallback for environments where aistudio is not available
        }
    };
    checkApiKey();
  }, []);

  const handleSettingsSave = (settings: AzureSettings) => {
    setAzureSettings(settings);
    localStorage.setItem('azureSettings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  const handleFileUpload = useCallback((data: InputCategory[]) => {
    setRawCategories(data);
    setProgress(null);
    setIsProcessing(false);
    setIsPaused(false);
    const initialProcessed: ProcessedCategory[] = data.map(cat => {
        const hasExistingUrl = cat.url && cat.url.trim() !== '';
        return {
            id: cat.id,
            name: cat.name,
            url: hasExistingUrl ? cat.url! : '',
            status: hasExistingUrl ? 'success' : 'idle',
            prompt: `A simple, artistic, high-quality, professional product photograph representing the concept of '${cat.name}'. The background should be a clean, solid light gray (#f3f4f6). No text or logos.`,
        };
    });
    setProcessedCategories(initialProcessed);
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        setIsKeySelected(true);
    } else {
        alert("API Key selection is not available in this environment.");
    }
  };

  const processSingleCategory = useCallback(async (categoryToProcess: ProcessedCategory) => {
    if (!isKeySelected) {
        alert("Please select an API Key first.");
        setIsProcessing(false);
        return;
    }

    if (!azureSettings.storageUrl || !azureSettings.container || !azureSettings.token) {
      alert("Please configure and save your Azure CDN settings before generating images.");
      setIsProcessing(false);
      return;
    }
    
    const totalCount = rawCategories.length;
    setProcessedCategories(prev => {
        const currentlyDone = prev.filter(p => p.status === 'success' || p.status === 'error').length;
        setProgress(`${currentlyDone + 1} / ${totalCount}`);
        return prev.map(p => 
            p.id === categoryToProcess.id ? { ...p, status: 'loading', error: undefined } : p
        );
    });

    try {
        const { base64Data, mimeType } = await generateImage(categoryToProcess.prompt);
        const imageUrl = await uploadImageToAzure(base64Data, mimeType, azureSettings);

        setProcessedCategories(prev => prev.map(p => 
            p.id === categoryToProcess.id ? { ...p, url: imageUrl, status: 'success' } : p
        ));
    } catch (error: any) {
        console.error(`Failed to process image for ${categoryToProcess.name}:`, error);
        
        let errorMessage = 'Image Generation Failed';
        const errorString = JSON.stringify(error);

        if (errorString.includes('RESOURCE_EXHAUSTED') || error?.code === 429) {
            errorMessage = 'Quota Exceeded';
        } else if (errorString.includes('Requested entity was not found')) {
            errorMessage = 'Invalid API Key';
            setIsKeySelected(false);
        } else if (error.message.includes('CDN')) {
            errorMessage = 'CDN Upload Failed';
        }

        setProcessedCategories(prev => prev.map(p => 
            p.id === categoryToProcess.id ? { ...p, status: 'error', error: errorMessage } : p
        ));
    }
  }, [isKeySelected, azureSettings, rawCategories.length]);

  useEffect(() => {
    if (!isProcessing || isPaused || isProcessingItem) {
        return;
    }

    const nextCategory = processedCategories.find(c => c.status === 'idle');

    if (!nextCategory) {
        setIsProcessing(false);
        setProgress(null);
        return;
    }

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const process = async () => {
        setIsProcessingItem(true);
        await processSingleCategory(nextCategory);
        await delay(10000); // Delay between automatic processing items
        setIsProcessingItem(false);
    };
    
    process();
  }, [isProcessing, isPaused, processedCategories, isProcessingItem, processSingleCategory]);


  const handleGenerateImages = async () => {
    const queue = processedCategories.filter(c => c.status === 'idle');
    if (queue.length === 0) {
      alert("Please upload a file or all items have been processed/skipped.");
      return;
    }
    setIsProcessing(true);
    setIsPaused(false);
  };
  
  const handlePauseProcessing = () => setIsPaused(true);
  const handleResumeProcessing = () => setIsPaused(false);


  const handleRetryFailed = async () => {
    const failedItems = processedCategories.filter(c => c.status === 'error');
    if (failedItems.length === 0) {
        alert("No failed items to retry.");
        return;
    }
    setProcessedCategories(prev => prev.map(c => 
        c.status === 'error' ? { ...c, status: 'idle', error: undefined } : c
    ));
    setIsProcessing(true);
    setIsPaused(false);
};
  
  const handleDownload = () => {
    const outputData: OutputCategory[] = processedCategories
      .filter(cat => cat.status === 'success')
      .map(({ id, name, url }) => ({ id, name, url }));
      
    if (outputData.length === 0) {
      alert("No successfully processed categories to download.");
      return;
    }

    const dataStr = JSON.stringify(outputData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'processed_products_with_images.json');
    linkElement.click();
  };

  const handleOpenEditModal = (category: ProcessedCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleRegenerateWithPrompt = async (categoryId: number, newPrompt: string) => {
    const categoryToUpdate = processedCategories.find(c => c.id === categoryId);
    if (categoryToUpdate) {
        const updatedCategory = { ...categoryToUpdate, prompt: newPrompt };
        setProcessedCategories(prev => prev.map(p => p.id === categoryId ? updatedCategory : p));
        await processSingleCategory(updatedCategory);
    }
  };

  const { hasFailures, isComplete } = useMemo(() => {
    if (rawCategories.length === 0) {
      return { hasFailures: false, isComplete: false };
    }
    const successCount = processedCategories.filter(c => c.status === 'success').length;
    const errorCount = processedCategories.filter(c => c.status === 'error').length;
    return {
      hasFailures: errorCount > 0,
      isComplete: successCount + errorCount === rawCategories.length
    };
  }, [processedCategories, rawCategories.length]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
            Product <span className="text-blue-400">Image Generator</span>
          </h1>
          <p className="text-lg text-gray-400">
            Automatically generate and attach images to your product categories.
          </p>
        </header>

        <main className="flex flex-col items-center">
            <AzureSettingsForm initialSettings={azureSettings} onSave={handleSettingsSave} />
            <FileUpload onFileUpload={handleFileUpload} setIsProcessing={setIsProcessing} />
            
            {rawCategories.length > 0 && (
                <div className="mt-8 flex flex-col items-center gap-4 w-full sm:w-auto">
                   {isKeySelected ? (
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                           {!isProcessing && (
                                <button
                                    onClick={handleGenerateImages}
                                    className="flex-1 flex items-center justify-center px-8 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                                >
                                    <ZapIcon />
                                    Generate Images
                                </button>
                            )}
                            {isProcessing && !isPaused && (
                                <button
                                    onClick={handlePauseProcessing}
                                    className="flex-1 flex items-center justify-center px-8 py-3 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-400"
                                >
                                    <PauseIcon />
                                    Pause
                                </button>
                            )}
                            {isProcessing && isPaused && (
                                <button
                                    onClick={handleResumeProcessing}
                                    className="flex-1 flex items-center justify-center px-8 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
                                >
                                    <PlayIcon />
                                    Resume
                                </button>
                            )}
                            {(isComplete || processedCategories.some(c => c.status === 'success')) && (
                                 <button
                                    onClick={handleDownload}
                                    className="flex-1 flex items-center justify-center px-8 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                                >
                                    <DownloadIcon />
                                    Download Results
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="w-full max-w-md text-center p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                            <p className="mb-4 text-yellow-200">To generate images, you must select an API key. This may enable billing for your project.</p>
                            <button
                                onClick={handleSelectKey}
                                className="w-full flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
                            >
                                <KeyIcon />
                                Select API Key
                            </button>
                             <p className="text-xs text-gray-400 mt-3">
                                For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">Gemini API billing documentation</a>.
                            </p>
                        </div>
                    )}
                    {hasFailures && !isProcessing && (
                         <button
                            onClick={handleRetryFailed}
                            className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500"
                        >
                            <RefreshIcon />
                            Retry Failed Items
                        </button>
                    )}
                    {isProcessing && progress && (
                        <div className="mt-4 text-center">
                            <p className="text-blue-300">{`Processing: ${progress}`}</p>
                            <p className="text-sm text-gray-500">(A 10s delay is added between requests to prevent API errors)</p>
                        </div>
                    )}
                </div>
            )}
            
            <CategoryGrid 
              categories={processedCategories} 
              onEditPrompt={handleOpenEditModal}
              isProcessingQueue={isProcessing && !isPaused}
            />
        </main>
      </div>
      <EditPromptModal 
        isOpen={isModalOpen}
        onClose={handleCloseEditModal}
        category={editingCategory}
        onGenerate={handleRegenerateWithPrompt}
      />
    </div>
  );
};

export default App;
