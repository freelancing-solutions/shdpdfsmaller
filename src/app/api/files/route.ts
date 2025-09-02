// app/api/files/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServerFileManagerService } from '@/lib/server-file-manager';

const fileManager = ServerFileManagerService.getInstance();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const fileId = searchParams.get('fileId');
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const search = searchParams.get('search');

    switch (action) {
      case 'list':
        const files = await fileManager.listFiles({
          category: category as any || undefined,
          sortBy: (sortBy as any) || 'uploadedAt',
          sortOrder: (sortOrder as any) || 'desc',
          search: search || undefined,
        });
        
        const formattedFiles = files.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
          lastAccessed: file.lastAccessed,
          metadata: file.metadata,
          formattedSize: fileManager.formatFileSize(file.size),
          formattedUploadedAt: fileManager.formatDate(file.uploadedAt),
          formattedLastAccessed: fileManager.formatDate(file.lastAccessed),
        }));

        return NextResponse.json({
          success: true,
          files: formattedFiles,
        });

      case 'storage':
        const storageInfo = await fileManager.getStorageInfo();
        return NextResponse.json({
          success: true,
          storage: {
            ...storageInfo,
            formattedTotalSize: fileManager.formatFileSize(storageInfo.totalSize),
            formattedOldestFile: storageInfo.oldestFile ? fileManager.formatDate(storageInfo.oldestFile) : undefined,
            formattedNewestFile: storageInfo.newestFile ? fileManager.formatDate(storageInfo.newestFile) : undefined,
          },
        });

      case 'download':
        if (!fileId) {
          return NextResponse.json(
            { error: 'File ID is required for download' },
            { status: 400 }
          );
        }

        const fileToDownload = await fileManager.getFile(fileId);
        if (!fileToDownload) {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          );
        }

        if (!fileToDownload.content) {
          return NextResponse.json(
            { error: 'File content not available' },
            { status: 404 }
          );
        }

        const response = new NextResponse(fileToDownload.content, {
          status: 200,
          headers: {
            'Content-Type': fileToDownload.type,
            'Content-Disposition': `attachment; filename="${fileToDownload.name}"`,
            'X-File-Id': fileToDownload.id,
            'X-File-Category': fileToDownload.metadata.category,
          },
        });

        return response;

      default:
        return NextResponse.json({
          message: 'File Manager API',
          endpoints: {
            list: 'GET /api/files?action=list - List files',
            storage: 'GET /api/files?action=storage - Get storage info',
            download: 'GET /api/files?action=download&fileId={id} - Download file',
            upload: 'POST /api/files - Upload file',
            delete: 'DELETE /api/files?fileId={id} - Delete file',
            clear: 'DELETE /api/files?action=clear - Clear all files',
          },
          supportedCategories: ['original', 'compressed', 'converted', 'ocr', 'ai-processed'],
        });
    }
  } catch (error) {
    console.error('Files API GET error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const processingDetails = formData.get('processingDetails') ? 
      JSON.parse(formData.get('processingDetails') as string) : undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['original', 'compressed', 'converted', 'ocr', 'ai-processed'];
    if (!category || !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid or missing category' },
        { status: 400 }
      );
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    const storedFile = await fileManager.storeFile(
      file, 
      category as any, 
      processingDetails
    );

    return NextResponse.json({
      success: true,
      file: {
        id: storedFile.id,
        name: storedFile.name,
        size: storedFile.size,
        type: storedFile.type,
        uploadedAt: storedFile.uploadedAt,
        lastAccessed: storedFile.lastAccessed,
        metadata: storedFile.metadata,
        formattedSize: fileManager.formatFileSize(storedFile.size),
        formattedUploadedAt: fileManager.formatDate(storedFile.uploadedAt),
      },
    });

  } catch (error) {
    console.error('Files API POST error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const fileId = searchParams.get('fileId');

    if (action === 'clear') {
      await fileManager.clearAll();
      return NextResponse.json({
        success: true,
        message: 'All files cleared',
      });
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const deleted = await fileManager.deleteFile(fileId);
    if (!deleted) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Files API DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}