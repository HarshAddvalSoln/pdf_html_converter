import { TextItem, EditedText, PDFMetadata } from './pdf.types';

// Main editor state
export interface PDFEditorState {
  // File information
  originalFile: File | null;
  originalBytes: Uint8Array | null;
  fileName: string;

  // PDF metadata
  numPages: number;
  currentPage: number;
  metadata?: PDFMetadata;

  // Extracted content
  textItems: TextItem[];

  // User edits
  edits: Map<string, EditedText>;

  // UI state
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;

  // Display settings
  scale: number;
  showOverlay: boolean;
}

// File validation result
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileSize?: number;
  fileType?: string;
}

// Export options
export interface ExportOptions {
  preserveOriginal: boolean;
  compressOutput: boolean;
  filename?: string;
}

// Export result
export interface ExportResult {
  success: boolean;
  blob?: Blob;
  filename?: string;
  error?: string;
  editCount?: number;
}

// Zoom levels
export type ZoomLevel = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 2.5 | 3;

// Navigation direction
export type NavigationDirection = 'first' | 'previous' | 'next' | 'last' | 'goto';

// Editor action types
export type EditorAction =
  | { type: 'SET_FILE'; payload: File }
  | { type: 'SET_FILE_BYTES'; payload: Uint8Array }
  | { type: 'SET_TEXT_ITEMS'; payload: TextItem[] }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'TOGGLE_OVERLAY' }
  | { type: 'ADD_EDIT'; payload: { id: string; edit: EditedText } }
  | { type: 'REMOVE_EDIT'; payload: string }
  | { type: 'CLEAR_EDITS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_METADATA'; payload: PDFMetadata }
  | { type: 'RESET_STATE' };