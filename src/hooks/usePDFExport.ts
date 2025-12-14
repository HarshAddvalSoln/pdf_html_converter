import { useState, useCallback } from 'react';
import { EditedText, ExportOptions, ExportResult } from '../types';
import { PDFModifier } from '../services/pdfModifier';
import { FileHelpers } from '../utils/fileHelpers';
import { DownloadHelper } from '../utils/downloadHelper';
import { APP_CONFIG } from '../utils/constants';

/**
 * Hook for exporting modified PDF files
 */
export function usePDFExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Export PDF with applied edits
   */
  const exportPDF = useCallback(async (
    originalBytes: Uint8Array,
    edits: Map<string, EditedText>,
    fileName: string,
    options: ExportOptions = { preserveOriginal: true, compressOutput: false }
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);
    setProgress(0);

    try {
      if (edits.size === 0) {
        // No edits, return original file
        const originalBlob = new Blob([originalBytes], { type: 'application/pdf' });
        const exportFilename = options.filename ||
          FileHelpers.generateExportFilename(fileName, options.preserveOriginal ? '' : '_no_changes');

        if (options.preserveOriginal) {
          await DownloadHelper.downloadBlob(originalBlob, exportFilename);
        }

        return {
          success: true,
          blob: originalBlob,
          filename: exportFilename,
          editCount: 0
        };
      }

      // Apply edits to PDF
      setProgress(10);
      const modifier = new PDFModifier();

      const modifiedBytes = await modifier.applyEditsToPDF(originalBytes, edits);
      setProgress(70);

      // Create export filename
      const exportFilename = options.filename ||
        FileHelpers.generateExportFilename(fileName, APP_CONFIG.EXPORT_FILENAME_SUFFIX);

      // Create blob
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      setProgress(90);

      // Download the file
      if (options.preserveOriginal) {
        await DownloadHelper.downloadBlob(blob, exportFilename);
      }

      setProgress(100);
      modifier.cleanup();

      return {
        success: true,
        blob,
        filename: exportFilename,
        editCount: edits.size
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF export failed';
      setError(errorMessage);
      console.error('PDF export error:', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, []);

  /**
   * Export PDF with progress tracking
   */
  const exportPDFWithProgress = useCallback(async (
    originalBytes: Uint8Array,
    edits: Map<string, EditedText>,
    fileName: string,
    onProgress?: (progress: number) => void,
    options: ExportOptions = { preserveOriginal: true, compressOutput: false }
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);

    try {
      onProgress?.(10);

      if (edits.size === 0) {
        onProgress?.(50);
        const originalBlob = new Blob([originalBytes], { type: 'application/pdf' });
        const exportFilename = options.filename ||
          FileHelpers.generateExportFilename(fileName, '');

        onProgress?.(75);
        if (options.preserveOriginal) {
          await DownloadHelper.downloadBlob(originalBlob, exportFilename);
        }

        onProgress?.(100);
        return {
          success: true,
          blob: originalBlob,
          filename: exportFilename,
          editCount: 0
        };
      }

      onProgress?.(25);
      const modifier = new PDFModifier();

      const modifiedBytes = await modifier.applyEditsToPDF(originalBytes, edits);
      onProgress?.(60);

      const exportFilename = options.filename ||
        FileHelpers.generateExportFilename(fileName, APP_CONFIG.EXPORT_FILENAME_SUFFIX);

      onProgress?.(75);

      // Use download helper with progress
      const downloadResult = await DownloadHelper.downloadWithProgress(
        modifiedBytes,
        exportFilename,
        (downloadProgress) => {
          // Map download progress (0-100) to our progress scale (75-100)
          const totalProgress = 75 + (downloadProgress * 0.25);
          onProgress?.(totalProgress);
        }
      );

      onProgress?.(100);
      modifier.cleanup();

      if (downloadResult.success) {
        return {
          success: true,
          blob: downloadResult.blob,
          filename: downloadResult.filename,
          editCount: edits.size
        };
      } else {
        throw new Error(downloadResult.error || 'Download failed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'PDF export failed';
      setError(errorMessage);
      onProgress?.(0);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsExporting(false);
    }
  }, []);

  /**
   * Create annotated PDF showing where changes were made
   */
  const createAnnotatedPDF = useCallback(async (
    originalBytes: Uint8Array,
    edits: Map<string, EditedText>,
    fileName: string
  ): Promise<ExportResult> => {
    setIsExporting(true);
    setError(null);
    setProgress(0);

    try {
      if (edits.size === 0) {
        return {
          success: false,
          error: 'No edits to annotate'
        };
      }

      setProgress(25);
      const modifier = new PDFModifier();

      const annotatedBytes = await modifier.createAnnotatedPDF(originalBytes, edits);
      setProgress(75);

      const exportFilename = FileHelpers.generateExportFilename(fileName, '_annotated');
      const blob = new Blob([annotatedBytes], { type: 'application/pdf' });

      setProgress(90);
      await DownloadHelper.downloadBlob(blob, exportFilename);
      setProgress(100);

      modifier.cleanup();

      return {
        success: true,
        blob,
        filename: exportFilename,
        editCount: edits.size
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create annotated PDF';
      setError(errorMessage);
      console.error('Annotated PDF creation error:', err);

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, []);

  /**
   * Export edits as JSON for backup or analysis
   */
  const exportEditsJSON = useCallback(async (
    edits: Map<string, EditedText>,
    fileName: string
  ): Promise<void> => {
    try {
      const editsArray = Array.from(edits.entries()).map(([id, edit]) => ({
        id,
        ...edit
      }));

      const exportData = {
        fileName,
        exportDate: new Date().toISOString(),
        totalEdits: edits.size,
        edits: editsArray
      };

      const jsonFilename = FileHelpers.generateExportFilename(fileName, '_edits', 'json');
      await DownloadHelper.downloadJSONFile(exportData, jsonFilename);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export edits JSON';
      setError(errorMessage);
      console.error('JSON export error:', err);
      throw err;
    }
  }, []);

  /**
   * Get estimated file size after export
   */
  const estimateExportSize = useCallback((
    originalBytes: Uint8Array,
    edits: Map<string, EditedText>
  ): { originalSize: number; estimatedSize: number; sizeIncrease: number } => {
    const originalSize = originalBytes.length;

    // Rough estimation: each edit adds about 500 bytes to file size
    const estimatedEditOverhead = edits.size * 500;
    const estimatedSize = originalSize + estimatedEditOverhead;

    return {
      originalSize,
      estimatedSize,
      sizeIncrease: estimatedSize - originalSize
    };
  }, []);

  /**
   * Reset export state
   */
  const reset = useCallback(() => {
    setIsExporting(false);
    setError(null);
    setProgress(0);
  }, []);

  return {
    isExporting,
    error,
    progress,
    exportPDF,
    exportPDFWithProgress,
    createAnnotatedPDF,
    exportEditsJSON,
    estimateExportSize,
    reset
  };
}