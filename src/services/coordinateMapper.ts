import { Position } from '../types';

/**
 * Utility class for converting between coordinate systems
 * PDF coordinates use bottom-left origin, Canvas/Screen use top-left origin
 */
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

  /**
   * Convert screen coordinates to PDF coordinates accounting for scale
   */
  static screenToPdf(
    screenX: number,
    screenY: number,
    pageHeight: number,
    scale: number,
    containerOffset: Position = { x: 0, y: 0 }
  ): Position {
    // Adjust for container offset and scale
    const canvasX = (screenX - containerOffset.x) / scale;
    const canvasY = (screenY - containerOffset.y) / scale;

    // Convert to PDF coordinates
    return this.canvasToPdf(canvasX, canvasY, pageHeight);
  }

  /**
   * Convert PDF coordinates to screen coordinates accounting for scale
   */
  static pdfToScreen(
    pdfX: number,
    pdfY: number,
    pageHeight: number,
    scale: number,
    containerOffset: Position = { x: 0, y: 0 }
  ): Position {
    // Convert to canvas coordinates
    const canvas = this.pdfToCanvas(pdfX, pdfY, pageHeight);

    // Scale and add container offset
    return {
      x: canvas.x * scale + containerOffset.x,
      y: canvas.y * scale + containerOffset.y
    };
  }

  /**
   * Calculate distance between two points
   */
  static distance(point1: Position, point2: Position): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if a point is within a rectangle
   */
  static isPointInRect(
    point: Position,
    rect: { x: number; y: number; width: number; height: number }
  ): boolean {
    return point.x >= rect.x &&
           point.x <= rect.x + rect.width &&
           point.y >= rect.y &&
           point.y <= rect.y + rect.height;
  }

  /**
   * Get bounding rectangle that encompasses multiple points
   */
  static getBoundingRect(points: Position[]): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    if (points.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
}