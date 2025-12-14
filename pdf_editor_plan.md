# PDF Editor Implementation Plan
## React + TypeScript + pdf-lib + react-pdf

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Design](#architecture-design)
4. [Setup and Installation](#setup-and-installation)
5. [Project Structure](#project-structure)
6. [Data Flow and State Management](#data-flow-and-state-management)
7. [Implementation Phases](#implementation-phases)
8. [Technical Implementation Details](#technical-implementation-details)
9. [Features Roadmap](#features-roadmap)
10. [Challenges and Solutions](#challenges-and-solutions)
11. [Development Timeline](#development-timeline)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Considerations](#deployment-considerations)
14. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

### Goal
Build a web-based PDF editor using React and TypeScript that allows users to:
- Upload PDF documents
- View and navigate through PDF pages
- Edit text content directly in the browser
- Download the modified PDF while maintaining original formatting

### Key Requirements
- **Generic Solution**: Works with any PDF document structure
- **Format Preservation**: Maintains original PDF layout, fonts, and styling
- **Browser-Based**: No server-side processing required
- **Type-Safe**: Full TypeScript implementation
- **User-Friendly**: Intuitive editing interface

### Why This Approach?
Unlike HTML conversion methods that lose formatting, this solution:
- Works directly with PDF structure using `pdf-lib`
- Uses `react-pdf` for visual display and rendering
- Leverages `pdfjs-dist` for precise text extraction
- Maintains 100% format fidelity
- Operates entirely client-side (privacy-friendly)

---

## 🛠 Technology Stack

### Core Libraries

#### 1. **pdf-lib** (v1.17.1+)
- **Purpose**: PDF manipulation and modification
- **Cost**: Free (MIT License)
- **Why**: 
  - Direct PDF structure manipulation
  - Preserves original formatting
  - TypeScript support
  - Zero dependencies
  - Works in browser and Node.js

#### 2. **pdfjs-dist** (v3.11.174+)
- **Purpose**: PDF rendering and text extraction
- **Cost**: Free (Apache 2.0)
- **Why**:
  - Mozilla's official PDF library
  - Accurate text positioning
  - Robust rendering engine
  - Extract coordinates and font info

#### 3. **react-pdf** (v7.5.1+)
- **Purpose**: React wrapper for PDF.js
- **Cost**: Free (MIT License)
- **Why**:
  - Easy PDF display in React
  - Component-based API
  - Built-in page navigation
  - Responsive rendering

### Development Stack
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "^3.11.174",
    "react-pdf": "^7.5.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/pdfjs-dist": "^2.10.378"
  }
}
```

---

## 🏗 Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  (File Upload, PDF Display, Edit Controls, Download)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     React Components Layer                   │
│  PDFUploader │ PDFViewer │ EditableOverlay │ PDFExporter    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│   Text Extraction │ Position Mapping │ Edit Management      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Library Layer                           │
│   pdfjs-dist (read) │ react-pdf (display) │ pdf-lib (write) │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
PDF Upload
    │
    ▼
[File Reader] ──────────────┐
    │                       │
    ▼                       ▼
[ArrayBuffer]         [File Object]
    │                       │
    ▼                       ▼
[pdfjs-dist]          [react-pdf Display]
    │
    ▼
[Text Extraction]
    │
    ▼
[Text Items with Positions]
    │
    ▼
[Editable Overlay Layer]
    │
    ▼
[User Edits] ────────► [Edit State Map]
    │
    ▼
[pdf-lib Processing]
    │
    ▼
[Modified PDF Bytes]
    │
    ▼
[Download Blob]
```

### Component Interaction Flow

```
┌──────────────┐
│ PDFUploader  │
└──────┬───────┘
       │ (File)
       ▼
┌──────────────────┐     ┌─────────────────┐
│ PDFEditor (Main) │────►│ TextExtractor   │
└──────┬───────────┘     └────────┬────────┘
       │                          │
       │ (File)                   │ (TextItems[])
       ▼                          ▼
┌──────────────┐           ┌─────────────────┐
│  PDFViewer   │◄──────────│ EditableOverlay │
└──────────────┘           └────────┬────────┘
       │                            │
       │                            │ (Edits)
       │                            ▼
       │                   ┌─────────────────┐
       └──────────────────►│  PDFExporter    │
                           └─────────────────┘
```

---

## 🚀 Setup and Installation

### Step 1: Create React TypeScript Project

```bash
# Using Vite (recommended)
npm create vite@latest pdf-editor -- --template react-ts
cd pdf-editor

# Or using Create React App
npx create-react-app pdf-editor --template typescript
cd pdf-editor
```

### Step 2: Install Dependencies

```bash
# Install core libraries
npm install pdf-lib pdfjs-dist react-pdf

# Install type definitions
npm install --save-dev @types/pdfjs-dist

# Install optional utilities
npm install clsx  # for conditional CSS classes
```

### Step 3: Configure PDF.js Worker

Create or update `src/main.tsx` (Vite) or `src/index.tsx` (CRA):

```typescript
import { pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// Alternative: Use local worker file
// pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
```

### Step 4: Import Required CSS

In your main component or global CSS:

```typescript
// For text layer and annotations
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
```

### Step 5: TypeScript Configuration

Ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  }
}
```

---

## 📁 Project Structure

### Recommended Directory Structure

```
pdf-editor/
├── public/
│   └── pdf.worker.min.js          # Optional: Local PDF.js worker
├── src/
│   ├── components/
│   │   ├── PDFUploader/
│   │   │   ├── PDFUploader.tsx
│   │   │   ├── PDFUploader.module.css
│   │   │   └── index.ts
│   │   ├── PDFViewer/
│   │   │   ├── PDFViewer.tsx
│   │   │   ├── PDFViewer.module.css
│   │   │   └── index.ts
│   │   ├── PDFEditor/
│   │   │   ├── PDFEditor.tsx
│   │   │   ├── PDFEditor.module.css
│   │   │   └── index.ts
│   │   ├── EditableOverlay/
│   │   │   ├── EditableOverlay.tsx
│   │   │   ├── EditableTextItem.tsx
│   │   │   ├── EditableOverlay.module.css
│   │   │   └── index.ts
│   │   ├── PDFExporter/
│   │   │   ├── PDFExporter.tsx
│   │   │   ├── PDFExporter.module.css
│   │   │   └── index.ts
│   │   └── PageNavigation/
│   │       ├── PageNavigation.tsx
│   │       ├── PageNavigation.module.css
│   │       └── index.ts
│   ├── hooks/
│   │   ├── usePDFLoader.ts        # Load and parse PDF
│   │   ├── useTextExtraction.ts   # Extract text with positions
│   │   ├── usePDFEditor.ts        # Manage edit state
│   │   └── usePDFExport.ts        # Export modified PDF
│   ├── services/
│   │   ├── textExtractor.ts       # Text extraction logic
│   │   ├── pdfModifier.ts         # PDF modification logic
│   │   └── coordinateMapper.ts    # Coordinate system conversion
│   ├── types/
│   │   ├── pdf.types.ts           # PDF-related types
│   │   ├── editor.types.ts        # Editor state types
│   │   └── index.ts
│   ├── utils/
│   │   ├── fileHelpers.ts         # File handling utilities
│   │   ├── downloadHelper.ts      # Download utilities
│   │   └── constants.ts           # App constants
│   ├── styles/
│   │   ├── global.css
│   │   └── variables.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Component Responsibilities

#### **PDFUploader**
- Handle file input
- Validate PDF files
- Read file as ArrayBuffer
- Trigger upload callback

#### **PDFViewer**
- Display PDF using react-pdf
- Handle page navigation
- Show loading states
- Manage zoom levels

#### **PDFEditor** (Main Container)
- Orchestrate all components
- Manage global state
- Coordinate data flow
- Handle user interactions

#### **EditableOverlay**
- Position editable elements over PDF
- Track text changes
- Handle click-to-edit
- Sync with PDF coordinates

#### **PDFExporter**
- Apply edits using pdf-lib
- Generate modified PDF
- Trigger download
- Show export progress

#### **PageNavigation**
- Previous/Next buttons
- Page number input
- Thumbnail view (optional)
- Jump to page

---

## 📊 Data Flow and State Management

### Core State Structure

```typescript
// Main editor state
interface PDFEditorState {
  // File information
  originalFile: File | null;
  originalBytes: Uint8Array | null;
  fileName: string;
  
  // PDF metadata
  numPages: number;
  currentPage: number;
  
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
```

### Type Definitions

```typescript
// Text item extracted from PDF
interface TextItem {
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
interface EditedText {
  originalText: string;    // Original text value
  newText: string;         // Modified text value
  position: Position;      // Position in PDF coordinates
  fontSize: number;        // Font size
  fontName: string;        // Font family
  pageNumber: number;      // Page number
  color?: RGB;             // Text color (optional)
}

// Position coordinates
interface Position {
  x: number;
  y: number;
}

// RGB color
interface RGB {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
}
```

### State Management Strategy

#### Option 1: React useState (Simple Projects)
```typescript
function PDFEditor() {
  const [state, setState] = useState<PDFEditorState>(initialState);
  
  // Update methods
  const updateEdits = (id: string, edit: EditedText) => {
    setState(prev => ({
      ...prev,
      edits: new Map(prev.edits).set(id, edit)
    }));
  };
}
```

#### Option 2: useReducer (Complex Projects)
```typescript
type Action =
  | { type: 'SET_FILE'; payload: File }
  | { type: 'SET_TEXT_ITEMS'; payload: TextItem[] }
  | { type: 'ADD_EDIT'; payload: { id: string; edit: EditedText } }
  | { type: 'REMOVE_EDIT'; payload: string }
  | { type: 'SET_PAGE'; payload: number };

function pdfEditorReducer(
  state: PDFEditorState, 
  action: Action
): PDFEditorState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, originalFile: action.payload };
    case 'ADD_EDIT':
      const newEdits = new Map(state.edits);
      newEdits.set(action.payload.id, action.payload.edit);
      return { ...state, edits: newEdits };
    // ... other cases
    default:
      return state;
  }
}
```

#### Option 3: Context API (Shared State)
```typescript
interface PDFEditorContextType {
  state: PDFEditorState;
  actions: {
    loadPDF: (file: File) => Promise<void>;
    addEdit: (id: string, edit: EditedText) => void;
    removeEdit: (id: string) => void;
    exportPDF: () => Promise<void>;
  };
}

const PDFEditorContext = createContext<PDFEditorContextType | null>(null);
```

---

## 🔨 Implementation Phases

### Phase 1: Setup and Basic Display (Week 1)

#### Goals
- Project setup complete
- File upload working
- PDF display functional
- Page navigation implemented

#### Tasks

**1.1 Project Initialization**
- [ ] Create React TypeScript project
- [ ] Install dependencies
- [ ] Configure PDF.js worker
- [ ] Set up project structure
- [ ] Configure TypeScript

**1.2 File Upload Component**
```typescript
// PDFUploader.tsx
interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number;
}

export function PDFUploader({ onFileSelect }: PDFUploaderProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  return (
    <input
      type="file"
      accept=".pdf"
      onChange={handleFileChange}
    />
  );
}
```

**1.3 PDF Display Component**
```typescript
// PDFViewer.tsx
interface PDFViewerProps {
  file: File;
  pageNumber: number;
  onLoadSuccess: (numPages: number) => void;
  scale?: number;
}

export function PDFViewer({ 
  file, 
  pageNumber, 
  onLoadSuccess,
  scale = 1.0 
}: PDFViewerProps) {
  return (
    <Document
      file={file}
      onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
    >
      <Page 
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
      />
    </Document>
  );
}
```

**1.4 Page Navigation**
```typescript
// PageNavigation.tsx
interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageNavigation({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PageNavigationProps) {
  return (
    <div>
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </button>
      
      <span>{currentPage} / {totalPages}</span>
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </button>
    </div>
  );
}
```

#### Deliverables
- [ ] Working file upload
- [ ] PDF renders correctly
- [ ] Can navigate between pages
- [ ] Basic error handling

---

### Phase 2: Text Extraction (Week 2)

#### Goals
- Extract text from PDF pages
- Get accurate text positions
- Store text items with metadata
- Display extraction results

#### Tasks

**2.1 Text Extraction Service**
```typescript
// services/textExtractor.ts
import * as pdfjsLib from 'pdfjs-dist';

export async function extractTextWithPositions(
  file: File
): Promise<TextItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  
  const allTextItems: TextItem[] = [];
  
  // Process each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Extract text items with positions
    textContent.items.forEach((item: any, index: number) => {
      if (!item.str.trim()) return; // Skip empty text
      
      const transform = item.transform;
      
      allTextItems.push({
        id: `${pageNum}-${index}`,
        text: item.str,
        x: transform[4],
        y: viewport.height - transform[5], // Convert to top-left origin
        width: item.width,
        height: item.height,
        fontSize: Math.abs(transform[0]), // Font size from transform matrix
        fontName: item.fontName,
        pageNumber: pageNum
      });
    });
  }
  
  return allTextItems;
}
```

**2.2 Custom Hook for Text Extraction**
```typescript
// hooks/useTextExtraction.ts
export function useTextExtraction() {
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractText = async (file: File) => {
    setIsExtracting(true);
    setError(null);
    
    try {
      const items = await extractTextWithPositions(file);
      setTextItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setIsExtracting(false);
    }
  };

  return { textItems, isExtracting, error, extractText };
}
```

**2.3 Coordinate System Converter**
```typescript
// services/coordinateMapper.ts
export class CoordinateMapper {
  /**
   * Convert PDF coordinates (bottom-left origin) to Canvas coordinates (top-left origin)
   */
  static pdfToCanvas(
    x: number,
    y: number,
    pageHeight: number
  ): Position {
    return {
      x: x,
      y: pageHeight - y
    };
  }

  /**
   * Convert Canvas coordinates to PDF coordinates
   */
  static canvasToPdf(
    x: number,
    y: number,
    pageHeight: number
  ): Position {
    return {
      x: x,
      y: pageHeight - y
    };
  }

  /**
   * Scale coordinates based on zoom level
   */
  static scaleCoordinates(
    position: Position,
    scale: number
  ): Position {
    return {
      x: position.x * scale,
      y: position.y * scale
    };
  }
}
```

#### Deliverables
- [ ] Text extraction working
- [ ] Accurate position data
- [ ] Coordinate conversion functional
- [ ] Error handling for complex PDFs

---

### Phase 3: Editable Overlay (Week 2-3)

#### Goals
- Display editable text layer over PDF
- Handle user edits
- Track changes in state
- Visual feedback for edited text

#### Tasks

**3.1 Editable Text Item Component**
```typescript
// components/EditableOverlay/EditableTextItem.tsx
interface EditableTextItemProps {
  textItem: TextItem;
  scale: number;
  isEdited: boolean;
  onEdit: (id: string, newText: string) => void;
}

export function EditableTextItem({
  textItem,
  scale,
  isEdited,
  onEdit
}: EditableTextItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(textItem.text);

  const handleBlur = () => {
    setIsEditing(false);
    if (localText !== textItem.text) {
      onEdit(textItem.id, localText);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${textItem.x * scale}px`,
        top: `${textItem.y * scale}px`,
        fontSize: `${textItem.fontSize * scale}px`,
        minWidth: `${textItem.width * scale}px`,
        minHeight: `${textItem.height * scale}px`,
        border: isEditing ? '2px solid blue' : 
                isEdited ? '1px dashed orange' : 
                '1px dashed transparent',
        outline: 'none',
        cursor: 'text',
        backgroundColor: isEdited ? 'rgba(255, 165, 0, 0.1)' : 'transparent'
      }}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setIsEditing(true)}
      onBlur={handleBlur}
      onInput={(e) => setLocalText(e.currentTarget.textContent || '')}
    >
      {localText}
    </div>
  );
}
```

**3.2 Overlay Container Component**
```typescript
// components/EditableOverlay/EditableOverlay.tsx
interface EditableOverlayProps {
  textItems: TextItem[];
  currentPage: number;
  scale: number;
  edits: Map<string, EditedText>;
  onEdit: (id: string, newText: string) => void;
}

export function EditableOverlay({
  textItems,
  currentPage,
  scale,
  edits,
  onEdit
}: EditableOverlayProps) {
  // Filter text items for current page
  const pageTextItems = textItems.filter(
    item => item.pageNumber === currentPage
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {pageTextItems.map(item => (
        <EditableTextItem
          key={item.id}
          textItem={item}
          scale={scale}
          isEdited={edits.has(item.id)}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
```

**3.3 Edit State Management Hook**
```typescript
// hooks/usePDFEditor.ts
export function usePDFEditor() {
  const [edits, setEdits] = useState<Map<string, EditedText>>(new Map());

  const addEdit = useCallback((
    id: string,
    newText: string,
    textItem: TextItem
  ) => {
    setEdits(prev => {
      const newEdits = new Map(prev);
      newEdits.set(id, {
        originalText: textItem.text,
        newText,
        position: { x: textItem.x, y: textItem.y },
        fontSize: textItem.fontSize,
        fontName: textItem.fontName,
        pageNumber: textItem.pageNumber
      });
      return newEdits;
    });
  }, []);

  const removeEdit = useCallback((id: string) => {
    setEdits(prev => {
      const newEdits = new Map(prev);
      newEdits.delete(id);
      return newEdits;
    });
  }, []);

  const clearAllEdits = useCallback(() => {
    setEdits(new Map());
  }, []);

  const hasEdits = edits.size > 0;

  return { edits, addEdit, removeEdit, clearAllEdits, hasEdits };
}
```

#### Deliverables
- [ ] Editable overlay displays correctly
- [ ] Text positions match PDF exactly
- [ ] Edits tracked in state
- [ ] Visual feedback for edited items
- [ ] Can revert individual edits

---

### Phase 4: PDF Modification (Week 3)

#### Goals
- Modify original PDF with edits
- Preserve formatting and layout
- Handle fonts correctly
- Generate modified PDF bytes

#### Tasks

**4.1 PDF Modification Service**
```typescript
// services/pdfModifier.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function applyEditsToPDF(
  originalBytes: Uint8Array,
  edits: Map<string, EditedText>
): Promise<Uint8Array> {
  // Load the original PDF
  const pdfDoc = await PDFDocument.load(originalBytes);
  
  // Group edits by page for efficiency
  const editsByPage = new Map<number, EditedText[]>();
  edits.forEach(edit => {
    const pageEdits = editsByPage.get(edit.pageNumber) || [];
    pageEdits.push(edit);
    editsByPage.set(edit.pageNumber, pageEdits);
  });
  
  // Process each page with edits
  for (const [pageNum, pageEdits] of editsByPage) {
    const page = pdfDoc.getPage(pageNum - 1); // 0-indexed
    const { height } = page.getSize();
    
    // Embed font (use Helvetica as default)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    for (const edit of pageEdits) {
      // Convert coordinates from canvas to PDF space
      const pdfY = height - edit.position.y - edit.fontSize;
      
      // Calculate text width to determine rectangle size
      const textWidth = font.widthOfTextAtSize(edit.originalText, edit.fontSize);
      
      // Cover original text with white rectangle
      page.drawRectangle({
        x: edit.position.x,
        y: pdfY - 2, // Small offset for better coverage
        width: textWidth + 10, // Add padding
        height: edit.fontSize + 4,
        color: rgb(1, 1, 1), // White
        borderWidth: 0
      });
      
      // Draw new text
      page.drawText(edit.newText, {
        x: edit.position.x,
        y: pdfY,
        size: edit.fontSize,
        font: font,
        color: rgb(0, 0, 0) // Black text
      });
    }
  }
  
  // Save and return modified PDF
  const modifiedBytes = await pdfDoc.save();
  return modifiedBytes;
}
```

**4.2 Font Handling**
```typescript
// services/fontHandler.ts
import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';

export class FontHandler {
  private fontCache = new Map<string, PDFFont>();

  /**
   * Get or embed font in PDF
   */
  async getFont(
    pdfDoc: PDFDocument,
    fontName: string
  ): Promise<PDFFont> {
    // Check cache
    if (this.fontCache.has(fontName)) {
      return this.fontCache.get(fontName)!;
    }

    // Map PDF font names to standard fonts
    const font = await this.embedFont(pdfDoc, fontName);
    this.fontCache.set(fontName, font);
    return font;
  }

  /**
   * Embed appropriate font based on name
   */
  private async embedFont(
    pdfDoc: PDFDocument,
    fontName: string
  ): Promise<PDFFont> {
    // Map common PDF fonts to standard fonts
    const fontMap: Record<string, StandardFonts> = {
      'Helvetica': StandardFonts.Helvetica,
      'Helvetica-Bold': StandardFonts.HelveticaBold,
      'Times-Roman': StandardFonts.TimesRoman,
      'Times-Bold': StandardFonts.TimesRomanBold,
      'Courier': StandardFonts.Courier,
      'Courier-Bol