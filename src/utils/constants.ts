/**
 * Application constants and configuration
 */

export const APP_CONFIG = {
  // File handling
  MAX_FILE_SIZE_MB: 50,
  SUPPORTED_FILE_TYPES: ['application/pdf'],
  ACCEPTED_FILE_TYPES: '.pdf',

  // PDF display
  DEFAULT_SCALE: 1.0,
  MIN_SCALE: 0.25,
  MAX_SCALE: 3.0,
  SCALE_STEP: 0.25,

  // Zoom levels
  ZOOM_LEVELS: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3],

  // UI settings
  DEBOUNCE_DELAY_MS: 300,
  ANIMATION_DURATION_MS: 200,

  // Export settings
  EXPORT_FILENAME_SUFFIX: '_edited',
  DEFAULT_EXPORT_FILENAME: 'edited_document.pdf',

  // PDF processing
  FONT_FALLBACK: 'Helvetica',
  DEFAULT_FONT_SIZE: 12,
  TEXT_EXTRACTION_TIMEOUT_MS: 30000,
  PDF_MODIFICATION_TIMEOUT_MS: 30000,
} as const;

export const ERROR_MESSAGES = {
  // File errors
  INVALID_FILE_TYPE: 'Invalid file type. Please select a PDF file.',
  FILE_TOO_LARGE: (maxSize: number) => `File size exceeds ${maxSize}MB limit.`,
  EMPTY_FILE: 'File is empty.',
  CORRUPTED_FILE: 'File appears to be corrupted or invalid.',
  FILE_READ_ERROR: 'Failed to read file.',

  // PDF processing errors
  PDF_LOAD_ERROR: 'Failed to load PDF file.',
  TEXT_EXTRACTION_ERROR: 'Failed to extract text from PDF.',
  PDF_MODIFICATION_ERROR: 'Failed to modify PDF file.',
  FONT_EMBED_ERROR: 'Failed to embed required fonts.',

  // Network/IO errors
  NETWORK_ERROR: 'Network error occurred.',
  DOWNLOAD_ERROR: 'Failed to download file.',
  SAVE_ERROR: 'Failed to save file.',

  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  TIMEOUT_ERROR: 'Operation timed out.',
  PERMISSION_DENIED: 'Permission denied.',

  // Browser compatibility
  BROWSER_NOT_SUPPORTED: 'Your browser does not support this feature.',
  PDFJS_NOT_LOADED: 'PDF.js library failed to load.',
} as const;

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'PDF file uploaded successfully.',
  TEXT_EXTRACTED: 'Text extracted successfully.',
  PDF_EXPORTED: 'PDF exported successfully.',
  EDITS_APPLIED: (count: number) => `Applied ${count} ${count === 1 ? 'edit' : 'edits'} to PDF.`,
  ALL_EDITS_CLEARED: 'All edits have been cleared.',
} as const;

export const FONT_MAPPING = {
  // Standard PDF fonts mapped to pdf-lib standard fonts
  'Helvetica': 'Helvetica',
  'Helvetica-Bold': 'Helvetica-Bold',
  'Helvetica-Oblique': 'Helvetica-Oblique',
  'Helvetica-BoldOblique': 'Helvetica-BoldOblique',
  'Times-Roman': 'Times-Roman',
  'Times-Bold': 'Times-Bold',
  'Times-Italic': 'Times-Italic',
  'Times-BoldItalic': 'Times-BoldItalic',
  'Courier': 'Courier',
  'Courier-Bold': 'Courier-Bold',
  'Courier-Oblique': 'Courier-Oblique',
  'Courier-BoldOblique': 'Courier-BoldOblique',
} as const;

export const CSS_CLASSES = {
  // Layout
  CONTAINER: 'pdf-editor-container',
  MAIN_LAYOUT: 'pdf-editor-main-layout',
  SIDEBAR: 'pdf-editor-sidebar',
  CONTENT_AREA: 'pdf-editor-content-area',

  // Components
  UPLOADER: 'pdf-uploader',
  VIEWER: 'pdf-viewer',
  OVERLAY: 'pdf-overlay',
  NAVIGATION: 'pdf-navigation',
  EXPORTER: 'pdf-exporter',

  // States
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  DISABLED: 'disabled',
  ACTIVE: 'active',
  EDITING: 'editing',
  EDITED: 'edited',

  // Modifiers
  HIDDEN: 'hidden',
  VISIBLE: 'visible',
  OVERLAY_VISIBLE: 'overlay-visible',
  OVERLAY_HIDDEN: 'overlay-hidden',
} as const;

export const KEYBOARD_SHORTCUTS = {
  // Navigation
  NEXT_PAGE: 'ArrowRight',
  PREV_PAGE: 'ArrowLeft',
  FIRST_PAGE: 'Home',
  LAST_PAGE: 'End',

  // Zoom
  ZOOM_IN: ['+', '='],
  ZOOM_OUT: '-',
  ZOOM_RESET: '0',
  FIT_TO_WIDTH: 'w',

  // Editing
  TOGGLE_OVERLAY: 'o',
  CLEAR_EDITS: ['Delete', 'Backspace'],
  EXPORT_PDF: ['Ctrl+s', 'Meta+s'],

  // General
  HELP: '?',
} as const;

export const STORAGE_KEYS = {
  // User preferences
  LAST_SCALE: 'pdf_editor_last_scale',
  LAST_FILE_SIZE: 'pdf_editor_last_file_size',
  AUTO_SAVE_ENABLED: 'pdf_editor_auto_save_enabled',
  SHOW_OVERLAY_DEFAULT: 'pdf_editor_show_overlay_default',

  // Session data
  CURRENT_EDITS: 'pdf_editor_current_edits',
  SESSION_TIMESTAMP: 'pdf_editor_session_timestamp',
} as const;

export const ANIMATION_TIMING = {
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
} as const;

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1440,
} as const;