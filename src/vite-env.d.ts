/// <reference types="vite/client" />

// Import types for react-pdf
declare module 'pdfjs-dist' {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
}