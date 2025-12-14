import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextItem, EditedText } from '../../types';
import styles from './EditableOverlay.module.css';

interface EditableTextItemProps {
  textItem: TextItem;
  scale: number;
  isEdited: boolean;
  editedText?: EditedText;
  onEdit: (id: string, newText: string) => void;
  onRemoveEdit: (id: string) => void;
  disabled?: boolean;
}

/**
 * Individual editable text item component
 */
export function EditableTextItem({
  textItem,
  scale,
  isEdited,
  editedText,
  onEdit,
  onRemoveEdit,
  disabled = false
}: EditableTextItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(editedText?.newText || textItem.text);
  const contentRef = useRef<HTMLDivElement>(null);
  const [textDimensions, setTextDimensions] = useState({ width: 0, height: 0 });

  // Update local text when editedText changes
  useEffect(() => {
    setLocalText(editedText?.newText || textItem.text);
  }, [editedText, textItem.text]);

  // Measure text dimensions
  const measureText = useCallback(() => {
    if (contentRef.current) {
      const rect = contentRef.current.getBoundingClientRect();
      setTextDimensions({
        width: rect.width / scale,
        height: rect.height / scale
      });
    }
  }, [scale]);

  // Measure on mount and when text changes
  useEffect(() => {
    if (!isEditing) {
      measureText();
    }
  }, [localText, isEditing, measureText]);

  /**
   * Handle entering edit mode
   */
  const handleEnterEdit = useCallback(() => {
    if (disabled) return;

    setIsEditing(true);
    // Focus and select all text
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();

        // Create selection range
        const range = document.createRange();
        range.selectNodeContents(contentRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  }, [disabled]);

  /**
   * Handle leaving edit mode
   */
  const handleExitEdit = useCallback(() => {
    setIsEditing(false);

    const newText = contentRef.current?.textContent || textItem.text;

    if (newText !== textItem.text) {
      // Text changed, apply edit
      if (newText.trim()) {
        onEdit(textItem.id, newText.trim());
      } else {
        // Empty text, remove edit (revert to original)
        onRemoveEdit(textItem.id);
      }
    } else if (isEdited && newText === textItem.text) {
      // Reverted to original text, remove edit
      onRemoveEdit(textItem.id);
    }
  }, [textItem, isEdited, onEdit, onRemoveEdit]);

  /**
   * Handle key events
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      // Cancel edit and revert to original
      event.preventDefault();
      setLocalText(textItem.text);
      setIsEditing(false);
    } else if (event.key === 'Enter') {
      // Commit edit on Enter
      event.preventDefault();
      handleExitEdit();
    }
  }, [handleExitEdit, textItem.text]);

  /**
   * Handle text input
   */
  const handleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
    const newText = event.currentTarget.textContent || '';
    setLocalText(newText);
  }, []);

  /**
   * Handle paste events to strip formatting
   */
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    event.preventDefault();

    const text = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  /**
   * Get CSS font family from PDF font name
   */
  const getFontFamily = useCallback((fontName: string): string => {
    const normalizedFont = fontName.toLowerCase();

    if (normalizedFont.includes('helvetica')) {
      if (normalizedFont.includes('bold')) {
        return 'Helvetica, Arial, sans-serif';
      }
      return 'Helvetica, Arial, sans-serif';
    }

    if (normalizedFont.includes('times')) {
      if (normalizedFont.includes('bold')) {
        return 'TimesNewRoman, Times, serif';
      }
      return 'TimesNewRoman, Times, serif';
    }

    if (normalizedFont.includes('courier')) {
      if (normalizedFont.includes('bold')) {
        return 'Courier, monospace';
      }
      return 'Courier, monospace';
    }

    // Default fallback
    return 'Helvetica, Arial, sans-serif';
  }, []);

  /**
   * Calculate styles
   */
  const calculateStyles = useCallback((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${textItem.x * scale}px`,
      top: `${textItem.y * scale}px`,
      fontSize: `${textItem.fontSize * scale}px`,
      fontFamily: getFontFamily(textItem.fontName),
      lineHeight: '1.2',
      whiteSpace: 'nowrap',
      overflow: 'visible',
      outline: 'none',
      cursor: disabled ? 'default' : 'text',
      userSelect: disabled ? 'none' : 'text',
      pointerEvents: disabled ? 'none' : 'auto',
    };

    if (isEditing) {
      return {
        ...baseStyle,
        border: '2px solid #3b82f6',
        backgroundColor: '#ffffff',
        color: '#000000',
        minWidth: `${Math.max(textItem.width * scale, 100)}px`,
        minHeight: `${textItem.height * scale}px`,
        zIndex: 1000,
        padding: '2px 4px',
        borderRadius: '2px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      };
    }

    if (isEdited) {
      return {
        ...baseStyle,
        border: '1px dashed #f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        color: editedText?.color ? `rgb(${editedText.color.r * 255}, ${editedText.color.g * 255}, ${editedText.color.b * 255})` : 'inherit',
        minWidth: `${Math.max(textItem.width * scale, 50)}px`,
        minHeight: `${textItem.height * scale}px`,
      };
    }

    return {
      ...baseStyle,
      border: '1px solid transparent',
      minWidth: `${textItem.width * scale}px`,
      minHeight: `${textItem.height * scale}px`,
    };
  }, [textItem, scale, isEditing, isEdited, editedText, disabled, getFontFamily]);

  const itemClasses = [
    styles.editableTextItem,
    isEditing ? styles.editing : '',
    isEdited ? styles.edited : '',
    disabled ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={contentRef}
      className={itemClasses}
      style={calculateStyles()}
      contentEditable={!disabled}
      suppressContentEditableWarning={true}
      onClick={handleEnterEdit}
      onFocus={handleEnterEdit}
      onBlur={handleExitEdit}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onPaste={handlePaste}
      title={isEdited ? `Original: ${textItem.text}\nEdited: ${localText}` : textItem.text}
      data-text-item-id={textItem.id}
      data-page-number={textItem.pageNumber}
      data-testid={`editable-text-${textItem.id}`}
    >
      {localText}
    </div>
  );
}