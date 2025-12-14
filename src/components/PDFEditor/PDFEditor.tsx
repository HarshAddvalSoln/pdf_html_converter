import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PDFEditorProps } from '../../types';
import { usePDFLoader } from '../../hooks/usePDFLoader';
import { useTextExtraction } from '../../hooks/useTextExtraction';
import { usePDFEditor } from '../../hooks/usePDFEditor';
import { usePDFExport } from '../../hooks/usePDFExport';
import { FileHelpers } from '../../utils/fileHelpers';
import { APP_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../utils/constants';

// Import components
import { PDFUploader } from '../PDFUploader';
import { PDFViewer } from '../PDFViewer';
import { EditableOverlay } from '../EditableOverlay';
import { PageNavigation } from '../PageNavigation';
import { PDFExporter } from '../PDFExporter';

import styles from './PDFEditor.module.css';

/**
 * Main PDF Editor component that orchestrates all functionality
 */
export function PDFEditor({
  initialFile,
  initialScale = APP_CONFIG.DEFAULT_SCALE,
  showThumbnails = false,
  enableAnnotations = true,
  onFileLoad,
  onExportComplete,
  className = ''
}: PDFEditorProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(initialFile || null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [showError, setShowError] = useState(true);

  // Custom hooks
  const {
    isLoading,
    error: loaderError,
    pdfLoadResult,
    loadPDF,
    reset: resetLoader
  } = usePDFLoader();

  const {
    textItems,
    isExtracting,
    error: extractionError,
    extractText,
    getTextItemsForPage
  } = useTextExtraction();

  const editorState = usePDFEditor(initialScale);
  const {
    exportPDF,
    isExporting,
    error: exportError,
    progress
  } = usePDFExport();

  // Refs
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Combined error state
  const currentError = loaderError || extractionError || editorState.state.error || exportError;

  /**
   * Handle file selection from uploader
   */
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      editorState.setLoading(true);
      editorState.setError(null);

      // Validate file
      const validation = FileHelpers.validatePDFFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || ERROR_MESSAGES.INVALID_FILE_TYPE);
      }

      // Load PDF
      const loadResult = await loadPDF(file);
      if (!loadResult) {
        throw new Error(ERROR_MESSAGES.PDF_LOAD_ERROR);
      }

      // Read file bytes
      const bytes = await FileHelpers.readFileAsUint8Array(file);

      // Extract text
      const extractedText = await extractText(file);
      if (!extractedText) {
        throw new Error(ERROR_MESSAGES.TEXT_EXTRACTION_ERROR);
      }

      // Update state
      setPdfFile(file);
      setPdfBytes(bytes);
      editorState.setFile(file);
      editorState.setFileBytes(bytes);
      editorState.setTextItems(extractedText);
      editorState.setNumPages(loadResult.numPages);
      editorState.setMetadata(loadResult.metadata);

      onFileLoad?.(file);
      console.log(SUCCESS_MESSAGES.FILE_UPLOADED);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      editorState.setError(errorMessage);
      console.error('File selection error:', err);
    } finally {
      editorState.setLoading(false);
    }
  }, [loadPDF, extractText, editorState, onFileLoad]);

  /**
   * Handle text editing
   */
  const handleTextEdit = useCallback((id: string, newText: string) => {
    const textItem = textItems.find(item => item.id === id);
    if (textItem) {
      editorState.addEdit(id, newText, textItem);
    }
  }, [textItems, editorState]);

  /**
   * Handle edit removal
   */
  const handleEditRemoval = useCallback((id: string) => {
    editorState.removeEdit(id);
  }, [editorState]);

  /**
   * Handle PDF export
   */
  const handleExportComplete = useCallback(async (result: any) => {
    onExportComplete?.(result);
    if (result.success) {
      console.log(SUCCESS_MESSAGES.PDF_EXPORTED);
    }
  }, [onExportComplete]);

  /**
   * Handle reset/clear
   */
  const handleReset = useCallback(() => {
    setPdfFile(null);
    setPdfBytes(null);
    editorState.resetState();
    resetLoader();
  }, [editorState, resetLoader]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (editorState.state.isLoading || editorState.state.isExporting) return;

      // Don't handle shortcuts when focused on input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (event.key) {
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            editorState.zoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            editorState.zoomOut();
          }
          break;
        case '0':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            editorState.resetZoom();
          }
          break;
        case 'o':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            editorState.toggleOverlay();
          }
          break;
        case 'Delete':
        case 'Backspace':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            editorState.clearAllEdits();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editorState]);

  // Load initial file if provided
  useEffect(() => {
    if (initialFile && !pdfFile) {
      handleFileSelect(initialFile);
    }
  }, [initialFile, pdfFile, handleFileSelect]);

  const containerClasses = [
    styles.pdfEditor,
    editorState.state.isLoading ? styles.loading : '',
    editorState.state.error ? styles.hasError : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} data-testid="pdf-editor">
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>PDF Editor</h1>
        <div className={styles.headerActions}>
          {editorState.hasFile && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
              disabled={editorState.state.isLoading || editorState.state.isExporting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1,4 1,10 7,10" />
                <path d="M3.51,15a9,9,0,0,0,13.48,0" />
                <polyline points="23,20 23,14 17,14" />
                <path d="M20.49,9a9,9,0,0,0-13.48,0" />
              </svg>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {currentError && showError && (
        <div className={styles.errorDisplay}>
          <div className={styles.errorContent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="no ne" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{currentError}</span>
            <button
              type="button"
              className={styles.dismissError}
              onClick={() => setShowError(false)}
              aria-label="Dismiss error"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {editorState.state.isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingContent}>
            <div className={styles.spinner} />
            <p>
              {isExtracting ? 'Extracting text...' : 'Loading PDF...'}
              {isExtracting && (
                <span className={styles.extractionProgress}>
                  ({Math.round(editorState.state.numPages)} pages processed)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {!editorState.hasFile ? (
        // Upload screen
        <div className={styles.uploadScreen}>
          <div className={styles.uploadContent}>
            <PDFUploader onFileSelect={handleFileSelect} />
            <div className={styles.uploadInfo}>
              <h2>Welcome to PDF Editor</h2>
              <p>Upload a PDF file to start editing text content directly in your browser.</p>
              <ul className={styles.features}>
                <li>Edit text content while preserving original formatting</li>
                <li>Works entirely in your browser (privacy-friendly)</li>
                <li>Supports PDF text editing, annotation, and export</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        // Editor interface
        <div className={styles.editorInterface}>
          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarSection}>
              <button
                type="button"
                className={`${styles.toolButton} ${editorState.state.showOverlay ? styles.active : ''}`}
                onClick={editorState.toggleOverlay}
                title="Toggle text overlay (O)"
                disabled={editorState.state.isLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Text Edit
              </button>

              <div className={styles.zoomControls}>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={editorState.zoomOut}
                  disabled={!editorState.canZoomOut}
                  title="Zoom out (-)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21,21 -4.35,-4.35" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <span className={styles.zoomDisplay}>
                  {Math.round(editorState.state.scale * 100)}%
                </span>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={editorState.zoomIn}
                  disabled={!editorState.canZoomIn}
                  title="Zoom in (+)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21,21 -4.35,-4.35" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={editorState.resetZoom}
                  title="Reset zoom (0)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1,1 6,6v-3a8,8,0,0,1,16,0" />
                    <path d="M23,23 18,18v3a8,8,0,0,1-16,0" />
                  </svg>
                </button>
              </div>

              {editorState.hasEdits && (
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={editorState.clearAllEdits}
                  title="Clear all edits"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6" />
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
                  </svg>
                  Clear ({editorState.editCount})
                </button>
              )}
            </div>

            <div className={styles.toolbarSection}>
              {pdfBytes && (
                <PDFExporter
                  originalBytes={pdfBytes}
                  edits={editorState.edits}
                  fileName={editorState.state.fileName}
                  onExportComplete={handleExportComplete}
                />
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className={styles.mainContent}>
            {/* PDF viewer with overlay */}
            <div className={styles.pdfContainer} ref={pdfContainerRef}>
              <PDFViewer
                file={pdfFile!}
                pageNumber={editorState.state.currentPage}
                scale={editorState.state.scale}
                onLoadSuccess={editorState.setNumPages}
              />
              {editorState.state.showOverlay && (
                <EditableOverlay
                  textItems={textItems}
                  currentPage={editorState.state.currentPage}
                  scale={editorState.state.scale}
                  edits={editorState.edits}
                  onEdit={handleTextEdit}
                  onRemoveEdit={handleEditRemoval}
                  containerRef={pdfContainerRef}
                />
              )}
            </div>

            {/* Page navigation */}
            {editorState.state.numPages > 1 && (
              <div className={styles.navigation}>
                <PageNavigation
                  currentPage={editorState.state.currentPage}
                  totalPages={editorState.state.numPages}
                  onPageChange={editorState.goToPage}
                  disabled={editorState.state.isLoading}
                />
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className={styles.statusBar}>
            <div className={styles.statusSection}>
              <span>{editorState.state.fileName}</span>
              {editorState.state.metadata?.title && (
                <span className={styles.metadata}>{editorState.state.metadata.title}</span>
              )}
            </div>
            <div className={styles.statusSection}>
              <span>Page {editorState.state.currentPage} of {editorState.state.numPages}</span>
              {editorState.hasEdits && (
                <span className={styles.editsIndicator}>
                  {editorState.editCount} edit{editorState.editCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}