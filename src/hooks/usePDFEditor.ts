import { useState, useCallback, useMemo, useRef } from 'react';
import { TextItem, EditedText, PDFEditorState, EditorAction } from '../types';
import { APP_CONFIG } from '../utils/constants';

/**
 * Hook for managing PDF editor state and user edits
 */
export function usePDFEditor(initialScale: number = APP_CONFIG.DEFAULT_SCALE) {
  const [state, setState] = useState<PDFEditorState>(() => ({
    // File information
    originalFile: null,
    originalBytes: null,
    fileName: '',

    // PDF metadata
    numPages: 0,
    currentPage: 1,

    // Extracted content
    textItems: [],

    // User edits
    edits: new Map(),

    // UI state
    isLoading: false,
    isExporting: false,
    error: null,

    // Display settings
    scale: initialScale,
    showOverlay: true,
  }));

  // Ref for tracking edits to avoid infinite loops
  const editsRef = useRef<Map<string, EditedText>>(state.edits);

  /**
   * Reducer function for state updates
   */
  const reducer = useCallback((action: EditorAction): void => {
    setState(prevState => {
      switch (action.type) {
        case 'SET_FILE':
          return {
            ...prevState,
            originalFile: action.payload,
            fileName: action.payload.name,
            error: null
          };

        case 'SET_FILE_BYTES':
          return {
            ...prevState,
            originalBytes: action.payload
          };

        case 'SET_TEXT_ITEMS':
          return {
            ...prevState,
            textItems: action.payload
          };

        case 'SET_PAGE':
          return {
            ...prevState,
            currentPage: Math.max(1, Math.min(action.payload, prevState.numPages))
          };

        case 'SET_SCALE':
          return {
            ...prevState,
            scale: Math.max(APP_CONFIG.MIN_SCALE, Math.min(action.payload, APP_CONFIG.MAX_SCALE))
          };

        case 'TOGGLE_OVERLAY':
          return {
            ...prevState,
            showOverlay: !prevState.showOverlay
          };

        case 'ADD_EDIT':
          const newEdits = new Map(prevState.edits);
          newEdits.set(action.payload.id, action.payload.edit);
          return {
            ...prevState,
            edits: newEdits
          };

        case 'REMOVE_EDIT':
          const editsWithoutRemoved = new Map(prevState.edits);
          editsWithoutRemoved.delete(action.payload);
          return {
            ...prevState,
            edits: editsWithoutRemoved
          };

        case 'CLEAR_EDITS':
          return {
            ...prevState,
            edits: new Map()
          };

        case 'SET_LOADING':
          return {
            ...prevState,
            isLoading: action.payload
          };

        case 'SET_EXPORTING':
          return {
            ...prevState,
            isExporting: action.payload
          };

        case 'SET_ERROR':
          return {
            ...prevState,
            error: action.payload
          };

        case 'SET_METADATA':
          return {
            ...prevState,
            metadata: action.payload
          };

        case 'RESET_STATE':
          return {
            originalFile: null,
            originalBytes: null,
            fileName: '',
            numPages: 0,
            currentPage: 1,
            textItems: [],
            edits: new Map(),
            isLoading: false,
            isExporting: false,
            error: null,
            scale: initialScale,
            showOverlay: true,
          };

        default:
          return prevState;
      }
    });
  }, [initialScale]);

  /**
   * Set PDF file
   */
  const setFile = useCallback((file: File) => {
    reducer({ type: 'SET_FILE', payload: file });
  }, [reducer]);

  /**
   * Set original PDF bytes
   */
  const setFileBytes = useCallback((bytes: Uint8Array) => {
    reducer({ type: 'SET_FILE_BYTES', payload: bytes });
  }, [reducer]);

  /**
   * Set extracted text items
   */
  const setTextItems = useCallback((textItems: TextItem[]) => {
    reducer({ type: 'SET_TEXT_ITEMS', payload: textItems });
  }, [reducer]);

  /**
   * Set number of pages
   */
  const setNumPages = useCallback((numPages: number) => {
    setState(prev => ({
      ...prev,
      numPages,
      currentPage: Math.min(prev.currentPage, numPages)
    }));
  }, []);

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback((pageNumber: number) => {
    reducer({ type: 'SET_PAGE', payload: pageNumber });
  }, [reducer]);

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, prev.numPages)
    }));
  }, []);

  /**
   * Navigate to previous page
   */
  const prevPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(prev.currentPage - 1, 1)
    }));
  }, []);

  /**
   * Set zoom scale
   */
  const setScale = useCallback((scale: number) => {
    reducer({ type: 'SET_SCALE', payload: scale });
  }, [reducer]);

  /**
   * Zoom in
   */
  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: Math.min(prev.scale + APP_CONFIG.SCALE_STEP, APP_CONFIG.MAX_SCALE)
    }));
  }, []);

  /**
   * Zoom out
   */
  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: Math.max(prev.scale - APP_CONFIG.SCALE_STEP, APP_CONFIG.MIN_SCALE)
    }));
  }, []);

  /**
   * Reset zoom to default
   */
  const resetZoom = useCallback(() => {
    reducer({ type: 'SET_SCALE', payload: APP_CONFIG.DEFAULT_SCALE });
  }, [reducer]);

  /**
   * Toggle overlay visibility
   */
  const toggleOverlay = useCallback(() => {
    reducer({ type: 'TOGGLE_OVERLAY' });
  }, [reducer]);

  /**
   * Add or update an edit
   */
  const addEdit = useCallback((id: string, newText: string, textItem: TextItem) => {
    const edit: EditedText = {
      originalText: textItem.text,
      newText,
      position: { x: textItem.x, y: textItem.y },
      fontSize: textItem.fontSize,
      fontName: textItem.fontName,
      pageNumber: textItem.pageNumber,
      color: textItem.color
    };

    reducer({ type: 'ADD_EDIT', payload: { id, edit } });
  }, [reducer]);

  /**
   * Remove an edit
   */
  const removeEdit = useCallback((id: string) => {
    reducer({ type: 'REMOVE_EDIT', payload: id });
  }, [reducer]);

  /**
   * Clear all edits
   */
  const clearAllEdits = useCallback(() => {
    reducer({ type: 'CLEAR_EDITS' });
  }, [reducer]);

  /**
   * Set loading state
   */
  const setLoading = useCallback((isLoading: boolean) => {
    reducer({ type: 'SET_LOADING', payload: isLoading });
  }, [reducer]);

  /**
   * Set exporting state
   */
  const setExporting = useCallback((isExporting: boolean) => {
    reducer({ type: 'SET_EXPORTING', payload: isExporting });
  }, [reducer]);

  /**
   * Set error message
   */
  const setError = useCallback((error: string | null) => {
    reducer({ type: 'SET_ERROR', payload: error });
  }, [reducer]);

  /**
   * Set metadata
   */
  const setMetadata = useCallback((metadata: any) => {
    reducer({ type: 'SET_METADATA', payload: metadata });
  }, [reducer]);

  /**
   * Reset entire state
   */
  const resetState = useCallback(() => {
    reducer({ type: 'RESET_STATE' });
  }, [reducer]);

  // Update ref when edits change
  editsRef.current = state.edits;

  // Memoized derived values
  const derivedState = useMemo(() => ({
    hasFile: !!state.originalFile,
    hasEdits: state.edits.size > 0,
    editCount: state.edits.size,
    isFirstPage: state.currentPage === 1,
    isLastPage: state.currentPage === state.numPages,
    canZoomIn: state.scale < APP_CONFIG.MAX_SCALE,
    canZoomOut: state.scale > APP_CONFIG.MIN_SCALE,
    currentPageTextItems: state.textItems.filter(item => item.pageNumber === state.currentPage),
    editsForCurrentPage: new Map(
      Array.from(state.edits.entries()).filter(([_, edit]) => edit.pageNumber === state.currentPage)
    ),
    percentComplete: state.numPages > 0 ? (state.currentPage / state.numPages) * 100 : 0
  }), [state]);

  return {
    // State
    state,
    ...derivedState,

    // Actions
    setFile,
    setFileBytes,
    setTextItems,
    setNumPages,
    goToPage,
    nextPage,
    prevPage,
    setScale,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleOverlay,
    addEdit,
    removeEdit,
    clearAllEdits,
    setLoading,
    setExporting,
    setError,
    setMetadata,
    resetState,

    // Direct access to maps for performance
    edits: editsRef.current
  };
}