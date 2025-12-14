// Text item extracted from PDF
export interface TextItem {
  id: string;              // Unique identifier (pageNum-index)
  text: string;            // Original text content
  x: number;               // X coordinate (canvas space)
  y: number;               // Y coordinate (canvas space)
  width: number;           // Text width
  height: number;          // Text height
  fontSize: number;        // Font size in points
  fontName: string;        // Font family name
  pageNumber: number;      // Page number (1-indexed)
  color?: RGB;             // Text color (optional)
}

// Edited text information
export interface EditedText {
  originalText: string;    // Original text value
  newText: string;         // Modified text value
  position: Position;      // Position in PDF coordinates
  fontSize: number;        // Font size
  fontName: string;        // Font family
  pageNumber: number;      // Page number
  color?: RGB;             // Text color (optional)
}

// Position coordinates
export interface Position {
  x: number;
  y: number;
}

// RGB color
export interface RGB {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
}

// PDF Document metadata
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

// Page information
export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

// PDF Load Result
export interface PDFLoadResult {
  pdfDocument: any;
  numPages: number;
  metadata?: PDFMetadata;
}