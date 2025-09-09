/* eslint-disable no-console */
import { createHash, randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ---------- same interfaces you already had ----------
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
  contentPath?: string; // path on disk instead of in-memory Blob
}

export interface FileManagerOptions {
  maxFiles: number;
  maxStorageSize: number; // bytes
  autoCleanup: boolean;
  retentionDays: number;
}
// -----------------------------------------------------

const DEFAULT_OPTS: FileManagerOptions = {
  maxFiles: 100,
  maxStorageSize: 500 * 1024 * 1024, // 500 MB
  autoCleanup: true,
  retentionDays: 30,
};

export class FileManagerService {
  /* ---------- singleton ---------- */
  private static _instance?: FileManagerService;
  static getInstance(opts?: Partial<FileManagerOptions>): FileManagerService {
    return (this._instance ??= new FileManagerService(opts));
  }

  /* ---------- state ---------- */
  private baseDir: string;
  private indexPath: string;
  private opts: FileManagerOptions;
  private _index?: Map<string, StoredFile>; // in-memory cache

  constructor(opts?: Partial<FileManagerOptions>) {
    this.opts = { ...DEFAULT_OPTS, ...opts };
    this.baseDir = join(process.cwd(), '.data', 'file-manager');
    this.indexPath = join(this.baseDir, 'files.json');
  }

  /* ---------- internal helpers ---------- */
  private async ensureDir() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  private async readIndex(): Promise<Map<string, StoredFile>> {
    if (this._index) return this._index;
    await this.ensureDir();
    try {
      const raw = await fs.readFile(this.indexPath, 'utf-8');
      const arr: [string, StoredFile][] = JSON.parse(raw);
      this._index = new Map(arr);
    } catch {
      this._index = new Map();
    }
    return this._index;
  }

  private async writeIndex(): Promise<void> {
    const map = await this.readIndex();
    const ser: [string, StoredFile][] = Array.from(map.entries());
    await fs.writeFile(this.indexPath, JSON.stringify(ser, null, 2));
  }

  private generateId(): string {
    return `file_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  private filePath(id: string): string {
    return join(this.baseDir, `${id}.bin`);
  }

  /* ---------- public API (unchanged signatures) ---------- */
  async storeFile(
    file: File,
    category: StoredFile['metadata']['category'],
    processingDetails?: any
  ): Promise<StoredFile> {
    await this.cleanupIfNeeded();

    const id = this.generateId();
    const buf = Buffer.from(await file.arrayBuffer());

    const stored: StoredFile = {
      id,
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
      contentPath: this.filePath(id),
    };

    // write blob
    await fs.writeFile(stored.contentPath!, buf);

    // update index
    const map = await this.readIndex();
    map.set(id, stored);
    await this.writeIndex();

    return { ...stored }; // return without buffer
  }

  async getFile(fileId: string): Promise<StoredFile | null> {
    const map = await this.readIndex();
    const rec = map.get(fileId);
    if (!rec) return null;

    // update lastAccessed
    rec.lastAccessed = Date.now();
    await this.writeIndex();

    // read blob on demand
    const content = await fs.readFile(rec.contentPath!);
    return { ...rec, content: new Blob([content], { type: rec.type }) };
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const map = await this.readIndex();
    const rec = map.get(fileId);
    if (!rec) return false;

    await fs.unlink(rec.contentPath!).catch(() => {}); // ignore missing
    map.delete(fileId);
    await this.writeIndex();
    return true;
  }

  async listFiles(options?: {
    category?: StoredFile['metadata']['category'];
    sortBy?: 'name' | 'size' | 'uploadedAt' | 'lastAccessed';
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }): Promise<StoredFile[]> {
    const map = await this.readIndex();
    let files = Array.from(map.values());

    if (options?.category)
      files = files.filter(f => f.metadata.category === options.category);

    if (options?.search) {
      const q = options.search.toLowerCase();
      files = files.filter(
        f =>
          f.name.toLowerCase().includes(q) ||
          f.metadata.originalName.toLowerCase().includes(q)
      );
    }

    if (options?.sortBy) {
      const key = options.sortBy;
      const dir = options.sortOrder === 'asc' ? 1 : -1;
      files.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
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
    const files = await this.listFiles();
    const totalFiles = files.length;
    const totalSize = files.reduce((s, f) => s + f.size, 0);
    const filesByCategory = files.reduce((acc, f) => {
      acc[f.metadata.category] = (acc[f.metadata.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestFile =
      totalFiles > 0 ? Math.min(...files.map(f => f.uploadedAt)) : undefined;
    const newestFile =
      totalFiles > 0 ? Math.max(...files.map(f => f.uploadedAt)) : undefined;

    return { totalFiles, totalSize, filesByCategory, oldestFile, newestFile };
  }

  async clearAll(): Promise<void> {
    const map = await this.readIndex();
    await Promise.all(
      Array.from(map.values()).map(f =>
        fs.unlink(f.contentPath!).catch(() => {})
      )
    );
    map.clear();
    await this.writeIndex();
  }

  async searchFiles(query: string): Promise<StoredFile[]> {
    return this.listFiles({ search: query });
  }

  async getFilesByCategory(
    category: StoredFile['metadata']['category']
  ): Promise<StoredFile[]> {
    return this.listFiles({ category });
  }

  /* ---------- helpers ---------- */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  formatDate(timestamp: number): string {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  /* ---------- cleanup ---------- */
  private async cleanupIfNeeded(): Promise<void> {
    if (!this.opts.autoCleanup) return;
    const map = await this.readIndex();
    const now = Date.now();
    const limit = this.opts.retentionDays * 24 * 60 * 60 * 1000;

    // drop expired
    for (const [id, f] of map.entries()) {
      if (now - f.uploadedAt > limit) {
        await fs.unlink(f.contentPath!).catch(() => {});
        map.delete(id);
      }
    }

    // enforce max files
    if (map.size > this.opts.maxFiles) {
      const sorted = Array.from(map.values()).sort(
        (a, b) => a.lastAccessed - b.lastAccessed
      );
      for (let i = 0; i < sorted.length - this.opts.maxFiles; i++) {
        const f = sorted[i];
        await fs.unlink(f.contentPath!).catch(() => {});
        map.delete(f.id);
      }
    }

    // enforce max bytes
    let total = Array.from(map.values()).reduce((s, f) => s + f.size, 0);
    if (total > this.opts.maxStorageSize) {
      const sorted = Array.from(map.values()).sort((a, b) => b.size - a.size);
      for (const f of sorted) {
        if (total <= this.opts.maxStorageSize) break;
        await fs.unlink(f.contentPath!).catch(() => {});
        map.delete(f.id);
        total -= f.size;
      }
    }

    await this.writeIndex();
  }
}