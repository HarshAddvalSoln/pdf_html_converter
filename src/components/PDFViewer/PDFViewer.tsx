import React, { useCallback, useState, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFViewerProps } from '../../types';
import styles from './PDFViewer.module.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

/**
 * Component for displaying PDF files using react-pdf
 */
export function PDFViewer({
  file,
  pageNumber,
  scale,
  onLoadSuccess,
  onLoadError,
  onRenderComplete,
  className = ''
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const documentRef = useRef<any>(null);

  /**
   * Handle successful document load
   */
  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsDocumentLoaded(true);
    onLoadSuccess(numPages);
  }, [onLoadSuccess]);

  /**
   * Handle document load error
   */
  const handleDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF document load error:', error);
    onLoadError?.(error);
  }, [onLoadError]);

  /**
   * Handle page render success
   */
  const handlePageRenderSuccess = useCallback((pageIndex: number) => {
    const newRenderedPages = new Set(renderedPages);
    newRenderedPages.add(pageIndex + 1); // Convert to 1-indexed
    setRenderedPages(newRenderedPages);
    onRenderComplete?.(pageIndex + 1);
  }, [renderedPages, onRenderComplete]);

  /**
   * Handle page render error
   */
  const handlePageRenderError = useCallback((error: Error, pageIndex: number) => {
    console.error(`Page ${pageIndex + 1} render error:`, error);
  }, []);

  /**
   * Memoized document options
   */
  const documentOptions = useMemo(() => ({
    // Enable better text extraction
    standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    disableAutoFetch: false,
    disableStream: false,
  }), []);

  /**
   * Memoized page rendering options
   */
  const pageOptions = useMemo(() => ({
    renderTextLayer: true,
    renderAnnotationLayer: true,
    renderInteractiveForms: false,
    canvasBackground: '#ffffff',
    // Improve text quality
    useOnlyCssZoom: false,
    // Custom render function for better performance
    customTextRenderer: undefined,
  }), []);

  if (!file) {
    return (
      <div className={`${styles.container} ${styles.empty} ${className}`}>
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          <p>No PDF file selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`} data-testid="pdf-viewer">
      <Document
        file={file}
        onLoadSuccess={handleDocumentLoadSuccess}
        onLoadError={handleDocumentLoadError}
        loading={
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading PDF...</p>
          </div>
        }
        error={
          <div className={styles.error}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Failed to load PDF document</p>
          </div>
        }
        options={documentOptions}
        ref={documentRef}
      >
        {isDocumentLoaded && pageNumber >= 1 && pageNumber <= numPages && (
          <div className={styles.pageContainer}>
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading={
                <div className={styles.pageLoading}>
                  <div className={styles.spinner} />
                  <p>Loading page {pageNumber}...</p>
                </div>
              }
              error={
                <div className={styles.pageError}>
                  <p>Failed to load page {pageNumber}</p>
                </div>
              }
              onRenderSuccess={() => handlePageRenderSuccess(pageNumber - 1)}
              onRenderError={(error) => handlePageRenderError(error, pageNumber - 1)}
              {...pageOptions}
              className={styles.page}
              data-testid={`pdf-page-${pageNumber}`}
            />
          </div>
        )}
      </Document>

      {isDocumentLoaded && (pageNumber < 1 || pageNumber > numPages) && (
        <div className={styles.invalidPage}>
          <p>Invalid page number: {pageNumber}</p>
          <p>Please select a page between 1 and {numPages}</p>
        </div>
      )}
    </div>
  );
}