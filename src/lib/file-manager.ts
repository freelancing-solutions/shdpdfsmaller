export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  lastAccessed: number;
  metadata: {
    originalName: string;
    mimeType: string;
    category: 'original' | 'compressed' | 'converted' | 'ocr' | 'ai-processed';
    processingDetails?: any;
  };
  content?: Blob; // In real implementation, this would be stored in a proper storage system
}

export interface FileManagerOptions {
  maxFiles: number;
  maxStorageSize: number; // in bytes
  autoCleanup: boolean;
  retentionDays: number;
}

export class FileManagerService {
  private static instance: FileManagerService;
  private files: Map<string, StoredFile> = new Map();
  private options: FileManagerOptions;

  static getInstance(options?: Partial<FileManagerOptions>): FileManagerService {
    if (!FileManagerService.instance) {
      FileManagerService.instance = new FileManagerService(options);
    }
    return FileManagerService.instance;
  }

  constructor(options: Partial<FileManagerOptions> = {}) {
    this.options = {
      maxFiles: 100,
      maxStorageSize: 500 * 1024 * 1024, // 500MB
      autoCleanup: true,
      retentionDays: 30,
      ...options,
    };

    // Load files from localStorage (simulated persistence)
    this.loadFiles();
  }

  private loadFiles(): void {
    try {
      const stored = localStorage.getItem('pdfsmaller_files');
      if (stored) {
        const filesData = JSON.parse(stored);
        this.files = new Map(filesData);
      }
    } catch (error) {
      console.warn('Failed to load files from storage:', error);
    }
  }

  private saveFiles(): void {
    try {
      const filesData = Array.from(this.files.entries());
      localStorage.setItem('pdfsmaller_files', JSON.stringify(filesData));
    } catch (error) {
      console.warn('Failed to save files to storage:', error);
    }
  }

  async storeFile(file: File, category: StoredFile['metadata']['category'], processingDetails?: any): Promise<StoredFile> {
    // Check limits
    if (this.files.size >= this.options.maxFiles) {
      await this.cleanup();
    }

    const totalSize = Array.from(this.files.values()).reduce((sum, f) => sum + f.size, 0);
    if (totalSize + file.size > this.options.maxStorageSize) {
      await this.cleanup();
    }

    const fileId = this.generateFileId();
    const storedFile: StoredFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: Date.now(),
      lastAccessed: Date.now(),
      metadata: {
        originalName: file.name,
        mimeType: file.type,
        category,
        processingDetails,
      },
      content: file, // In real implementation, store in proper storage
    };

    this.files.set(fileId, storedFile);
    this.saveFiles();

    return storedFile;
  }

  async getFile(fileId: string): Promise<StoredFile | null> {
    const file = this.files.get(fileId);
    if (file) {
      // Update last accessed time
      file.lastAccessed = Date.now();
      this.saveFiles();
      return file;
    }
    return null;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const deleted = this.files.delete(fileId);
    if (deleted) {
      this.saveFiles();
    }
    return deleted;
  }

  async listFiles(options?: {
    category?: StoredFile['metadata']['category'];
    sortBy?: 'name' | 'size' | 'uploadedAt' | 'lastAccessed';
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<StoredFile[]> {
    let files = Array.from(this.files.values());

    // Apply filters
    if (options?.category) {
      files = files.filter(f => f.metadata.category === options.category);
    }

    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      files = files.filter(f => 
        f.name.toLowerCase().includes(searchLower) ||
        f.metadata.originalName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (options?.sortBy) {
      files.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (options.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'size':
            aValue = a.size;
            bValue = b.size;
            break;
          case 'uploadedAt':
            aValue = a.uploadedAt;
            bValue = b.uploadedAt;
            break;
          case 'lastAccessed':
          default:
            aValue = a.lastAccessed;
            bValue = b.lastAccessed;
            break;
        }

        if (aValue < bValue) return options.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return options.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return files;
  }

  async getStorageInfo(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByCategory: Record<string, number>;
    oldestFile?: number;
    newestFile?: number;
  }> {
    const files = Array.from(this.files.values());
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    
    const filesByCategory = files.reduce((acc, f) => {
      acc[f.metadata.category] = (acc[f.metadata.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestFile = files.length > 0 ? Math.min(...files.map(f => f.uploadedAt)) : undefined;
    const newestFile = files.length > 0 ? Math.max(...files.map(f => f.uploadedAt)) : undefined;

    return {
      totalFiles,
      totalSize,
      filesByCategory,
      oldestFile,
      newestFile,
    };
  }

  async cleanup(): Promise<void> {
    if (!this.options.autoCleanup) return;

    const now = Date.now();
    const retentionMs = this.options.retentionDays * 24 * 60 * 60 * 1000;

    // Remove old files
    for (const [fileId, file] of this.files.entries()) {
      if (now - file.uploadedAt > retentionMs) {
        this.files.delete(fileId);
      }
    }

    // If still over limits, remove least recently accessed files
    if (this.files.size > this.options.maxFiles) {
      const sortedFiles = Array.from(this.files.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
      
      const filesToRemove = sortedFiles.slice(0, this.files.size - this.options.maxFiles);
      for (const [fileId] of filesToRemove) {
        this.files.delete(fileId);
      }
    }

    // If still over storage limit, remove largest files
    const totalSize = Array.from(this.files.values()).reduce((sum, f) => sum + f.size, 0);
    if (totalSize > this.options.maxStorageSize) {
      const sortedFiles = Array.from(this.files.entries())
        .sort(([, a], [, b]) => b.size - a.size);
      
      let currentSize = totalSize;
      for (const [fileId, file] of sortedFiles) {
        if (currentSize <= this.options.maxStorageSize) break;
        this.files.delete(fileId);
        currentSize -= file.size;
      }
    }

    this.saveFiles();
  }

  async clearAll(): Promise<void> {
    this.files.clear();
    this.saveFiles();
  }

  async searchFiles(query: string): Promise<StoredFile[]> {
    const searchLower = query.toLowerCase();
    return Array.from(this.files.values()).filter(file =>
      file.name.toLowerCase().includes(searchLower) ||
      file.metadata.originalName.toLowerCase().includes(searchLower)
    );
  }

  async getFilesByCategory(category: StoredFile['metadata']['category']): Promise<StoredFile[]> {
    return Array.from(this.files.values()).filter(f => f.metadata.category === category);
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString() + ' ' + 
           new Date(timestamp).toLocaleTimeString([], { 
             hour: '2-digit', 
             minute: '2-digit' 
           });
  }
}