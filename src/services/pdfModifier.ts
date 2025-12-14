import { PDFDocument, PDFPage, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { EditedText, RGB } from '../types';

/**
 * Service for modifying PDF content with user edits
 */
export class PDFModifier {
  private fontCache = new Map<string, PDFFont>();

  /**
   * Apply text edits to a PDF document
   */
  async applyEditsToPDF(
    originalBytes: Uint8Array,
    edits: Map<string, EditedText>
  ): Promise<Uint8Array> {
    if (edits.size === 0) {
      return originalBytes; // No changes needed
    }

    try {
      // Load the original PDF
      const pdfDoc = await PDFDocument.load(originalBytes, {
        // Keep original PDF structure as much as possible
        ignoreEncryption: false,
        updateMetadata: false
      });

      // Group edits by page for efficiency
      const editsByPage = new Map<number, EditedText[]>();
      edits.forEach(edit => {
        const pageEdits = editsByPage.get(edit.pageNumber) || [];
        pageEdits.push(edit);
        editsByPage.set(edit.pageNumber, pageEdits);
      });

      // Process each page with edits
      for (const [pageNum, pageEdits] of editsByPage) {
        await this.applyEditsToPage(pdfDoc, pageNum - 1, pageEdits); // 0-indexed
      }

      // Save and return modified PDF
      const modifiedBytes = await pdfDoc.save({
        // Use incremental updates to preserve original structure
        useObjectStreams: false,
        addDefaultPage: false
      });

      return modifiedBytes;
    } catch (error) {
      throw new Error(`Failed to apply edits to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply edits to a specific page
   */
  private async applyEditsToPage(
    pdfDoc: PDFDocument,
    pageIndex: number,
    pageEdits: EditedText[]
  ): Promise<void> {
    if (pageIndex >= pdfDoc.getPageCount()) {
      throw new Error(`Page ${pageIndex + 1} does not exist in PDF`);
    }

    const page = pdfDoc.getPage(pageIndex);
    const { height } = page.getSize();

    // Sort edits by Y position (top to bottom) for better rendering
    pageEdits.sort((a, b) => b.position.y - a.position.y);

    // Get or embed appropriate font
    const font = await this.getFont(pdfDoc, pageEdits[0]?.fontName || 'Helvetica');

    // Apply each edit
    for (const edit of pageEdits) {
      try {
        await this.applySingleEdit(page, edit, font, height);
      } catch (error) {
        console.error(`Failed to apply edit ${edit.pageNumber}: ${edit.originalText} -> ${edit.newText}`, error);
        // Continue with other edits
      }
    }
  }

  /**
   * Apply a single text edit to a page
   */
  private async applySingleEdit(
    page: PDFPage,
    edit: EditedText,
    font: PDFFont,
    pageHeight: number
  ): Promise<void> {
    // Convert coordinates from canvas to PDF space
    // PDF coordinates use bottom-left origin
    const pdfY = pageHeight - edit.position.y - edit.fontSize;

    // Calculate text dimensions
    const originalTextWidth = font.widthOfTextAtSize(edit.originalText, edit.fontSize);
    const newTextWidth = font.widthOfTextAtSize(edit.newText, edit.fontSize);

    // Cover original text with white rectangle
    const coverRect = {
      x: edit.position.x - 1, // Small padding
      y: pdfY - 2, // Adjust for font baseline
      width: Math.max(originalTextWidth, newTextWidth) + 4, // Add padding
      height: edit.fontSize + 4
    };

    page.drawRectangle({
      x: coverRect.x,
      y: coverRect.y,
      width: coverRect.width,
      height: coverRect.height,
      color: rgb(1, 1, 1), // White
      borderWidth: 0
    });

    // Draw new text
    const textColor = edit.color ? rgb(edit.color.r, edit.color.g, edit.color.b) : rgb(0, 0, 0);

    page.drawText(edit.newText, {
      x: edit.position.x,
      y: pdfY,
      size: edit.fontSize,
      font: font,
      color: textColor,
      // Use text rendering mode for better quality
      renderText: 'fill'
    });
  }

  /**
   * Get or embed font in PDF document
   */
  private async getFont(pdfDoc: PDFDocument, fontName: string): Promise<PDFFont> {
    // Check cache
    const cacheKey = `${pdfDoc.hashCode}-${fontName}`;
    if (this.fontCache.has(cacheKey)) {
      return this.fontCache.get(cacheKey)!;
    }

    // Map PDF font names to standard fonts
    let standardFont: StandardFonts;
    const normalizedFontName = fontName.toLowerCase().replace(/[-\s]/g, '');

    if (normalizedFontName.includes('helvetica') && normalizedFontName.includes('bold')) {
      standardFont = StandardFonts.HelveticaBold;
    } else if (normalizedFontName.includes('helvetica') && normalizedFontName.includes('oblique')) {
      standardFont = StandardFonts.HelveticaOblique;
    } else if (normalizedFontName.includes('helvetica') && normalizedFontName.includes('boldoblique')) {
      standardFont = StandardFonts.HelveticaBoldOblique;
    } else if (normalizedFontName.includes('helvetica')) {
      standardFont = StandardFonts.Helvetica;
    } else if (normalizedFontName.includes('times') && normalizedFontName.includes('bold')) {
      standardFont = StandardFonts.TimesRomanBold;
    } else if (normalizedFontName.includes('times') && normalizedFontName.includes('italic')) {
      standardFont = StandardFonts.TimesRomanItalic;
    } else if (normalizedFontName.includes('times') && normalizedFontName.includes('bolditalic')) {
      standardFont = StandardFonts.TimesRomanBoldItalic;
    } else if (normalizedFontName.includes('times')) {
      standardFont = StandardFonts.TimesRoman;
    } else if (normalizedFontName.includes('courier') && normalizedFontName.includes('bold')) {
      standardFont = StandardFonts.CourierBold;
    } else if (normalizedFontName.includes('courier') && normalizedFontName.includes('oblique')) {
      standardFont = StandardFonts.CourierOblique;
    } else if (normalizedFontName.includes('courier') && normalizedFontName.includes('boldoblique')) {
      standardFont = StandardFonts.CourierBoldOblique;
    } else if (normalizedFontName.includes('courier')) {
      standardFont = StandardFonts.Courier;
    } else {
      // Default to Helvetica for unknown fonts
      standardFont = StandardFonts.Helvetica;
    }

    try {
      const font = await pdfDoc.embedFont(standardFont);
      this.fontCache.set(cacheKey, font);
      return font;
    } catch (error) {
      console.warn(`Failed to embed font ${fontName}, falling back to Helvetica:`, error);
      const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      this.fontCache.set(cacheKey, fallbackFont);
      return fallbackFont;
    }
  }

  /**
   * Create a PDF copy with annotations for the edits
   */
  async createAnnotatedPDF(
    originalBytes: Uint8Array,
    edits: Map<string, EditedText>
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(originalBytes);
    const editsArray = Array.from(edits.values());

    if (editsArray.length === 0) {
      return originalBytes;
    }

    // Group edits by page
    const editsByPage = new Map<number, EditedText[]>();
    edits.forEach(edit => {
      const pageEdits = editsByPage.get(edit.pageNumber) || [];
      pageEdits.push(edit);
      editsByPage.set(edit.pageNumber, pageEdits);
    });

    // Add annotations to each page
    for (const [pageNum, pageEdits] of editsByPage) {
      const page = pdfDoc.getPage(pageNum - 1);
      const { height } = page.getSize();

      for (const edit of pageEdits) {
        const pdfY = height - edit.position.y - edit.fontSize;

        // Add highlight annotation to show changed text
        const rect = {
          x: edit.position.x,
          y: pdfY - 2,
          width: 100, // Will be adjusted based on text width
          height: edit.fontSize + 4
        };

        // Note: pdf-lib annotation support is limited
        // This is a simplified implementation
        page.drawRectangle({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          color: rgb(1, 1, 0, 0.3), // Light yellow highlight
          borderWidth: 1,
          borderColor: rgb(1, 0.8, 0, 0.5)
        });
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Clean up font cache
   */
  cleanup(): void {
    this.fontCache.clear();
  }
}