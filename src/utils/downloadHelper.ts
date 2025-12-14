import { ExportResult } from '../types';

/**
 * Utility functions for file downloading
 */
export class DownloadHelper {
  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Download Uint8Array as PDF file
   */
  static downloadPDF(bytes: Uint8Array, filename: string): Promise<ExportResult> {
    return new Promise(async (resolve) => {
      try {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        await this.downloadBlob(blob, filename);

        resolve({
          success: true,
          blob,
          filename
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Download failed'
        });
      }
    });
  }

  /**
   * Create and download a text file
   */
  static downloadTextFile(text: string, filename: string): Promise<void> {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    return this.downloadBlob(blob, filename);
  }

  /**
   * Create and download a JSON file
   */
  static downloadJSONFile(data: any, filename: string): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    return this.downloadBlob(blob, filename);
  }

  /**
   * Check if download is supported in current browser
   */
  static isDownloadSupported(): boolean {
    return (
      typeof document !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function' &&
      document.createElement('a').download !== undefined
    );
  }

  /**
   * Generate download with progress tracking
   */
  static downloadWithProgress(
    bytes: Uint8Array,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<ExportResult> {
    return new Promise(async (resolve) => {
      try {
        const chunkSize = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(bytes.length / chunkSize);
        const chunks: Uint8Array[] = [];

        // Process chunks to simulate progress
        for (let i = 0; i < totalChunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, bytes.length);
          const chunk = bytes.slice(start, end);
          chunks.push(chunk);

          const progress = ((i + 1) / totalChunks) * 100;
          onProgress?.(progress);
        }

        // Combine all chunks
        const completeBytes = new Uint8Array(bytes.length);
        let offset = 0;
        for (const chunk of chunks) {
          completeBytes.set(chunk, offset);
          offset += chunk.length;
        }

        const blob = new Blob([completeBytes], { type: 'application/pdf' });
        await this.downloadBlob(blob, filename);

        resolve({
          success: true,
          blob,
          filename
        });
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Download failed'
        });
      }
    });
  }

  /**
   * Create a download URL for a blob (for preview)
   */
  static createDownloadURL(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke a download URL
   */
  static revokeDownloadURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Save file to local storage (for mobile devices that don't support downloads)
   */
  static async saveToLocalStorage(blob: Blob, filename: string): Promise<boolean> {
    try {
      if ('showSaveFilePicker' in window) {
        // File System Access API (supported in modern browsers)
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PDF files',
            accept: { 'application/pdf': ['.pdf'] },
          }],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        return true;
      }
      return false;
    } catch (error) {
      console.warn('File System Access API not available or failed:', error);
      return false;
    }
  }

  /**
   * Get appropriate download method based on browser capabilities
   */
  static getDownloadMethod(): 'blob' | 'filesystem' | 'unsupported' {
    if (!this.isDownloadSupported()) {
      return 'unsupported';
    }

    if ('showSaveFilePicker' in window) {
      return 'filesystem';
    }

    return 'blob';
  }
}