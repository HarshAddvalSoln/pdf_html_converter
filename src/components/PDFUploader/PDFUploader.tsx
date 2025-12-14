import React, { useCallback, useRef } from 'react';
import { PDFUploaderProps } from '../../types';
import { FileHelpers } from '../../utils/fileHelpers';
import { APP_CONFIG, ERROR_MESSAGES } from '../../utils/constants';
import styles from './PDFUploader.module.css';

/**
 * Component for uploading PDF files
 */
export function PDFUploader({
  onFileSelect,
  acceptedFormats = APP_CONFIG.ACCEPTED_FILE_TYPES,
  maxSize = APP_CONFIG.MAX_FILE_SIZE_MB,
  disabled = false,
  className = ''
}: PDFUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  /**
   * Handle file selection from input
   */
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  /**
   * Process selected file
   */
  const processFile = useCallback((file: File) => {
    setUploadError(null);

    // Validate file
    const validation = FileHelpers.validatePDFFile(file, maxSize);
    if (!validation.isValid) {
      setUploadError(validation.error || ERROR_MESSAGES.INVALID_FILE_TYPE);
      return;
    }

    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onFileSelect(file);
  }, [maxSize, onFileSelect]);

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  /**
   * Trigger file input click
   */
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      handleClick();
    }
  }, [disabled, handleClick]);

  return (
    <div className={`${styles.uploader} ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileChange}
        className={styles.fileInput}
        disabled={disabled}
        data-testid="pdf-file-input"
      />

      <div
        className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ''} ${disabled ? styles.disabled : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload PDF file"
        data-testid="pdf-upload-area"
      >
        <div className={styles.uploadContent}>
          <div className={styles.uploadIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </div>

          <div className={styles.uploadText}>
            <h3 className={styles.uploadTitle}>
              Upload PDF File
            </h3>
            <p className={styles.uploadDescription}>
              Drag and drop your PDF file here, or click to browse
            </p>
            <p className={styles.uploadHint}>
              Maximum file size: {maxSize}MB
            </p>
          </div>

          <button
            type="button"
            className={styles.uploadButton}
            disabled={disabled}
          >
            Choose File
          </button>
        </div>
      </div>

      {uploadError && (
        <div className={styles.errorMessage} role="alert" data-testid="upload-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {uploadError}
        </div>
      )}
    </div>
  );
}