
export interface InputCategory {
  id: number;
  name: string;
  url?: string;
}

export interface AzureSettings {
  storageUrl: string;
  container: string;
  token: string;
}

export interface ProcessedCategory {
  id: number;
  name: string;
  url: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  prompt: string;
  error?: string;
}

export interface OutputCategory {
  id: number;
  name: string;
  url: string;
}
