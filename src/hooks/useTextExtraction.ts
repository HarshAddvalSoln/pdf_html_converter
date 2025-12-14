import { useState, useCallback } from 'react';
import { TextItem } from '../types';
import { TextExtractor } from '../services/textExtractor';

/**
 * Hook for extracting text from PDF files
 */
export function useTextExtraction() {
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);

  /**
   * Extract text from all pages of a PDF file
   */
  const extractText = useCallback(async (file: File | Uint8Array): Promise<TextItem[] | null> => {
    setIsExtracting(true);
    setError(null);
    setExtractionProgress(0);

    try {
      const extractor = TextExtractor.getInstance();

      // For progress tracking, we'll need to do page-by-page extraction
      const loadResult = await extractor.loadPDF(file);
      const allTextItems: TextItem[] = [];
      const totalPages = loadResult.numPages;

      // Extract text page by page for progress tracking
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          const pageTextItems = await extractor.extractPageText(loadResult.pdfDocument, pageNum);
          allTextItems.push(...pageTextItems);

          // Update progress
          const progress = (pageNum / totalPages) * 100;
          setExtractionProgress(Math.round(progress));

        } catch (pageError) {
          console.error(`Failed to extract text from page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }

      setTextItems(allTextItems);
      setExtractionProgress(100);
      return allTextItems;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Text extraction failed';
      setError(errorMessage);
      console.error('Text extraction error:', err);
      return null;
    } finally {
      setIsExtracting(false);
      setExtractionProgress(0);
    }
  }, []);

  /**
   * Extract text from a specific page only
   */
  const extractPageText = useCallback(async (
    file: File | Uint8Array,
    pageNumber: number
  ): Promise<TextItem[]> => {
    setIsExtracting(true);
    setError(null);

    try {
      const extractor = TextExtractor.getInstance();
      const loadResult = await extractor.loadPDF(file);

      const pageTextItems = await extractor.extractPageText(loadResult.pdfDocument, pageNumber);

      // Update text items for the specific page (replace existing page items)
      setTextItems(prev => {
        const otherPagesText = prev.filter(item => item.pageNumber !== pageNumber);
        return [...otherPagesText, ...pageTextItems];
      });

      return pageTextItems;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Page text extraction failed';
      setError(errorMessage);
      console.error('Page text extraction error:', err);
      return [];
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Get text items for a specific page
   */
  const getTextItemsForPage = useCallback((pageNumber: number): TextItem[] => {
    return textItems.filter(item => item.pageNumber === pageNumber);
  }, [textItems]);

  /**
   * Get all unique pages that have text items
   */
  const getPagesWithText = useCallback((): number[] => {
    const pages = new Set(textItems.map(item => item.pageNumber));
    return Array.from(pages).sort((a, b) => a - b);
  }, [textItems]);

  /**
   * Search for text items containing specific text
   */
  const searchText = useCallback((searchTerm: string): TextItem[] => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    return textItems.filter(item =>
      item.text.toLowerCase().includes(term)
    );
  }, [textItems]);

  /**
   * Get text content as string for a specific page
   */
  const getPageText = useCallback((pageNumber: number): string => {
    const pageItems = getTextItemsForPage(pageNumber);
    return pageItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [getTextItemsForPage]);

  /**
   * Clear all extracted text
   */
  const clearText = useCallback(() => {
    setTextItems([]);
    setError(null);
    setExtractionProgress(0);
  }, []);

  return {
    textItems,
    isExtracting,
    error,
    extractionProgress,
    extractText,
    extractPageText,
    getTextItemsForPage,
    getPagesWithText,
    searchText,
    getPageText,
    clearText,
    totalTextItems: textItems.length
  };
}