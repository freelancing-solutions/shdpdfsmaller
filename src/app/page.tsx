'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Upload, Download, FileText, Settings, Zap, Search, Trash2, RefreshCw } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useTabStore } from '@/store/tab-store';
import { APIClient } from '@/utils/api-client';
/*  ----------  shared job ⇢ blob helper  ---------- */
import { PdfApiService } from '@/lib/api/pdf-services';

async function runJobAndGetBlob(
  endpoint: string,
  form: FormData,
  onProgress: (pct: number) => void
): Promise<Blob> {
  const jobId = await PdfApiService.createJob(endpoint, form);

  await PdfApiService.waitForJobCompletion(
    jobId,
    2000,
    300_000,
    (resp) => onProgress(resp.status === 'processing' ? 50 : 100)
  );

  return PdfApiService.downloadResult(jobId);
}

// File interfaces
interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // Make it optional temporarily
  compressedSize?: number;
  compressionRatio?: number;
  compressedBlob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ConvertFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // Add file reference
  format?: string;
  convertedSize?: number;
  convertedBlob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface OCRFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // Add file reference
  extractedText?: string;
  confidence?: number;
  processedBlob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface AIFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  file?: File; // Add file reference
  result?: any;
  processedBlob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ManagedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  uploadedAt: Date;
  lastAccessed: Date;
  status: 'available' | 'processing' | 'error';
}

// Settings interfaces
interface CompressionSettings {
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
  imageQuality: number;
  optimizationStrategy?: 'balanced' | 'text' | 'image' | 'aggressive';
}

interface ConvertSettings {
  format: 'docx' | 'txt' | 'html' | 'images';
  quality: 'low' | 'medium' | 'high';
  preserveFormatting: boolean;
  extractImages: boolean;
}

interface OCRSettings {
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';
  outputFormat: 'txt' | 'pdf' | 'docx' | 'searchable-pdf';
  preserveLayout: boolean;
  confidence: number;
}

interface AISettings {
  tool: 'summarize' | 'translate' | 'extract-keywords' | 'analyze-sentiment' | 'generate-questions' | 'categorize';
  targetLanguage?: string;
  maxLength?: number;
  detailLevel: 'basic' | 'detailed' | 'comprehensive';
}

export default function Home() {
  const { user, isLoading } = useUser();
  const { activeTab, setActiveTab } = useTabStore();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [bulkCompressedBlob, setBulkCompressedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState<CompressionSettings>({
    compressionLevel: 'medium',
    imageQuality: 80,
  });

  const [convertFiles, setConvertFiles] = useState<ConvertFileItem[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [convertSettings, setConvertSettings] = useState<ConvertSettings>({
    format: 'docx',
    quality: 'medium',
    preserveFormatting: true,
    extractImages: false,
  });

  const [ocrFiles, setOcrFiles] = useState<OCRFileItem[]>([]);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrSettings, setOcrSettings] = useState<OCRSettings>({
    language: 'en',
    outputFormat: 'txt',
    preserveLayout: true,
    confidence: 85,
  });

  const [aiFiles, setAiFiles] = useState<AIFileItem[]>([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    tool: 'summarize',
    detailLevel: 'detailed',
  });

  const [managedFiles, setManagedFiles] = useState<ManagedFileItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

// Updated file upload handler with validation
const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(event.target.files || []);
  const newFiles: FileItem[] = [];
  
  for (const file of selectedFiles) {
    // Validate file before processing
    const validation = APIClient.validateFile(file);
    if (!validation.isValid) {
      console.error(`File validation failed for ${file.name}: ${validation.error}`);
      // You could show this error to the user
      continue;
    }

    const fileItem: FileItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf', // Fallback for empty type
      file: file,
      status: 'pending',
    };

    // Try to get analysis data for compression estimation
    try {
      const analysis = await APIClient.analyzeFile(file, {
        analysisType: 'compression-potential',
        includeMetadata: false
      });
      
      if (analysis.success && analysis.analysis) {
        fileItem.compressedSize = analysis.analysis.estimatedCompression?.estimatedSize;
        fileItem.compressionRatio = 1 - (analysis.analysis.compressionPotential || 0);
      }
    } catch (error) {
      console.warn('Failed to analyze file for compression estimation:', error);
      // Continue without analysis data - this is not critical
    }
    
    newFiles.push(fileItem);
  }
  
  setFiles(prev => [...prev, ...newFiles]);
}, []);


const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
  event.preventDefault();
  const droppedFiles = Array.from(event.dataTransfer.files);
  
  // Filter for PDF files and validate them
  const validFiles: File[] = [];
  
  for (const file of droppedFiles) {
    const validation = APIClient.validateFile(file);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      console.warn(`Skipping invalid file ${file.name}: ${validation.error}`);
    }
  }
  
  if (validFiles.length === 0) {
    // Show error message to user
    console.error('No valid PDF files found in drop');
    return;
  }
  
  const newFiles: FileItem[] = [];
  
  for (const file of validFiles) {
    const fileItem: FileItem = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/pdf',
      file: file,
      status: 'pending',
    };
      
    // Try to get analysis data
    try {
      const analysis = await APIClient.analyzeFile(file, {
        analysisType: 'compression-potential',
        includeMetadata: false
      });
      
      if (analysis.success && analysis.analysis) {
        fileItem.compressedSize = analysis.analysis.estimatedCompression?.estimatedSize;
        fileItem.compressionRatio = 1 - (analysis.analysis.compressionPotential || 0);
      }
    } catch (error) {
      console.warn('Failed to analyze file:', error);
    }
    
    newFiles.push(fileItem);
  }
  
  setFiles(prev => [...prev, ...newFiles]);
}, []);


  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

// Updated compression handler using the new API client
const startCompression = useCallback(async () => {
  if (isLoading || !user) return;
  if (files.length > 1 && user.Subscription?.plan !== 'PRO' && user.Subscription?.plan !== 'ENTERPRISE') {
    alert('Bulk compression is a PRO feature. Please upgrade.');
    return;
  }
  const todo = files.filter(f => f.status === 'pending' && f.file);
  if (!todo.length) return;

  setIsProcessing(true);
  setProgress(0);

  try {
    for (const item of todo) {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f));

      const fd = new FormData();
      fd.append('file', item.file!);
      fd.append('compressionLevel', settings.compressionLevel);
      fd.append('imageQuality', String(settings.imageQuality));

      const blob = await runJobAndGetBlob('/compress', fd, setProgress);

      const cSize = blob.size;
      setFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: 'completed',
        compressedSize: cSize,
        compressionRatio: 1 - cSize / item.size,
        compressedBlob: blob,
      } : f));
      setProgress(100);
    }
  } catch (e: any) {
    todo.forEach(item =>
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: e.message } : f))
    );
  } finally {
    setIsProcessing(false);
  }
}, [files, settings, user, isLoading]);


  const downloadFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.compressedBlob) {
      const url = URL.createObjectURL(file.compressedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '_compressed.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [files]);

  const downloadBulkFiles = useCallback(() => {
    if (bulkCompressedBlob) {
      const url = URL.createObjectURL(bulkCompressedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed_files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [bulkCompressedBlob]);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setProgress(0);
  }, []);


  const handleConvertDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    const newFiles: ConvertFileItem[] = pdfFiles.map(file => ({
      id: `convert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Store the actual File object
      status: 'pending' as const,
    }));
    
    setConvertFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeConvertFile = useCallback((fileId: string) => {
    setConvertFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);


const startConversion = useCallback(async () => {
  const todo = convertFiles.filter(f => f.status === 'pending' && f.file);
  if (!todo.length) return;

  setIsConverting(true);
  setConvertProgress(0);

  try {
    let done = 0;
    for (const item of todo) {
      setConvertFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f));

      const fd = new FormData();
      fd.append('file', item.file!);
      fd.append('format', convertSettings.format);
      fd.append('quality', convertSettings.quality);
      fd.append('preserveFormatting', String(convertSettings.preserveFormatting));
      fd.append('extractImages', String(convertSettings.extractImages));

      const blob = await runJobAndGetBlob('/convert', fd, setConvertProgress);

      setConvertFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: 'completed',
        format: convertSettings.format,
        convertedSize: blob.size,
        convertedBlob: blob,
      } : f));

      done++;
      setConvertProgress((done / todo.length) * 100);
    }
  } catch (e: any) {
    todo.forEach(item =>
      setConvertFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: e.message } : f))
    );
  } finally {
    setIsConverting(false);
  }
}, [convertFiles, convertSettings]);


// Updated file upload handlers for convert tab
const handleConvertFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = Array.from(event.target.files || []);
  const validFiles: ConvertFileItem[] = [];
  
  for (const file of selectedFiles) {
    const validation = APIClient.validateFile(file);
    if (validation.isValid) {
      validFiles.push({
        id: `convert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/pdf',
        file: file, // Store the actual File object
        status: 'pending',
      });
    } else {
      console.warn(`Invalid file ${file.name}: ${validation.error}`);
    }
  }
  
  setConvertFiles(prev => [...prev, ...validFiles]);
}, []);

  const downloadConvertFile = useCallback((fileId: string) => {
    const file = convertFiles.find(f => f.id === fileId);
    if (file && file.convertedBlob) {
      const url = URL.createObjectURL(file.convertedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', `.${file.format}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [convertFiles]);

  const clearConvertFiles = useCallback(() => {
    setConvertFiles([]);
    setConvertProgress(0);
  }, []);

  const handleOCRFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: OCRFileItem[] = selectedFiles.map(file => ({
      id: `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Store the actual File object
      status: 'pending' as const,
    }));
    
    setOcrFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleOCRDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    const newFiles: OCRFileItem[] = pdfFiles.map(file => ({
      id: `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Store the actual File object
      status: 'pending' as const,
    }));
    
    setOcrFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeOCRFile = useCallback((fileId: string) => {
    setOcrFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

const startOCR = useCallback(async () => {
  const todo = ocrFiles.filter(f => f.status === 'pending' && f.file);
  if (!todo.length) return;

  setIsOCRProcessing(true);
  setOcrProgress(0);

  try {
    let done = 0;
    for (const item of todo) {
      setOcrFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f));

      const fd = new FormData();
      fd.append('file', item.file!);
      fd.append('language', ocrSettings.language);
      fd.append('outputFormat', ocrSettings.outputFormat);
      fd.append('preserveLayout', String(ocrSettings.preserveLayout));
      fd.append('confidence', String(ocrSettings.confidence));

      const blob = await runJobAndGetBlob('/ocr', fd, setOcrProgress);

      setOcrFiles(prev => prev.map(f => f.id === item.id ? {
        ...f,
        status: 'completed',
        confidence: ocrSettings.confidence,
        processedBlob: blob,
      } : f));

      done++;
      setOcrProgress((done / todo.length) * 100);
    }
  } catch (e: any) {
    todo.forEach(item =>
      setOcrFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: e.message } : f))
    );
  } finally {
    setIsOCRProcessing(false);
  }
}, [ocrFiles, ocrSettings]);

  const downloadOCRFile = useCallback((fileId: string) => {
    const file = ocrFiles.find(f => f.id === fileId);
    if (file && file.processedBlob) {
      const url = URL.createObjectURL(file.processedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', '_ocr.pdf');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [ocrFiles]);

  const clearOCRFiles = useCallback(() => {
    setOcrFiles([]);
    setOcrProgress(0);
  }, []);

  const handleAIFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: AIFileItem[] = selectedFiles.map(file => ({
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Store the actual File object
      status: 'pending' as const,
    }));
    
    setAiFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleAIDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    const newFiles: AIFileItem[] = pdfFiles.map(file => ({
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Store the actual File object
      status: 'pending' as const,
    }));
    
    setAiFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeAIFile = useCallback((fileId: string) => {
    setAiFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const startAIProcessing = useCallback(async () => {
    if (aiFiles.length === 0) return;
    
    setIsAIProcessing(true);
    setAiProgress(0);
    
    try {
      const totalFiles = aiFiles.filter(f => f.status === 'pending').length;
      let processedFiles = 0;
      
      for (const file of aiFiles) {
        if (file.status !== 'pending') continue;
        
        setAiFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing' as const }
            : f
        ));
        
        try {
          if (!file.file) {
            throw new Error('File object not found');
          }
          
          const formData = new FormData();
          formData.append('file', file.file);
          formData.append('tool', aiSettings.tool);
          formData.append('detailLevel', aiSettings.detailLevel);
          
          if (aiSettings.targetLanguage) {
            formData.append('targetLanguage', aiSettings.targetLanguage);
          }
          
          if (aiSettings.maxLength) {
            formData.append('maxLength', aiSettings.maxLength.toString());
          }
          
          const response = await fetch('/api/ai-tools', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`AI processing failed: ${response.statusText}`);
          }
          
          const processedBlob = await response.blob();
          
          setAiFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'completed' as const,
                  processedBlob,
                }
              : f
          ));
          
        } catch (error) {
          console.error(`Failed to process AI for ${file.name}:`, error);
          setAiFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' }
              : f
          ));
        }
        
        processedFiles++;
        setAiProgress((processedFiles / totalFiles) * 100);
      }
      
    } catch (error) {
      console.error('AI process failed:', error);
    } finally {
      setIsAIProcessing(false);
    }
  }, [aiFiles, aiSettings]);

  const downloadAIFile = useCallback((fileId: string) => {
    const file = aiFiles.find(f => f.id === fileId);
    if (file && file.processedBlob) {
      const url = URL.createObjectURL(file.processedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.pdf', `_${aiSettings.tool}.txt`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [aiFiles, aiSettings]);

  const clearAIFiles = useCallback(() => {
    setAiFiles([]);
    setAiProgress(0);
  }, []);

  const loadManagedFiles = useCallback(async () => {
    try {
      const response = await fetch('/api/files?action=list');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setManagedFiles(data.files);
        }
      }
    } catch (error) {
      console.error('Failed to load managed files:', error);
    }
  }, []);

  const loadStorageInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/files?action=storage');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStorageInfo(data.storage);
        }
      }
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  }, []);

  const downloadManagedFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/api/files?action=download&fileId=${fileId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `file_${fileId}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  }, []);

  const deleteManagedFile = useCallback(async (fileId: string) => {
    const file = managedFiles.find(f => f.id === fileId);
    if (file && confirm(`Delete "${file.name}"?`)) {
      try {
        const response = await fetch(`/api/files?fileId=${fileId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await loadManagedFiles();
          await loadStorageInfo();
        }
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  }, [managedFiles, loadManagedFiles, loadStorageInfo]);

  const clearAllFiles = useCallback(async () => {
    if (confirm('Delete all files? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/files?action=clear', {
          method: 'DELETE',
        });
        if (response.ok) {
          await loadManagedFiles();
          await loadStorageInfo();
        }
      } catch (error) {
        console.error('Failed to clear files:', error);
      }
    }
  }, [loadManagedFiles, loadStorageInfo]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getCompressionLevelDescription = (level: string) => {
    switch (level) {
      case 'low': return 'Best Quality';
      case 'medium': return 'Balanced';
      case 'high': return 'Smaller Size';
      case 'maximum': return 'Smallest Size';
      default: return level;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold">PDFSmaller</h1>
          </div>
          <p className="text-base sm:text-xl text-muted-foreground">
            Advanced PDF Processing Suite
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="compress" className="text-xs sm:text-sm">Compress</TabsTrigger>
            <TabsTrigger value="convert" className="text-xs sm:text-sm">Convert</TabsTrigger>
            <TabsTrigger value="ocr" className="text-xs sm:text-sm">OCR</TabsTrigger>
            <TabsTrigger value="ai-tools" className="text-xs sm:text-sm">AI Tools</TabsTrigger>
            {/* <TabsTrigger value="files" className="text-xs sm:text-sm">Files</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger> */}
          </TabsList>

          <TabsContent value="compress" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload PDF Files
                  </CardTitle>
                  <CardDescription>
                    Drag and drop your PDF files or click to browse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                      Drop PDF files here or click to browse
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Supports PDF files up to 50MB
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="font-medium">Selected Files:</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((file) => (
                          <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted rounded-lg gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{file.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {formatFileSize(file.size)}
                                  {file.compressedSize && (
                                    <span className="ml-2">
                                      → {formatFileSize(file.compressedSize)} 
                                      ({Math.round((1 - file.compressionRatio!) * 100)}% smaller{file.status === 'pending' ? ' estimated' : ''})
                                    </span>
                                  )}
                                  {file.error && (
                                    <span className="ml-2 text-red-500 block sm:inline">
                                      Error: {file.error}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                                {file.status}
                              </Badge>
                              {file.status === 'completed' && file.compressedBlob && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadFile(file.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFile(file.id)}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={startCompression}
                        disabled={isProcessing || files.some(f => f.status === 'processing')}
                        className="flex-1 w-full sm:w-auto"
                      >
                        {isProcessing ? 'Processing...' : 'Start Compression'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearFiles}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
                      >
                        Clear All
                      </Button>
                      {bulkCompressedBlob && (
                        <Button
                            onClick={downloadBulkFiles}
                            className="flex-1 w-full sm:w-auto"
                        >
                            Download All (.zip)
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Compression Settings
                  </CardTitle>
                  <CardDescription>
                    Choose your desired compression level
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quality vs. Size</label>
                    <Select
                      value={settings.compressionLevel}
                      onValueChange={(value: any) => 
                        setSettings(prev => ({ ...prev, compressionLevel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          <div className="flex flex-col">
                            <span className="font-medium">Low (Best Quality)</span>
                            <span className="text-xs text-muted-foreground">Minimal compression, highest quality</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="medium">
                          <div className="flex flex-col">
                            <span className="font-medium">Medium (Balanced)</span>
                            <span className="text-xs text-muted-foreground">Good balance of size and quality</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="high">
                          <div className="flex flex-col">
                            <span className="font-medium">High (Smaller Size)</span>
                            <span className="text-xs text-muted-foreground">Significant size reduction</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="maximum">
                          <div className="flex flex-col">
                            <span className="font-medium">Maximum (Smallest Size)</span>
                            <span className="text-xs text-muted-foreground">Maximum compression, lower quality</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Image Quality: {settings.imageQuality}%
                    </label>
                    <Slider
                      value={[settings.imageQuality]}
                      onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, imageQuality: value[0] }))
                      }
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Lower quality</span>
                      <span>Higher quality</span>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Current Settings:</h4>
                    <div className="space-y-1 text-sm">
                      <p>Compression Level: {getCompressionLevelDescription(settings.compressionLevel)}</p>
                      <p>Image Quality: {settings.imageQuality}%</p>
                      <p>Files Ready: {files.filter(f => f.status === 'pending').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="convert">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Convert PDF Files
                  </CardTitle>
                  <CardDescription>
                    Transform your PDFs into editable formats
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                    onDrop={handleConvertDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('convert-file-input')?.click()}
                  >
                    <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                      Drop PDF files here or click to browse
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Supports PDF files up to 50MB
                    </p>
                    <input
                      id="convert-file-input"
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleConvertFileUpload}
                    />
                  </div>

                  {convertFiles.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="font-medium">Files to Convert:</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {convertFiles.map((file) => (
                          <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted rounded-lg gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{file.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {formatFileSize(file.size)}
                                  {file.convertedSize && (
                                    <span className="ml-2">
                                      → {formatFileSize(file.convertedSize)} 
                                      ({file.format})
                                    </span>
                                  )}
                                  {file.error && (
                                    <span className="ml-2 text-red-500 block sm:inline">
                                      Error: {file.error}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                                {file.status}
                              </Badge>
                              {file.status === 'completed' && file.convertedBlob && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadConvertFile(file.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeConvertFile(file.id)}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isConverting && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Converting...</span>
                        <span>{Math.round(convertProgress)}%</span>
                      </div>
                      <Progress value={convertProgress} />
                    </div>
                  )}

                  {convertFiles.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={startConversion}
                        disabled={isConverting || convertFiles.some(f => f.status === 'processing')}
                        className="flex-1 w-full sm:w-auto"
                      >
                        {isConverting ? 'Converting...' : 'Start Conversion'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearConvertFiles}
                        disabled={isConverting}
                        className="w-full sm:w-auto"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Conversion Settings
                  </CardTitle>
                  <CardDescription>
                    Choose output format and quality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Output Format</label>
                    <Select
                      value={convertSettings.format}
                      onValueChange={(value: any) => 
                        setConvertSettings(prev => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="docx">Word Document (.docx)</SelectItem>
                        <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                        <SelectItem value="html">HTML (.html)</SelectItem>
                        <SelectItem value="images">Images (.html)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quality</label>
                    <Select
                      value={convertSettings.quality}
                      onValueChange={(value: any) => 
                        setConvertSettings(prev => ({ ...prev, quality: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (Faster)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="high">High (Best Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="preserve-formatting"
                          checked={convertSettings.preserveFormatting}
                          onChange={(e) => 
                            setConvertSettings(prev => ({ ...prev, preserveFormatting: e.target.checked }))
                          }
                          className="rounded"
                        />
                        <label htmlFor="preserve-formatting" className="text-sm">
                          Preserve formatting
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="extract-images"
                          checked={convertSettings.extractImages}
                          onChange={(e) => 
                            setConvertSettings(prev => ({ ...prev, extractImages: e.target.checked }))
                          }
                          className="rounded"
                        />
                        <label htmlFor="extract-images" className="text-sm">
                          Extract images
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Current Settings:</h4>
                    <div className="space-y-1 text-sm">
                      <p>Format: {convertSettings.format.toUpperCase()}</p>
                      <p>Quality: {convertSettings.quality}</p>
                      <p>Files Ready: {convertFiles.filter(f => f.status === 'pending').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ocr">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    OCR Processing
                  </CardTitle>
                  <CardDescription>
                    Extract text from scanned documents and images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                    onDrop={handleOCRDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('ocr-file-input')?.click()}
                  >
                    <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                      Drop PDF files here or click to browse
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Supports PDF files up to 50MB
                    </p>
                    <input
                      id="ocr-file-input"
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleOCRFileUpload}
                    />
                  </div>

                  {ocrFiles.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="font-medium">Files to Process:</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {ocrFiles.map((file) => (
                          <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted rounded-lg gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{file.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {formatFileSize(file.size)}
                                  {file.confidence && (
                                    <span className="ml-2">
                                      Confidence: {Math.round(file.confidence)}%
                                    </span>
                                  )}
                                  {file.error && (
                                    <span className="ml-2 text-red-500 block sm:inline">
                                      Error: {file.error}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                                {file.status}
                              </Badge>
                              {file.status === 'completed' && file.processedBlob && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadOCRFile(file.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeOCRFile(file.id)}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isOCRProcessing && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing OCR...</span>
                        <span>{Math.round(ocrProgress)}%</span>
                      </div>
                      <Progress value={ocrProgress} />
                    </div>
                  )}

                  {ocrFiles.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={startOCR}
                        disabled={isOCRProcessing || ocrFiles.some(f => f.status === 'processing')}
                        className="flex-1 w-full sm:w-auto"
                      >
                        {isOCRProcessing ? 'Processing...' : 'Start OCR'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearOCRFiles}
                        disabled={isOCRProcessing}
                        className="w-full sm:w-auto"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    OCR Settings
                  </CardTitle>
                  <CardDescription>
                    Configure text extraction options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <Select
                      value={ocrSettings.language}
                      onValueChange={(value: any) => 
                        setOcrSettings(prev => ({ ...prev, language: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ru">Russian</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Output Format</label>
                    <Select
                      value={ocrSettings.outputFormat}
                      onValueChange={(value: any) => 
                        setOcrSettings(prev => ({ ...prev, outputFormat: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="txt">Plain Text (.txt)</SelectItem>
                        <SelectItem value="pdf">Annotated PDF (.pdf)</SelectItem>
                        <SelectItem value="docx">Word Document (.docx)</SelectItem>
                        <SelectItem value="searchable-pdf">Searchable PDF (.pdf)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Confidence: {ocrSettings.confidence}%
                    </label>
                    <Slider
                      value={[ocrSettings.confidence]}
                      onValueChange={(value) => 
                        setOcrSettings(prev => ({ ...prev, confidence: value[0] }))
                      }
                      min={50}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Lower confidence</span>
                      <span>Higher confidence</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="preserve-layout"
                        checked={ocrSettings.preserveLayout}
                        onChange={(e) => 
                          setOcrSettings(prev => ({ ...prev, preserveLayout: e.target.checked }))
                        }
                        className="rounded"
                      />
                      <label htmlFor="preserve-layout" className="text-sm">
                        Preserve document layout
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Current Settings:</h4>
                    <div className="space-y-1 text-sm">
                      <p>Language: {ocrSettings.language.toUpperCase()}</p>
                      <p>Output: {ocrSettings.outputFormat}</p>
                      <p>Confidence: {ocrSettings.confidence}%</p>
                      <p>Files Ready: {ocrFiles.filter(f => f.status === 'pending').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-tools">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    AI Tools
                  </CardTitle>
                  <CardDescription>
                    Leverage AI to analyze and enhance your documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                    onDrop={handleAIDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('ai-file-input')?.click()}
                  >
                    <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
                    <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                      Drop PDF files here or click to browse
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Supports PDF files up to 50MB
                    </p>
                    <input
                      id="ai-file-input"
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleAIFileUpload}
                    />
                  </div>

                  {aiFiles.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="font-medium">Files to Process:</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {aiFiles.map((file) => (
                          <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted rounded-lg gap-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base truncate">{file.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {formatFileSize(file.size)}
                                  {file.error && (
                                    <span className="ml-2 text-red-500 block sm:inline">
                                      Error: {file.error}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                                {file.status}
                              </Badge>
                              {file.status === 'completed' && file.processedBlob && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadAIFile(file.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeAIFile(file.id)}
                                className="h-8 w-8 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isAIProcessing && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing AI...</span>
                        <span>{Math.round(aiProgress)}%</span>
                      </div>
                      <Progress value={aiProgress} />
                    </div>
                  )}

                  {aiFiles.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={startAIProcessing}
                        disabled={isAIProcessing || aiFiles.some(f => f.status === 'processing')}
                        className="flex-1 w-full sm:w-auto"
                      >
                        {isAIProcessing ? 'Processing...' : 'Start AI Processing'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearAIFiles}
                        disabled={isAIProcessing}
                        className="w-full sm:w-auto"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    AI Tool Settings
                  </CardTitle>
                  <CardDescription>
                    Configure AI processing options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Tool</label>
                    <Select
                      value={aiSettings.tool}
                      onValueChange={(value: any) => 
                        setAiSettings(prev => ({ ...prev, tool: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summarize">Summarize Document</SelectItem>
                        <SelectItem value="translate">Translate Text</SelectItem>
                        <SelectItem value="extract-keywords">Extract Keywords</SelectItem>
                        <SelectItem value="analyze-sentiment">Analyze Sentiment</SelectItem>
                        <SelectItem value="generate-questions">Generate Questions</SelectItem>
                        <SelectItem value="categorize">Categorize Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Detail Level</label>
                    <Select
                      value={aiSettings.detailLevel}
                      onValueChange={(value: any) => 
                        setAiSettings(prev => ({ ...prev, detailLevel: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {aiSettings.tool === 'translate' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Language</label>
                      <Select
                        value={aiSettings.targetLanguage || 'en'}
                        onValueChange={(value: any) => 
                          setAiSettings(prev => ({ ...prev, targetLanguage: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="it">Italian</SelectItem>
                          <SelectItem value="pt">Portuguese</SelectItem>
                          <SelectItem value="ru">Russian</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                          <SelectItem value="ko">Korean</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(aiSettings.tool === 'summarize' || aiSettings.tool === 'extract-keywords') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Max Length: {aiSettings.maxLength || 1000}
                      </label>
                      <Slider
                        value={[aiSettings.maxLength || 1000]}
                        onValueChange={(value) => 
                          setAiSettings(prev => ({ ...prev, maxLength: value[0] }))
                        }
                        min={100}
                        max={10000}
                        step={100}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Current Settings:</h4>
                    <div className="space-y-1 text-sm">
                      <p>Tool: {aiSettings.tool.replace('-', ' ')}</p>
                      <p>Detail: {aiSettings.detailLevel}</p>
                      {aiSettings.targetLanguage && (
                        <p>Language: {aiSettings.targetLanguage.toUpperCase()}</p>
                      )}
                      {aiSettings.maxLength && (
                        <p>Max Length: {aiSettings.maxLength}</p>
                      )}
                      <p>Files Ready: {aiFiles.filter(f => f.status === 'pending').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* <TabsContent value="files">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    File Manager
                  </CardTitle>
                  <CardDescription>
                    Manage your processed files and storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {storageInfo && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{storageInfo.totalFiles}</div>
                          <p className="text-xs text-muted-foreground">Total Files</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{storageInfo.formattedTotalSize}</div>
                          <p className="text-xs text-muted-foreground">Total Size</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">{Object.keys(storageInfo.filesByCategory || {}).length}</div>
                          <p className="text-xs text-muted-foreground">Categories</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-2xl font-bold">
                            {storageInfo.formattedNewestFile ? 'Active' : 'Empty'}
                          </div>
                          <p className="text-xs text-muted-foreground">Status</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button variant="outline" onClick={loadManagedFiles}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button variant="outline" onClick={clearAllFiles}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium">Stored Files</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {managedFiles.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No files stored yet</p>
                          <p className="text-sm">Process some files to see them here</p>
                        </div>
                      ) : (
                        managedFiles
                          .filter(file => 
                            searchQuery === '' || 
                            file.name.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((file) => (
                            <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted rounded-lg gap-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm sm:text-base truncate">{file.name}</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {formatFileSize(file.size)} • {file.category} • 
                                    {new Date(file.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant={file.status === 'available' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                                  {file.status}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadManagedFile(file.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteManagedFile(file.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  ×
                                </Button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Application Settings
                </CardTitle>
                <CardDescription>
                  Configure application preferences and options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Settings functionality coming soon...</p>
                  <p className="text-sm">Configure preferences, storage limits, and more</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}