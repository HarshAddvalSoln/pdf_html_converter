import React, { useState, useCallback } from 'react';
import { PDFExporterProps, ExportOptions } from '../../types';
import { usePDFExport } from '../../hooks/usePDFExport';
import { FileHelpers } from '../../utils/fileHelpers';
import { SUCCESS_MESSAGES, ERROR_MESSAGES, APP_CONFIG } from '../../utils/constants';
import styles from './PDFExporter.module.css';

/**
 * Component for exporting modified PDF files
 */
export function PDFExporter({
  originalBytes,
  edits,
  fileName,
  onExportComplete,
  disabled = false,
  exportOptions = { preserveOriginal: true, compressOutput: false },
  className = ''
}: PDFExporterProps) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [customFilename, setCustomFilename] = useState('');
  const [exportSettings, setExportSettings] = useState<ExportOptions>(exportOptions);
  const [showProgress, setShowProgress] = useState(false);

  const { isExporting, error, progress, exportPDF, createAnnotatedPDF, exportEditsJSON, estimateExportSize } = usePDFExport();

  /**
   * Handle primary export action
   */
  const handleExport = useCallback(async () => {
    if (!originalBytes || disabled) return;

    setShowProgress(true);

    try {
      const options: ExportOptions = {
        ...exportSettings,
        filename: customFilename || undefined,
      };

      const result = await exportPDF(originalBytes, edits, fileName, options);
      onExportComplete(result);

      if (result.success) {
        // Show success message
        console.log(SUCCESS_MESSAGES.PDF_EXPORTED);
      }

    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setShowProgress(false);
    }
  }, [originalBytes, edits, fileName, exportSettings, customFilename, disabled, exportPDF, onExportComplete]);

  /**
   * Handle export with progress tracking
   */
  const handleExportWithProgress = useCallback(async () => {
    if (!originalBytes || disabled) return;

    setShowProgress(true);

    try {
      const options: ExportOptions = {
        ...exportSettings,
        filename: customFilename || undefined,
      };

      const result = await exportPDF(originalBytes, edits, fileName, undefined, options);
      onExportComplete(result);

    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setShowProgress(false);
    }
  }, [originalBytes, edits, fileName, exportSettings, customFilename, disabled, exportPDF, onExportComplete]);

  /**
   * Handle creating annotated PDF
   */
  const handleCreateAnnotated = useCallback(async () => {
    if (!originalBytes || disabled || edits.size === 0) return;

    try {
      const result = await createAnnotatedPDF(originalBytes, edits, fileName);
      onExportComplete(result);

      if (result.success) {
        console.log('Annotated PDF created successfully');
      }

    } catch (err) {
      console.error('Failed to create annotated PDF:', err);
    }
  }, [originalBytes, edits, fileName, disabled, createAnnotatedPDF, onExportComplete]);

  /**
   * Handle exporting edits as JSON
   */
  const handleExportJSON = useCallback(async () => {
    if (edits.size === 0) return;

    try {
      await exportEditsJSON(edits, fileName);
      console.log('Edits exported as JSON successfully');
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  }, [edits, fileName, exportEditsJSON]);

  /**
   * Handle keyboard shortcuts
   */
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || isExporting) return;

      // Ctrl/Cmd + S to export
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleExport();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, isExporting, handleExport]);

  // Calculate estimated file size
  const sizeEstimate = originalBytes ? estimateExportSize(originalBytes, edits) : null;

  const canExport = !disabled && !!originalBytes && !isExporting;
  const hasEdits = edits.size > 0;
  const isExportDisabled = !canExport;

  return (
    <div className={`${styles.exporter} ${className}`} data-testid="pdf-exporter">
      {/* Export button */}
      <button
        type="button"
        className={`${styles.exportButton} ${isExporting ? styles.exporting : ''}`}
        onClick={handleExportWithProgress}
        disabled={isExportDisabled}
        title={hasEdits ? `Export PDF with ${edits.size} edit${edits.size === 1 ? '' : 's'}` : 'Export original PDF'}
        data-testid="export-button"
      >
        {isExporting ? (
          <>
            <div className={styles.spinner} />
            <span>Exporting... {Math.round(progress)}%</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            <span>{hasEdits ? `Export (${edits.size} edit${edits.size === 1 ? '' : 's'})` : 'Export PDF'}</span>
          </>
        )}
      </button>

      {/* Advanced options toggle */}
      <button
        type="button"
        className={styles.advancedToggle}
        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
        disabled={isExportDisabled}
        data-testid="advanced-toggle"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
        </svg>
        <span>Advanced</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`${styles.caret} ${isAdvancedMode ? styles.open : ''}`}
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {/* Advanced options */}
      {isAdvancedMode && (
        <div className={styles.advancedOptions}>
          {/* Custom filename */}
          <div className={styles.optionGroup}>
            <label htmlFor="custom-filename" className={styles.optionLabel}>
              Filename (optional)
            </label>
            <input
              id="custom-filename"
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder={FileHelpers.generateExportFilename(fileName, APP_CONFIG.EXPORT_FILENAME_SUFFIX)}
              className={styles.optionInput}
              disabled={isExporting}
            />
          </div>

          {/* Export settings */}
          <div className={styles.optionGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={exportSettings.preserveOriginal}
                onChange={(e) => setExportSettings(prev => ({ ...prev, preserveOriginal: e.target.checked }))}
                disabled={isExporting}
              />
              Preserve original file when downloading
            </label>
          </div>

          <div className={styles.optionGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={exportSettings.compressOutput}
                onChange={(e) => setExportSettings(prev => ({ ...prev, compressOutput: e.target.checked }))}
                disabled={isExporting}
              />
              Compress output (smaller file size)
            </label>
          </div>

          {/* Additional export options */}
          <div className={styles.additionalOptions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCreateAnnotated}
              disabled={!hasEdits || isExporting}
              data-testid="annotated-export-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Create Annotated PDF
            </button>

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleExportJSON}
              disabled={!hasEdits}
              data-testid="json-export-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              Export Edits as JSON
            </button>
          </div>

          {/* File size estimation */}
          {sizeEstimate && (
            <div className={styles.sizeEstimate}>
              <span className={styles.sizeLabel}>Estimated file size:</span>
              <span className={styles.sizeValue}>
                {FileHelpers.formatFileSize(sizeEstimate.estimatedSize)}
                {sizeEstimate.sizeIncrease > 0 && (
                  <span className={styles.sizeIncrease}>
                    {' '}(+{FileHelpers.formatFileSize(sizeEstimate.sizeIncrease)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      {showProgress && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{Math.round(progress)}%</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className={styles.errorMessage} role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {!isExporting && (
        <div className={styles.keyboardHint}>
          Press <kbd>Ctrl</kbd> + <kbd>S</kbd> to export
        </div>
      )}
    </div>
  );
}