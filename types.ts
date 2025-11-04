export interface Slide {
  id: string; // Unique ID
  originalSrc: string; // Original image source URL, also the first item in history
  history: string[]; // History of image sources, the last item is the current version
  name: string;
}

// Fix: Add and export the missing Template interface.
export interface Template {
  id: string;
  name: string;
  previewSrc: string;
  pages: {
    name: string;
    src: string;
  }[];
}
