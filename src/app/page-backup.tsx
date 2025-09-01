'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, Download, FileText, Settings, Zap } from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  compressedSize?: number;
  compressionRatio?: number;
  compressedBlob?: Blob;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface CompressionSettings {
  compressionLevel: 'low' | 'medium' | 'high' | 'maximum';
  imageQuality: number;
  optimizationStrategy?: 'balanced' | 'text' | 'image' | 'aggressive';
}

interface ConvertSettings {
  targetFormat: 'docx' | 'xlsx' | 'html' | 'txt';
  preserveLayout: boolean;
  extractTables: boolean;
  includeImages: boolean;
  quality: 'high' | 'medium' | 'low';
}

interface OCRSettings {
  language: 'english' | 'spanish' | 'french' | 'german' | 'auto';
  outputFormat: 'text' | 'searchable-pdf' | 'word';
  preserveLayout: boolean;
  enhanceImage: boolean;
  confidence: number;
}

interface AIToolSettings {
  selectedTool: 'summarize' | 'extract-keywords' | 'translate' | 'analyze-sentiment' | 'generate-questions';
  targetLanguage?: 'english' | 'spanish' | 'french' | 'german' | 'chinese';
  summaryLength: 'short' | 'medium' | 'long';
  includeKeywords: boolean;
  confidence: number;
}

interface FileManagerFile {
  id: string;
  name: string;
  size: number;
  type: 'original' | 'compressed' | 'converted' | 'ocr' | 'ai-processed';
  uploadedAt: Date;
  processedAt?: Date;
  status: 'available' | 'processing' | 'error';
  error?: string;
}

export default function Home() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState<CompressionSettings>({
    compressionLevel: 'medium',
    imageQuality: 80,
  });

  const [convertSettings, setConvertSettings] = useState<ConvertSettings>({
    targetFormat: 'docx',
    preserveLayout: true,
    extractTables: true,
    includeImages: true,
    quality: 'high',
  });

  const [ocrSettings, setOCRSettings] = useState<OCRSettings>({
    language: 'auto',
    outputFormat: 'text',
    preserveLayout: true,
    enhanceImage: true,
    confidence: 85,
  });

  const [aiToolSettings, setAIToolSettings] = useState<AIToolSettings>({
    selectedTool: 'summarize',
    summaryLength: 'medium',
    includeKeywords: true,
    confidence: 80,
  });

  const [managedFiles, setManagedFiles] = useState<FileManagerFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'original' | 'compressed' | 'converted' | 'ocr' | 'ai-processed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'uploadedAt'>('uploadedAt');

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: FileItem[] = [];
    
    for (const file of selectedFiles) {
      const fileItem: FileItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
      };
      
      // Analyze the file for compression potential
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const analysis = await response.json();
          if (analysis.success) {
            // Add analysis data to the file item
            fileItem.compressedSize = analysis.analysis.estimatedCompression.estimatedSize;
            fileItem.compressionRatio = 1 - analysis.analysis.compressionPotential;
          }
        }
      } catch (error) {
        console.warn('Failed to analyze file:', error);
      }
      
      newFiles.push(fileItem);
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    const newFiles: FileItem[] = [];
    
    for (const file of pdfFiles) {
      const fileItem: FileItem = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
      };
      
      // Analyze the file for compression potential
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const analysis = await response.json();
          if (analysis.success) {
            // Add analysis data to the file item
            fileItem.compressedSize = analysis.analysis.estimatedCompression.estimatedSize;
            fileItem.compressionRatio = 1 - analysis.analysis.compressionPotential;
          }
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

  const startCompression = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const totalFiles = files.filter(f => f.status === 'pending').length;
      let processedFiles = 0;
      
      for (const file of files) {
        if (file.status !== 'pending') continue;
        
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing' as const }
            : f
        ));
        
        try {
          // Create form data for API request
          const formData = new FormData();
          formData.append('file', new Blob([await file.arrayBuffer()]), file.name);
          formData.append('compressionLevel', settings.compressionLevel);
          formData.append('imageQuality', settings.imageQuality.toString());
          
          // Send to compression API
          const response = await fetch('/api/compress', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Compression failed: ${response.statusText}`);
          }
          
          // Get compression results from headers
          const originalSize = parseInt(response.headers.get('X-Original-Size') || '0');
          const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0');
          const compressionRatio = parseFloat(response.headers.get('X-Compression-Ratio') || '1');
          const reductionPercent = parseFloat(response.headers.get('X-Reduction-Percent') || '0');
          
          // Get compressed file blob
          const compressedBlob = await response.blob();
          
          // Update file status to completed
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { 
                  ...f, 
                  status: 'completed' as const,
                  compressedSize,
                  compressionRatio,
                  compressedBlob,
                }
              : f
          ));
          
        } catch (error) {
          console.error(`Failed to compress ${file.name}:`, error);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' }
              : f
          ));
        }
        
        processedFiles++;
        setProgress((processedFiles / totalFiles) * 100);
      }
      
    } catch (error) {
      console.error('Compression process failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files, settings]);

  const downloadFile = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file && file.compressedBlob) {
      // Create download link
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

  const clearFiles = useCallback(() => {
    setFiles([]);
    setProgress(0);
  }, []);

  const startConversion = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const totalFiles = files.filter(f => f.status === 'pending').length;
      let processedFiles = 0;
      
      for (const file of files) {
        if (file.status !== 'pending') continue;
        
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing' as const }
            : f
        ));
        
        try {
          // Simulate conversion process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Update file status to completed
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'completed' as const }
              : f
          ));
          
        } catch (error) {
          console.error(`Failed to convert ${file.name}:`, error);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' }
              : f
          ));
        }
        
        processedFiles++;
        setProgress((processedFiles / totalFiles) * 100);
      }
      
    } catch (error) {
      console.error('Conversion process failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const startOCR = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const totalFiles = files.filter(f => f.status === 'pending').length;
      let processedFiles = 0;
      
      for (const file of files) {
        if (file.status !== 'pending') continue;
        
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing' as const }
            : f
        ));
        
        try {
          // Simulate OCR process
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Update file status to completed
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'completed' as const }
              : f
          ));
          
        } catch (error) {
          console.error(`Failed to process OCR for ${file.name}:`, error);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' }
              : f
          ));
        }
        
        processedFiles++;
        setProgress((processedFiles / totalFiles) * 100);
      }
      
    } catch (error) {
      console.error('OCR process failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  const startAITools = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const totalFiles = files.filter(f => f.status === 'pending').length;
      let processedFiles = 0;
      
      for (const file of files) {
        if (file.status !== 'pending') continue;
        
        // Update file status to processing
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'processing' as const }
            : f
        ));
        
        try {
          // Simulate AI processing
          await new Promise(resolve => setTimeout(resolve, 4000));
          
          // Update file status to completed
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'completed' as const }
              : f
          ));
          
        } catch (error) {
          console.error(`Failed to process AI tool for ${file.name}:`, error);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error' as const, error: error instanceof Error ? error.message : 'Unknown error' }
              : f
          ));
        }
        
        processedFiles++;
        setProgress((processedFiles / totalFiles) * 100);
      }
      
    } catch (error) {
      console.error('AI tools process failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

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

  // File Manager functions
  const getFilteredAndSortedFiles = () => {
    let filtered = [...managedFiles];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(file => file.type === filterType);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'uploadedAt':
        default:
          aValue = a.uploadedAt.getTime();
          bValue = b.uploadedAt.getTime();
          break;
      }
      
      return aValue < bValue ? 1 : -1; // Descending order
    });
    
    return filtered;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'original': return '📄';
      case 'compressed': return '🗜️';
      case 'converted': return '🔄';
      case 'ocr': return '👁️';
      case 'ai-processed': return '🤖';
      default: return '📄';
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'original': return 'bg-blue-100 text-blue-800';
      case 'compressed': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'ocr': return 'bg-yellow-100 text-yellow-800';
      case 'ai-processed': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshFileManager = () => {
    // Simulate loading files
    const mockFiles: FileManagerFile[] = [
      {
        id: '1',
        name: 'document.pdf',
        size: 2048576,
        type: 'original',
        uploadedAt: new Date(Date.now() - 86400000),
        status: 'available'
      },
      {
        id: '2',
        name: 'document_compressed.pdf',
        size: 1024000,
        type: 'compressed',
        uploadedAt: new Date(Date.now() - 43200000),
        processedAt: new Date(Date.now() - 3600000),
        status: 'available'
      },
      {
        id: '3',
        name: 'presentation.pdf',
        size: 5242880,
        type: 'original',
        uploadedAt: new Date(Date.now() - 172800000),
        status: 'available'
      }
    ];
    setManagedFiles(mockFiles);
  };

  const downloadManagedFile = (fileId: string) => {
    const file = managedFiles.find(f => f.id === fileId);
    if (file) {
      console.log(`Downloading ${file.name}`);
      // Simulate download
    }
  };

  const deleteManagedFile = (fileId: string) => {
    const file = managedFiles.find(f => f.id === fileId);
    if (file && confirm(`Delete "${file.name}"?`)) {
      setManagedFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  const clearAllFiles = () => {
    if (managedFiles.length === 0) return;
    if (confirm(`Delete all ${managedFiles.length} files?`)) {
      setManagedFiles([]);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-4xl font-bold">PDFSmaller</h1>
          </div>
          <p className="text-base sm:text-xl text-muted-foreground">
            Advanced PDF Compression with Client-Side Processing
          </p>
        </div>

        <Tabs defaultValue="compress" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="compress" className="text-xs sm:text-sm">Compress</TabsTrigger>
            <TabsTrigger value="convert" className="text-xs sm:text-sm">Convert</TabsTrigger>
            <TabsTrigger value="ocr" className="text-xs sm:text-sm">OCR</TabsTrigger>
            <TabsTrigger value="ai-tools" className="text-xs sm:text-sm">AI Tools</TabsTrigger>
            <TabsTrigger value="files" className="text-xs sm:text-sm">Files</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="compress" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Upload Section */}
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

                  {/* File List */}
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

                  {/* Progress */}
                  {isProcessing && (
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  {/* Action Buttons */}
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
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings Panel */}
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Optimization Strategy</label>
                    <Select
                      value={settings.optimizationStrategy || 'balanced'}
                      onValueChange={(value: any) => 
                        setSettings(prev => ({ ...prev, optimizationStrategy: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                        <SelectItem value="text">Text-Optimized</SelectItem>
                        <SelectItem value="image">Image-Optimized</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Current Settings:</h4>
                    <div className="space-y-1 text-sm">
                      <p>Compression Level: {getCompressionLevelDescription(settings.compressionLevel)}</p>
                      <p>Image Quality: {settings.imageQuality}%</p>
                      <p>Optimization: {settings.optimizationStrategy || 'balanced'}</p>
                      <p>Files Ready: {files.filter(f => f.status === 'pending').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="convert">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Convert PDF
                </CardTitle>
                <CardDescription>
                  Transform your PDFs into editable formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Upload Section */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Upload PDF Files</CardTitle>
                      <CardDescription>
                        Select PDF files to convert to other formats
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                        onDrop={handleDrop}
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
                          onChange={handleFileUpload}
                        />
                      </div>

                      {/* File List */}
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
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
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
                    </CardContent>
                  </Card>

                  {/* Conversion Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion Settings</CardTitle>
                      <CardDescription>
                        Choose target format and options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Target Format</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={convertSettings.targetFormat === 'docx' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConvertSettings(prev => ({ ...prev, targetFormat: 'docx' }))}
                            className="flex flex-col items-center gap-1 h-auto py-3"
                          >
                            <span className="text-lg">📄</span>
                            <span className="text-xs">Word</span>
                            <span className="text-xs text-muted-foreground">.docx</span>
                          </Button>
                          <Button
                            variant={convertSettings.targetFormat === 'xlsx' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConvertSettings(prev => ({ ...prev, targetFormat: 'xlsx' }))}
                            className="flex flex-col items-center gap-1 h-auto py-3"
                          >
                            <span className="text-lg">📊</span>
                            <span className="text-xs">Excel</span>
                            <span className="text-xs text-muted-foreground">.xlsx</span>
                          </Button>
                          <Button
                            variant={convertSettings.targetFormat === 'html' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConvertSettings(prev => ({ ...prev, targetFormat: 'html' }))}
                            className="flex flex-col items-center gap-1 h-auto py-3"
                          >
                            <span className="text-lg">🌐</span>
                            <span className="text-xs">HTML</span>
                            <span className="text-xs text-muted-foreground">.html</span>
                          </Button>
                          <Button
                            variant={convertSettings.targetFormat === 'txt' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setConvertSettings(prev => ({ ...prev, targetFormat: 'txt' }))}
                            className="flex flex-col items-center gap-1 h-auto py-3"
                          >
                            <span className="text-lg">📝</span>
                            <span className="text-xs">Text</span>
                            <span className="text-xs text-muted-foreground">.txt</span>
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium">Conversion Options</label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="preserveLayout"
                              checked={convertSettings.preserveLayout}
                              onChange={(e) => setConvertSettings(prev => ({ ...prev, preserveLayout: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor="preserveLayout" className="text-sm">Preserve Layout</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="extractTables"
                              checked={convertSettings.extractTables}
                              onChange={(e) => setConvertSettings(prev => ({ ...prev, extractTables: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor="extractTables" className="text-sm">Extract Tables</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeImages"
                              checked={convertSettings.includeImages}
                              onChange={(e) => setConvertSettings(prev => ({ ...prev, includeImages: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor="includeImages" className="text-sm">Include Images</label>
                          </div>
                        </div>
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
                            <SelectItem value="high">High Quality</SelectItem>
                            <SelectItem value="medium">Medium Quality</SelectItem>
                            <SelectItem value="low">Low Quality (Smaller files)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Current Settings:</h4>
                        <div className="space-y-1 text-sm">
                          <p>Target Format: {convertSettings.targetFormat.toUpperCase()}</p>
                          <p>Quality: {convertSettings.quality}</p>
                          <p>Files Ready: {files.filter(f => f.status === 'pending').length}</p>
                        </div>
                      </div>

                      {files.length > 0 && (
                        <Button
                          onClick={startConversion}
                          disabled={isProcessing || files.some(f => f.status === 'processing')}
                          className="w-full"
                        >
                          {isProcessing ? 'Converting...' : `Convert to ${convertSettings.targetFormat.toUpperCase()}`}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ocr">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  OCR Processing
                </CardTitle>
                <CardDescription>
                  Extract text from scanned documents and images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Upload Section */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Upload Documents</CardTitle>
                      <CardDescription>
                        Upload scanned PDFs or images for text extraction
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => document.getElementById('ocr-file-input')?.click()}
                      >
                        <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
                        <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                          Drop documents here or click to browse
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Supports PDF, JPG, PNG up to 50MB
                        </p>
                        <input
                          id="ocr-file-input"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>

                      {/* File List */}
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
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
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
                    </CardContent>
                  </Card>

                  {/* OCR Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>OCR Settings</CardTitle>
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
                            setOCRSettings(prev => ({ ...prev, language: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto-detect</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="spanish">Spanish</SelectItem>
                            <SelectItem value="french">French</SelectItem>
                            <SelectItem value="german">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Output Format</label>
                        <Select
                          value={ocrSettings.outputFormat}
                          onValueChange={(value: any) => 
                            setOCRSettings(prev => ({ ...prev, outputFormat: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Plain Text</SelectItem>
                            <SelectItem value="searchable-pdf">Searchable PDF</SelectItem>
                            <SelectItem value="word">Word Document</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium">Options</label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="ocrPreserveLayout"
                              checked={ocrSettings.preserveLayout}
                              onChange={(e) => setOCRSettings(prev => ({ ...prev, preserveLayout: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor="ocrPreserveLayout" className="text-sm">Preserve Layout</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="enhanceImage"
                              checked={ocrSettings.enhanceImage}
                              onChange={(e) => setOCRSettings(prev => ({ ...prev, enhanceImage: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor="enhanceImage" className="text-sm">Enhance Image Quality</label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Confidence Threshold: {ocrSettings.confidence}%
                        </label>
                        <Slider
                          value={[ocrSettings.confidence]}
                          onValueChange={(value) => 
                            setOCRSettings(prev => ({ ...prev, confidence: value[0] }))
                          }
                          min={50}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Lower sensitivity</span>
                          <span>Higher accuracy</span>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Current Settings:</h4>
                        <div className="space-y-1 text-sm">
                          <p>Language: {ocrSettings.language}</p>
                          <p>Output: {ocrSettings.outputFormat}</p>
                          <p>Confidence: {ocrSettings.confidence}%</p>
                          <p>Files Ready: {files.filter(f => f.status === 'pending').length}</p>
                        </div>
                      </div>

                      {files.length > 0 && (
                        <Button
                          onClick={startOCR}
                          disabled={isProcessing || files.some(f => f.status === 'processing')}
                          className="w-full"
                        >
                          {isProcessing ? 'Processing OCR...' : 'Start OCR'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-tools">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Tools
                </CardTitle>
                <CardDescription>
                  Leverage AI to analyze and enhance your documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Upload Section */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Upload Documents</CardTitle>
                      <CardDescription>
                        Upload PDFs for AI-powered analysis and processing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => document.getElementById('ai-file-input')?.click()}
                      >
                        <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-muted-foreground" />
                        <p className="text-base sm:text-lg font-medium mb-1 sm:mb-2">
                          Drop documents here or click to browse
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
                          onChange={handleFileUpload}
                        />
                      </div>

                      {/* File List */}
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
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
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
                    </CardContent>
                  </Card>

                  {/* AI Tools Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Tools</CardTitle>
                      <CardDescription>
                        Select AI processing options
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Tool</label>
                        <div className="grid grid-cols-1 gap-2">
                          <Button
                            variant={aiToolSettings.selectedTool === 'summarize' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAIToolSettings(prev => ({ ...prev, selectedTool: 'summarize' }))}
                            className="justify-start h-auto py-3"
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-medium">📝 Summarize</span>
                              <span className="text-xs text-muted-foreground">Generate concise summaries</span>
                            </div>
                          </Button>
                          <Button
                            variant={aiToolSettings.selectedTool === 'extract-keywords' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAIToolSettings(prev => ({ ...prev, selectedTool: 'extract-keywords' }))}
                            className="justify-start h-auto py-3"
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-medium">🔍 Extract Keywords</span>
                              <span className="text-xs text-muted-foreground">Identify key terms</span>
                            </div>
                          </Button>
                          <Button
                            variant={aiToolSettings.selectedTool === 'translate' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAIToolSettings(prev => ({ ...prev, selectedTool: 'translate' }))}
                            className="justify-start h-auto py-3"
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-medium">🌐 Translate</span>
                              <span className="text-xs text-muted-foreground">Translate to other languages</span>
                            </div>
                          </Button>
                          <Button
                            variant={aiToolSettings.selectedTool === 'analyze-sentiment' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAIToolSettings(prev => ({ ...prev, selectedTool: 'analyze-sentiment' }))}
                            className="justify-start h-auto py-3"
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-medium">😊 Analyze Sentiment</span>
                              <span className="text-xs text-muted-foreground">Determine emotional tone</span>
                            </div>
                          </Button>
                          <Button
                            variant={aiToolSettings.selectedTool === 'generate-questions' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAIToolSettings(prev => ({ ...prev, selectedTool: 'generate-questions' }))}
                            className="justify-start h-auto py-3"
                          >
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-medium">❓ Generate Questions</span>
                              <span className="text-xs text-muted-foreground">Create Q&A pairs</span>
                            </div>
                          </Button>
                        </div>
                      </div>

                      {/* Dynamic settings based on selected tool */}
                      {aiToolSettings.selectedTool === 'summarize' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Summary Length</label>
                          <Select
                            value={aiToolSettings.summaryLength}
                            onValueChange={(value: any) => 
                              setAIToolSettings(prev => ({ ...prev, summaryLength: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                              <SelectItem value="medium">Medium (paragraph)</SelectItem>
                              <SelectItem value="long">Long (detailed)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {aiToolSettings.selectedTool === 'translate' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Target Language</label>
                          <Select
                            value={aiToolSettings.targetLanguage || 'english'}
                            onValueChange={(value: any) => 
                              setAIToolSettings(prev => ({ ...prev, targetLanguage: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="spanish">Spanish</SelectItem>
                              <SelectItem value="french">French</SelectItem>
                              <SelectItem value="german">German</SelectItem>
                              <SelectItem value="chinese">Chinese</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-3">
                        <label className="text-sm font-medium">Options</label>
                        {aiToolSettings.selectedTool === 'summarize' && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeKeywords"
                              checked={aiToolSettings.includeKeywords}
                              onChange={(e) => setAIToolSettings(prev => ({ ...prev, includeKeywords: e.target.checked }))}
                              className="rounded"
                            />
                            <label htmlFor="includeKeywords" className="text-sm">Include Keywords</label>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          AI Confidence: {aiToolSettings.confidence}%
                        </label>
                        <Slider
                          value={[aiToolSettings.confidence]}
                          onValueChange={(value) => 
                            setAIToolSettings(prev => ({ ...prev, confidence: value[0] }))
                          }
                          min={60}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Faster processing</span>
                          <span>Higher accuracy</span>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Current Settings:</h4>
                        <div className="space-y-1 text-sm">
                          <p>Tool: {aiToolSettings.selectedTool}</p>
                          {aiToolSettings.selectedTool === 'summarize' && (
                            <p>Length: {aiToolSettings.summaryLength}</p>
                          )}
                          {aiToolSettings.selectedTool === 'translate' && (
                            <p>Language: {aiToolSettings.targetLanguage}</p>
                          )}
                          <p>Confidence: {aiToolSettings.confidence}%</p>
                          <p>Files Ready: {files.filter(f => f.status === 'pending').length}</p>
                        </div>
                      </div>

                      {files.length > 0 && (
                        <Button
                          onClick={startAITools}
                          disabled={isProcessing || files.some(f => f.status === 'processing')}
                          className="w-full"
                        >
                          {isProcessing ? 'Processing AI...' : 'Start AI Processing'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  File Manager
                </CardTitle>
                <CardDescription>
                  Manage your processed files and documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    <Select
                      value={filterType}
                      onValueChange={(value: any) => setFilterType(value)}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="original">Original</SelectItem>
                        <SelectItem value="compressed">Compressed</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="ocr">OCR</SelectItem>
                        <SelectItem value="ai-processed">AI Processed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uploadedAt">Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="size">Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshFileManager}
                    >
                      Refresh
                    </Button>
                    {managedFiles.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearAllFiles}
                      >
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>

                {/* File List */}
                <div className="border rounded-lg">
                  {managedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No files found</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload and process files to see them here
                      </p>
                      <Button onClick={refreshFileManager}>
                        Load Sample Files
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {getFilteredAndSortedFiles().map((file) => (
                        <div key={file.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-2xl">{getFileTypeIcon(file.type)}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{file.name}</p>
                              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>Uploaded {formatDate(file.uploadedAt)}</span>
                                {file.processedAt && (
                                  <>
                                    <span>•</span>
                                    <span>Processed {formatDate(file.processedAt)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className={getFileTypeColor(file.type)}>
                              {file.type}
                            </Badge>
                            <Badge variant={file.status === 'available' ? 'default' : 'destructive'}>
                              {file.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadManagedFile(file.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteManagedFile(file.id)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Storage Info */}
                {managedFiles.length > 0 && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-medium">Storage Information</h4>
                        <p className="text-sm text-muted-foreground">
                          {managedFiles.length} files • {formatFileSize(managedFiles.reduce((total, file) => total + file.size, 0))}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{managedFiles.filter(f => f.type === 'original').length}</div>
                          <div className="text-muted-foreground">Original</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{managedFiles.filter(f => f.type === 'compressed').length}</div>
                          <div className="text-muted-foreground">Compressed</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{managedFiles.filter(f => f.type === 'converted').length}</div>
                          <div className="text-muted-foreground">Converted</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{managedFiles.filter(f => f.type === 'ocr').length}</div>
                          <div className="text-muted-foreground">OCR</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{managedFiles.filter(f => f.type === 'ai-processed').length}</div>
                          <div className="text-muted-foreground">AI</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <CardDescription>Configure application settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}