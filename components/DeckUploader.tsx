import React, { useState, useCallback } from 'react';
import { Slide } from '../types';

declare const pdfjsLib: any;

interface DeckUploaderProps {
  onDeckUpload: (slides: Slide[]) => void;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const DeckUploader: React.FC<DeckUploaderProps> = ({ onDeckUpload }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    const newSlides: Slide[] = [];
    const filePromises: Promise<void>[] = [];

    const processPdf = async (file: File) => {
        const fileReader = new FileReader();
        return new Promise<void>((resolve, reject) => {
            fileReader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    const pagePromises: Promise<void>[] = [];
                    const pdfSlides: Slide[] = [];

                    for (let i = 1; i <= pdf.numPages; i++) {
                        pagePromises.push((async (pageNum) => {
                            const page = await pdf.getPage(pageNum);
                            const viewport = page.getViewport({ scale: 1.5 });
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            if (context) {
                                await page.render({ canvasContext: context, viewport }).promise;
                                const id = `${file.name}-p${pageNum}-${Date.now()}`;
                                const src = canvas.toDataURL('image/png');
                                pdfSlides.push({ id, originalSrc: src, history: [src], name: `Page ${pageNum}` });
                            }
                        })(i));
                    }
                    await Promise.all(pagePromises);
                    // Add sorted slides to the main array
                    newSlides.push(...pdfSlides);
                    resolve();
                } catch (err) {
                    console.error("PDF processing error:", err);
                    reject(new Error("Failed to process PDF file. It might be corrupted or in an unsupported format."));
                }
            };
            fileReader.readAsArrayBuffer(file);
        });
    };

    const processImage = (file: File) => {
        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                const id = `${file.name}-${Date.now()}`;
                newSlides.push({ id, originalSrc: src, history: [src], name: file.name.split('.')[0] });
                resolve();
            };
            reader.readAsDataURL(file);
        });
    };

    for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
            filePromises.push(processPdf(file));
        } else if (file.type.startsWith('image/')) {
            filePromises.push(processImage(file));
        }
    }
    
    try {
        await Promise.all(filePromises);
        if (newSlides.length > 0) {
            onDeckUpload(newSlides.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
        } else if (filePromises.length > 0){
            setError("No valid image or PDF files were selected.");
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }

  }, [onDeckUpload]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4">
        <div 
            className={`w-full max-w-2xl text-center p-8 md:p-12 border-2 border-dashed rounded-2xl transition-all duration-300 ${isDragging ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {isLoading ? (
                <div>
                    <Spinner />
                    <p className="mt-4 text-lg text-gray-300">Processing your slides...</p>
                </div>
            ) : (
                <>
                    <div className="flex justify-center mb-4">
                        <svg className="w-16 h-16 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Upload Your Deck</h2>
                    <p className="text-gray-400 mb-6">Drag & drop a PDF or image files here</p>
                    <div className="relative flex items-center justify-center my-4">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>
                    <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors">
                        Choose Files
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="application/pdf,image/*" onChange={e => processFiles(e.target.files)} />
                    {error && <p className="text-red-400 text-sm mt-6">{error}</p>}
                    <p className="text-xs text-gray-500 mt-6">Supported formats: PDF, PNG, JPG</p>
                </>
            )}
        </div>
    </div>
  );
};

export default DeckUploader;