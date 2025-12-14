import * as pdfjsLib from 'pdfjs-dist';
import { TextItem, PDFLoadResult } from '../types';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
}

/**
 * Service for extracting text content and positions from PDF files
 */
export class TextExtractor {
  private static instance: TextExtractor;
  private pdfDocument: any = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): TextExtractor {
    if (!TextExtractor.instance) {
      TextExtractor.instance = new TextExtractor();
    }
    return TextExtractor.instance;
  }

  /**
   * Load PDF document
   */
  async loadPDF(file: File | Uint8Array): Promise<PDFLoadResult> {
    try {
      const data = file instanceof File ? await file.arrayBuffer() : file;

      const loadingTask = pdfjsLib.getDocument({
        data,
        // Enable font rendering for better text extraction
        standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        disableAutoFetch: false,
        disableStream: false,
      });

      const pdfDocument = await loadingTask.promise;

      // Get metadata
      let metadata;
      try {
        const metadataObj = await pdfDocument.getMetadata();
        metadata = {
          title: metadataObj.info?.Title,
          author: metadataObj.info?.Author,
          subject: metadataObj.info?.Subject,
          creator: metadataObj.info?.Creator,
          producer: metadataObj.info?.Producer,
          creationDate: metadataObj.info?.CreationDate?.toDate(),
          modificationDate: metadataObj.info?.ModDate?.toDate(),
        };
      } catch (error) {
        console.warn('Could not extract PDF metadata:', error);
      }

      this.pdfDocument = pdfDocument;

      return {
        pdfDocument,
        numPages: pdfDocument.numPages,
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text with positions from all pages
   */
  async extractAllText(file: File | Uint8Array): Promise<TextItem[]> {
    const { pdfDocument, numPages } = await this.loadPDF(file);
    const allTextItems: TextItem[] = [];

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const pageTextItems = await this.extractPageText(pdfDocument, pageNum);
        allTextItems.push(...pageTextItems);
      } catch (error) {
        console.error(`Failed to extract text from page ${pageNum}:`, error);
        // Continue with other pages
      }
    }

    return allTextItems;
  }

  /**
   * Extract text with positions from a specific page
   */
  async extractPageText(pdfDocument: any, pageNum: number): Promise<TextItem[]> {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent({
      includeMarkedContent: true,
      normalizeWhitespace: true,
    });

    const viewport = page.getViewport({ scale: 1.0 });
    const textItems: TextItem[] = [];

    // Extract text items with positions
    textContent.items.forEach((item: any, index: number) => {
      if (!item.str.trim()) return; // Skip empty text

      // Extract transform matrix
      const transform = item.transform || [0, 0, 0, 0, 0, 0];

      // Calculate position
      const x = transform[4];
      const y = transform[5];

      // Calculate font size from transform matrix (using scale factor)
      const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);

      // Get text dimensions
      const width = item.width || 0;
      const height = fontSize; // Approximate height

      // Convert PDF coordinates (bottom-left) to canvas coordinates (top-left)
      const canvasY = viewport.height - y - fontSize;

      textItems.push({
        id: `${pageNum}-${index}`,
        text: item.str,
        x: Math.round(x * 100) / 100,
        y: Math.round(canvasY * 100) / 100,
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100,
        fontSize: Math.round(fontSize * 10) / 10,
        fontName: item.fontName || 'unknown',
        pageNumber: pageNum,
        color: item.color ? {
          r: Math.round(item.color[0] * 100) / 100,
          g: Math.round(item.color[1] * 100) / 100,
          b: Math.round(item.color[2] * 100) / 100,
        } : undefined
      });
    });

    return textItems;
  }

  /**
   * Get page dimensions
   */
  async getPageDimensions(pageNum: number): Promise<{ width: number; height: number; rotation: number }> {
    if (!this.pdfDocument) {
      throw new Error('PDF document not loaded');
    }

    const page = await this.pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });

    return {
      width: viewport.width,
      height: viewport.height,
      rotation: viewport.rotation
    };
  }

  /**
   * Extract text from a specific region of a page
   */
  async extractTextFromRegion(
    pageNum: number,
    region: { x: number; y: number; width: number; height: number }
  ): Promise<TextItem[]> {
    if (!this.pdfDocument) {
      throw new Error('PDF document not loaded');
    }

    const pageTextItems = await this.extractPageText(this.pdfDocument, pageNum);

    // Filter text items that intersect with the specified region
    return pageTextItems.filter(item => {
      return item.x < region.x + region.width &&
             item.x + item.width > region.x &&
             item.y < region.y + region.height &&
             item.y + item.height > region.y;
    });
  }

  /**
   * Get text content as a string for a page
   */
  async getPageTextAsString(pageNum: number): Promise<string> {
    const textItems = await this.extractPageText(this.pdfDocument, pageNum);
    return textItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pdfDocument = null;
  }
}