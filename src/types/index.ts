// Re-export all types
export * from './pdf.types';
export * from './editor.types';

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PDFUploaderProps extends BaseComponentProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number; // in MB
  disabled?: boolean;
}

export interface PDFViewerProps extends BaseComponentProps {
  file: File | Uint8Array;
  pageNumber: number;
  scale: number;
  onLoadSuccess: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  onRenderComplete?: (pageNumber: number) => void;
}

export interface EditableOverlayProps extends BaseComponentProps {
  textItems: TextItem[];
  currentPage: number;
  scale: number;
  edits: Map<string, EditedText>;
  onEdit: (id: string, newText: string) => void;
  onRemoveEdit: (id: string) => void;
  disabled?: boolean;
}

export interface PDFExporterProps extends BaseComponentProps {
  originalBytes: Uint8Array;
  edits: Map<string, EditedText>;
  fileName: string;
  onExportComplete: (result: ExportResult) => void;
  disabled?: boolean;
  exportOptions?: ExportOptions;
}

export interface PageNavigationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  showThumbnails?: boolean;
}

export interface PDFEditorProps extends BaseComponentProps {
  initialFile?: File;
  initialScale?: number;
  showThumbnails?: boolean;
  enableAnnotations?: boolean;
  onFileLoad?: (file: File) => void;
  onExportComplete?: (result: ExportResult) => void;
}