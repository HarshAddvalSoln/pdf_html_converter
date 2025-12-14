import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TextItem, EditedText } from '../../types';
import { EditableTextItem } from './EditableTextItem';
import styles from './EditableOverlay.module.css';

interface EditableOverlayProps {
  textItems: TextItem[];
  currentPage: number;
  scale: number;
  edits: Map<string, EditedText>;
  onEdit: (id: string, newText: string) => void;
  onRemoveEdit: (id: string) => void;
  disabled?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Overlay component for editable text items positioned over PDF
 */
export function EditableOverlay({
  textItems,
  currentPage,
  scale,
  edits,
  onEdit,
  onRemoveEdit,
  disabled = false,
  containerRef
}: EditableOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Filter text items for current page
  const currentPageTextItems = useMemo(() => {
    return textItems.filter(item => item.pageNumber === currentPage);
  }, [textItems, currentPage]);

  // Calculate container dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      } else if (overlayRef.current?.parentElement) {
        const rect = overlayRef.current.parentElement.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    // Listen for resize events
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef?.current) {
      resizeObserver.observe(containerRef.current);
    } else if (overlayRef.current?.parentElement) {
      resizeObserver.observe(overlayRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  /**
   * Handle clicking outside any text item (optional functionality)
   */
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      // Clicked on the overlay background
      event.preventDefault();
    }
  }, []);

  /**
   * Get edited text for a specific text item
   */
  const getEditedText = useCallback((textItem: TextItem): EditedText | undefined => {
    return edits.get(textItem.id);
  }, [edits]);

  /**
   * Calculate overlay container styles
   */
  const getOverlayStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: disabled ? 'none' : 'auto',
      zIndex: 10,
      overflow: 'hidden',
    };

    return baseStyles;
  }, [disabled]);

  /**
   * Calculate visibility of text items based on viewport
   */
  const getVisibleTextItems = useCallback(() => {
    if (!containerDimensions.width || !containerDimensions.height) {
      return currentPageTextItems;
    }

    // Calculate viewport boundaries
    const viewportBounds = {
      left: 0,
      top: 0,
      right: containerDimensions.width,
      bottom: containerDimensions.height
    };

    // Filter items that are within or near the viewport
    return currentPageTextItems.filter(item => {
      const itemBounds = {
        left: item.x * scale - 10, // Add some padding
        top: item.y * scale - 10,
        right: (item.x + item.width) * scale + 10,
        bottom: (item.y + item.height) * scale + 10
      };

      // Check if item bounds intersect with viewport bounds
      return !(
        itemBounds.right < viewportBounds.left ||
        itemBounds.left > viewportBounds.right ||
        itemBounds.bottom < viewportBounds.top ||
        itemBounds.top > viewportBounds.bottom
      );
    });
  }, [currentPageTextItems, scale, containerDimensions]);

  const visibleTextItems = getVisibleTextItems();

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${disabled ? styles.disabled : ''}`}
      style={getOverlayStyles()}
      onClick={handleOverlayClick}
      data-testid="editable-overlay"
      role="application"
      aria-label={`PDF text editing overlay - Page ${currentPage}`}
    >
      {visibleTextItems.map(textItem => (
        <EditableTextItem
          key={textItem.id}
          textItem={textItem}
          scale={scale}
          isEdited={edits.has(textItem.id)}
          editedText={getEditedText(textItem)}
          onEdit={onEdit}
          onRemoveEdit={onRemoveEdit}
          disabled={disabled}
        />
      ))}

      {/* Debug information (development only) */}
      {import.meta.env.DEV && (
        <div className={styles.debugInfo}>
          <div>Page: {currentPage}</div>
          <div>Text Items: {visibleTextItems.length}/{currentPageTextItems.length}</div>
          <div>Edits: {edits.size}</div>
          <div>Scale: {scale.toFixed(2)}</div>
          <div>Container: {containerDimensions.width}x{containerDimensions.height}</div>
        </div>
      )}

      {/* Accessibility announcement for screen readers */}
      <div className={styles.srOnly} role="status" aria-live="polite">
        {edits.size > 0 && `${edits.size} text ${edits.size === 1 ? 'item' : 'items'} edited on page ${currentPage}`}
      </div>
    </div>
  );
}