import { FileValidationResult } from '../types';

/**
 * Utility functions for file handling
 */
export class FileHelpers {
  /**
   * Validate if a file is a valid PDF
   */
  static validatePDFFile(file: File, maxSizeMB: number = 50): FileValidationResult {
    // Check if file exists
    if (!file) {
      return {
        isValid: false,
        error: 'No file provided'
      };
    }

    // Check file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return {
        isValid: false,
        error: 'Invalid file type. Please select a PDF file.',
        fileType: file.type
      };
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds ${maxSizeMB}MB limit.`,
        fileSize: file.size
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty.',
        fileSize: 0
      };
    }

    return {
      isValid: true,
      fileSize: file.size,
      fileType: file.type
    };
  }

  /**
   * Read file as ArrayBuffer
   */
  static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };

      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Read file as Uint8Array
   */
  static async readFileAsUint8Array(file: File): Promise<Uint8Array> {
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate a safe filename for export
   */
  static generateExportFilename(originalName: string, suffix: string = '_edited'): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const extension = originalName.substring(originalName.lastIndexOf('.'));

    // Remove or replace invalid characters
    const safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9\-_\s]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');

    return `${safeName}${suffix}${extension}`;
  }

  /**
   * Check if file is likely a valid PDF by checking magic numbers
   */
  static async isValidPDFSignature(file: File): Promise<boolean> {
    try {
      const firstBytes = await this.readFileFirstBytes(file, 5);
      const header = new TextDecoder().decode(firstBytes);
      return header.startsWith('%PDF-');
    } catch {
      return false;
    }
  }

  /**
   * Read first N bytes of a file
   */
  private static async readFileFirstBytes(file: File, byteCount: number): Promise<Uint8Array> {
    const slice = file.slice(0, byteCount);
    const arrayBuffer = await slice.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename: string): string {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
  }

  /**
   * Check if filename has valid characters
   */
  static isValidFilename(filename: string): boolean {
    // Check for invalid characters in different operating systems
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    const invalidNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

    return !invalidChars.test(filename) && !invalidNames.test(filename) && filename.length <= 255;
  }
}