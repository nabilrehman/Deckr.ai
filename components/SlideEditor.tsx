

import React, { useState, useEffect, useRef } from 'react';
import { Slide } from '../types';
import { getGenerativeVariations, getPersonalizedVariations, compositeImage, DebugLog } from '../services/geminiService';
import VariantSelector from './VariantSelector';
import DebugLogViewer from './DebugLogViewer';

interface ActiveSlideViewProps {
  slide: Slide;
  onNewSlideVersion: (slideId: string, newSrc: string) => void;
  onUndo: (slideId: string) => void;
  onResetSlide: (slideId: string) => void;
}

const Spinner: React.FC<{ size?: string }> = ({ size = 'h-5 w-5' }) => (
    <svg className={`animate-spin text-white ${size}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ResetIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186A1.002 1.002 0 0116.4 8.89l-1.044-.26a5.002 5.002 0 00-8.6-1.527l.096.097V5a1 1 0 01-2 0V3a1 1 0 011-1zm12 16a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186 1.002 1.002 0 01.35-1.39l1.044.26a5.002 5.002 0 008.6 1.527l-.096-.097V15a1 1 0 012 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
);

const UndoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
    </svg>
);

/**
 * Normalizes an image data source by drawing it onto a canvas and exporting it as a clean PNG.
 * This "launders" the image, removing any potential metadata or non-standard formatting from
 * the original source (especially important for AI-generated images) to ensure it's a valid
 * input for subsequent API calls.
 * @param src The source of the image (e.g., a base64 data URL).
 * @returns A promise that resolves with the clean, base64-encoded PNG data URL.
 */
const launderImageSrc = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Failed to get canvas context for image processing.'));
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load the selected image for processing.'));
        };
        // Use crossOrigin to handle potential CORS issues if images were from external sources.
        img.crossOrigin = 'Anonymous';
        img.src = src;
    });
};

const ActiveSlideView: React.FC<ActiveSlideViewProps> = ({ slide, onNewSlideVersion, onUndo, onResetSlide }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [variants, setVariants] = useState<string[] | null>(null);
  const [companyWebsite, setCompanyWebsite] = useState('');

  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[] | null>(null);

  const currentSrc = slide.history[slide.history.length - 1];
  const hasHistory = slide.history.length > 1;

  useEffect(() => {
    setPrompt('');
    setError(null);
    setSelection(null);
    setCompanyWebsite('');
  }, [slide.id]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setGenerationStatus('Analyzing request...');

    try {
        const { images, logs } = await getGenerativeVariations(prompt, currentSrc);
        setVariants(images);
        if (isDebugMode) {
            setDebugLogs(logs);
        }
    } catch (err: any) {
        if (err.message && err.message.includes('quota')) {
             setError("Request failed due to API rate limits. Please try again in a moment.");
        } else {
            setError(err.message || 'An unknown error occurred.');
        }
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setSelection(null); 
    }
  };

  const handlePersonalize = async () => {
    if (!companyWebsite.trim()) {
      setError('Please enter a company website.');
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
        setGenerationStatus(`Researching ${companyWebsite}...`);
        const { images, logs } = await getPersonalizedVariations(companyWebsite, currentSrc);
        setVariants(images);
        if (isDebugMode) {
            setDebugLogs(logs);
        }
    } catch (err: any) {
        if (err.message && err.message.includes('quota')) {
             setError("Request failed due to API rate limits. Please try again in a moment.");
        } else {
            setError(err.message || 'An unknown error occurred during personalization.');
        }
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if(event.target) {
      event.target.value = '';
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const overlayImageSrc = e.target?.result as string;
        if (!overlayImageSrc) {
            setError("Could not read the selected image file.");
            return;
        }

        setIsGenerating(true);
        setGenerationStatus('Generating placement options...');
        setError(null);
        try {
            const placementPrompt = prompt.trim() || 'Place the uploaded image in a suitable location on the slide.';
            const basePrompts = [
              placementPrompt,
              `${placementPrompt} (Place it in a slightly different position or size as an alternative.)`,
              `${placementPrompt} (Provide a third placement option.)`,
            ];

            const newImageSrcs: string[] = [];
            for (const p of basePrompts) {
                newImageSrcs.push(await compositeImage(currentSrc, overlayImageSrc, p));
            }
            setVariants(newImageSrcs);

        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while placing the image.');
        } finally {
            setIsGenerating(false);
            setGenerationStatus('');
        }
    };
    reader.onerror = () => {
        setError("Failed to read the file.");
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => { onResetSlide(slide.id); };
  const handleUndo = () => { onUndo(slide.id); };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isGenerating) return;
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsDrawing(true);
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setSelection({ x, y, width: 0, height: 0 });
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint) return;
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(startPoint.x, currentX);
    const y = Math.min(startPoint.y, currentY);
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);

    setSelection({ x, y, width, height });
  };
  
  const handleMouseUp = () => {
    setIsDrawing(false);
    if (selection && (selection.width < 5 || selection.height < 5)) {
        setSelection(null);
    }
  };

  const handleVariantSelected = async (variantSrc: string) => {
    setVariants(null); // Close modal immediately for better UX
    setIsGenerating(true);
    setGenerationStatus('Finalizing new version...');
    setError(null);

    try {
        const cleanSrc = await launderImageSrc(variantSrc);
        onNewSlideVersion(slide.id, cleanSrc);
    } catch (err: any) {
        console.error("Error processing selected image:", err);
        setError(`Failed to finalize the selected image. ${err.message}`);
    } finally {
        setIsGenerating(false);
        setGenerationStatus('');
    }
  };

  const handleCancelVariants = () => {
    setVariants(null);
  };


  return (
    <>
        <div className="bg-gray-800 flex-grow flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div 
                ref={imageRef}
                className="relative aspect-video bg-gray-900 rounded-lg shadow-lg flex items-center justify-center w-full max-w-4xl mx-auto select-none cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
            <img ref={imageRef} src={currentSrc} alt={slide.name} className="object-contain w-full h-full rounded-lg pointer-events-none" />
            {isGenerating && !variants && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
                    <Spinner size="h-10 w-10" />
                    <span className="text-sm mt-4 text-gray-300">{generationStatus}</span>
                </div>
            )}
            {selection && (
                <div 
                    className="absolute border-2 border-dashed border-blue-400 bg-blue-500/20 pointer-events-none"
                    style={{
                        left: selection.x,
                        top: selection.y,
                        width: selection.width,
                        height: selection.height
                    }}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelection(null);
                        }}
                        className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center shadow-lg pointer-events-auto hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-white"
                        title="Clear selection"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
            {!selection && !isDrawing && !isGenerating && (
                <div className="absolute bottom-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none animate-pulse">
                    Click and drag to select an area to edit
                </div>
            )}
            </div>

            <div className="w-full max-w-2xl mx-auto mt-6 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white truncate pr-2" title={slide.name}>
                        Editing: {slide.name}
                    </h3>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <label htmlFor="debug-mode" className="text-xs text-gray-400 cursor-pointer">Debug Mode</label>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input 
                                    type="checkbox" 
                                    name="debug-mode" 
                                    id="debug-mode" 
                                    checked={isDebugMode}
                                    onChange={() => setIsDebugMode(!isDebugMode)}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                />
                                <label htmlFor="debug-mode" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                            </div>
                            <style>{`.toggle-checkbox:checked { right: 0; border-color: #2563eb; } .toggle-checkbox:checked + .toggle-label { background-color: #2563eb; }`}</style>
                        </div>
                        {hasHistory && (
                            <button onClick={handleUndo} className="flex items-center text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={isGenerating}>
                                <UndoIcon /> Undo
                            </button>
                        )}
                        {hasHistory && (
                            <button onClick={handleReset} className="flex items-center text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={isGenerating}>
                                <ResetIcon/> Reset Slide
                            </button>
                        )}
                    </div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                    <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={selection ? "Describe the change for the selected area..." : "e.g., 'Add a blue rocket' or 'Place uploaded image on the top right'"}
                    className="w-full p-3 text-sm bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-gray-200 placeholder-gray-400 h-24"
                    disabled={isGenerating}
                    />
                    {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {isGenerating && generationStatus.startsWith('Analyzing') ? <><Spinner size="h-5 w-5 -ml-1 mr-3" /> Processing...</> : 'Generate with AI'}
                        </button>
                        <button
                            onClick={handleAddImageClick}
                            disabled={isGenerating}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-500 text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Upload an image (e.g. a complex logo) to add to the slide. Use the text box above for placement instructions."
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -ml-1 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            Upload & Place
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                    </div>
                </div>
                 <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                    <label htmlFor="company-website" className="text-sm font-medium text-gray-300 block mb-2">
                        Or, automatically tailor this slide for a company:
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            id="company-website"
                            type="text"
                            value={companyWebsite}
                            onChange={(e) => setCompanyWebsite(e.target.value)}
                            placeholder="e.g., dhl.com"
                            className="flex-grow p-3 text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-200 placeholder-gray-400"
                            disabled={isGenerating}
                        />
                        <button
                            onClick={handlePersonalize}
                            disabled={isGenerating || !companyWebsite}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                             {isGenerating && generationStatus.startsWith('Researching') ? <><Spinner size="h-5 w-5 -ml-1 mr-3" /> Personalizing...</> : 'Personalize'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        {variants && (
            <VariantSelector
                variants={variants}
                onSelect={handleVariantSelected}
                onCancel={handleCancelVariants}
                onRegenerate={handleGenerate}
            />
        )}
        {debugLogs && (
            <DebugLogViewer logs={debugLogs} onClose={() => setDebugLogs(null)} />
        )}
    </>
  );
};

export default ActiveSlideView;