import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PageNavigationProps } from '../../types';
import styles from './PageNavigation.module.css';

/**
 * Component for PDF page navigation controls
 */
export function PageNavigation({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  showThumbnails = false,
  className = ''
}: PageNavigationProps) {
  const [pageInput, setPageInput] = useState(currentPage.toString());
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update page input when current page changes externally
  useEffect(() => {
    if (!isEditing) {
      setPageInput(currentPage.toString());
    }
  }, [currentPage, isEditing]);

  /**
   * Validate and apply page input
   */
  const applyPageInput = useCallback(() => {
    const pageNum = parseInt(pageInput, 10);

    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      // Reset to current page if invalid
      setPageInput(currentPage.toString());
    }
    setIsEditing(false);
  }, [pageInput, currentPage, totalPages, onPageChange]);

  /**
   * Handle navigation to first page
   */
  const goToFirstPage = useCallback(() => {
    if (!disabled && currentPage > 1) {
      onPageChange(1);
    }
  }, [currentPage, onPageChange, disabled]);

  /**
   * Handle navigation to previous page
   */
  const goToPreviousPage = useCallback(() => {
    if (!disabled && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange, disabled]);

  /**
   * Handle navigation to next page
   */
  const goToNextPage = useCallback(() => {
    if (!disabled && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange, disabled]);

  /**
   * Handle navigation to last page
   */
  const goToLastPage = useCallback(() => {
    if (!disabled && currentPage < totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, totalPages, onPageChange, disabled]);

  /**
   * Handle page input change
   */
  const handlePageInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    // Allow only numbers and empty string
    if (/^\d*$/.test(value)) {
      setPageInput(value);
    }
  }, []);

  /**
   * Handle page input key events
   */
  const handlePageInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      applyPageInput();
    } else if (event.key === 'Escape') {
      setPageInput(currentPage.toString());
      setIsEditing(false);
    }
  }, [applyPageInput, currentPage]);

  /**
   * Handle page input focus
   */
  const handlePageInputFocus = useCallback(() => {
    setIsEditing(true);
    // Select all text for easy replacement
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  }, []);

  /**
   * Handle page input blur
   */
  const handlePageInputBlur = useCallback(() => {
    applyPageInput();
  }, [applyPageInput]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || isEditing) return;

      // Only handle shortcuts if not focused on an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            goToFirstPage();
          }
          break;
        case 'End':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            goToLastPage();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, isEditing, goToPreviousPage, goToNextPage, goToFirstPage, goToLastPage]);

  const navigationClasses = [
    styles.navigation,
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={navigationClasses} data-testid="page-navigation">
      {/* Navigation controls */}
      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.navButton} ${styles.first}`}
          onClick={goToFirstPage}
          disabled={disabled || currentPage <= 1}
          title="First page (Ctrl+Home)"
          aria-label="Go to first page"
          data-testid="nav-first-page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="11,17 6,12 11,7" />
            <polyline points="17,17 12,12 17,7" />
          </svg>
        </button>

        <button
          type="button"
          className={`${styles.navButton} ${styles.previous}`}
          onClick={goToPreviousPage}
          disabled={disabled || currentPage <= 1}
          title="Previous page (Left arrow)"
          aria-label="Go to previous page"
          data-testid="nav-previous-page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>

        <div className={styles.pageInputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={pageInput}
            onChange={handlePageInputChange}
            onKeyDown={handlePageInputKeyDown}
            onFocus={handlePageInputFocus}
            onBlur={handlePageInputBlur}
            disabled={disabled}
            className={styles.pageInput}
            title={`Current page (1-${totalPages})`}
            aria-label={`Page ${currentPage} of ${totalPages}`}
            data-testid="page-input"
          />
          <span className={styles.pageSeparator}>/</span>
          <span className={styles.totalPages}>{totalPages}</span>
        </div>

        <button
          type="button"
          className={`${styles.navButton} ${styles.next}`}
          onClick={goToNextPage}
          disabled={disabled || currentPage >= totalPages}
          title="Next page (Right arrow)"
          aria-label="Go to next page"
          data-testid="nav-next-page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>

        <button
          type="button"
          className={`${styles.navButton} ${styles.last}`}
          onClick={goToLastPage}
          disabled={disabled || currentPage >= totalPages}
          title="Last page (Ctrl+End)"
          aria-label="Go to last page"
          data-testid="nav-last-page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="13,17 18,12 13,7" />
            <polyline points="7,17 12,12 7,7" />
          </svg>
        </button>
      </div>

      {/* Progress indicator */}
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${(currentPage / totalPages) * 100}%` }}
          />
        </div>
        <span className={styles.progressText}>
          {Math.round((currentPage / totalPages) * 100)}%
        </span>
      </div>
    </div>
  );
}