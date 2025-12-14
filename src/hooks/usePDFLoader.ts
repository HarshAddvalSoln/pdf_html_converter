import { useState, useCallback } from 'react';
import { FileValidationResult, PDFLoadResult } from '../types';
import { FileHelpers } from '../utils/fileHelpers';
import { TextExtractor } from '../services/textExtractor';

/**
 * Hook for loading and parsing PDF files
 */
export function usePDFLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoadResult, setPdfLoadResult] = useState<PDFLoadResult | null>(null);

  /**
   * Validate and load a PDF file
   */
  const loadPDF = useCallback(async (file: File): Promise<PDFLoadResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate file
      const validation = FileHelpers.validatePDFFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return null;
      }

      // Additional PDF signature validation
      const isValidSignature = await FileHelpers.isValidPDFSignature(file);
      if (!isValidSignature) {
        setError('File does not appear to be a valid PDF');
        return null;
      }

      // Load PDF using TextExtractor
      const extractor = TextExtractor.getInstance();
      const loadResult = await extractor.loadPDF(file);

      setPdfLoadResult(loadResult);
      return loadResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
      setError(errorMessage);
      console.error('PDF loading error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset the loader state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setPdfLoadResult(null);
  }, []);

  return {
    isLoading,
    error,
    pdfLoadResult,
    loadPDF,
    reset,
    numPages: pdfLoadResult?.numPages || 0,
    metadata: pdfLoadResult?.metadata
  };
}