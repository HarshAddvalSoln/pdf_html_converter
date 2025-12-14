# PDF Editor

A web-based PDF editor built with React and TypeScript that allows users to edit text content directly in the browser while preserving original formatting.

## Features

- **📝 Text Editing**: Edit PDF text content with an intuitive overlay interface
- **🔄 Format Preservation**: Maintains original PDF layout, fonts, and styling
- **🌐 Browser-Based**: No server-side processing required - everything happens in your browser
- **🔒 Privacy-Friendly**: Your files never leave your device
- **⚡ High Performance**: Efficient text extraction and editing with pdf-lib and react-pdf
- **📱 Responsive**: Works on desktop and mobile devices
- **♿ Accessible**: Full keyboard navigation and screen reader support

## Technology Stack

- **React 18** with TypeScript for type safety
- **react-pdf** for PDF display and rendering
- **pdf-lib** for PDF manipulation and modification
- **pdfjs-dist** for precise text extraction and coordinates
- **Vite** for fast development and building

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

## Usage

1. **Upload PDF**: Click "Choose File" or drag and drop a PDF file
2. **Edit Text**: Enable text editing overlay and click on any text to edit
3. **Navigate**: Use page navigation controls to move between pages
4. **Export**: Download the modified PDF with your changes applied

## Key Components

- **PDFUploader**: Handles file upload with validation
- **PDFViewer**: Displays PDF using react-pdf
- **EditableOverlay**: Provides text editing interface over the PDF
- **PDFExporter**: Handles PDF export with applied edits
- **PageNavigation**: Controls for page navigation and zoom

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **Services**: Core PDF processing logic
- **Hooks**: Custom React hooks for state management
- **Components**: Reusable UI components
- **Types**: TypeScript interfaces for type safety
- **Utils**: Helper functions and constants

## Development

### Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # PDF processing services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global CSS styles
└── App.tsx             # Main application component
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [react-pdf](https://react-pdf.org/) - React PDF renderer
- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla's PDF engine
