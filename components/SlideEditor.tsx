
import React, { useState, useEffect, useRef } from 'react';
import { Slide } from '../types';
import { editImage, researchAndRefinePrompt, compositeImage, inpaintImage } from '../services/geminiService';
import VariantSelector from './VariantSelector';

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


const ActiveSlideView: React.FC<ActiveSlideViewProps> = ({ slide, onNewSlideVersion, onUndo, onResetSlide }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  
  // State for selection box
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // State for variations
  const [variants, setVariants] = useState<string[] | null>(null);

  const currentSrc = slide.history[slide.history.length - 1];
  const hasHistory = slide.history.length > 1;

  useEffect(() => {
    setPrompt('');
    setError(null);
    setSources([]);
    setSelection(null); // Reset selection when slide changes
  }, [slide.id]);


  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    setSources([]);

    try {
        setGenerationStatus('Analyzing your request...');
        const { refinedPrompt, sources: newSources, editType } = await researchAndRefinePrompt(prompt);
        if (newSources.length > 0) setSources(newSources);
        
        let newImageSrcs: string[] = [];

        // Use inpainting tool only if the AI determines it's a 'local' edit AND a selection exists.
        if (editType === 'local' && selection && imageRef.current) {
            setGenerationStatus('Generating variations...');
            const { naturalWidth, naturalHeight, clientWidth, clientHeight } = imageRef.current;
            
            // Calculate scaling factors
            const scaleX = naturalWidth / clientWidth;
            const scaleY = naturalHeight / clientHeight;

            const scaledSelection = {
                x: selection.x * scaleX,
                y: selection.y * scaleY,
                width: selection.width * scaleX,
                height: selection.height * scaleY,
                naturalWidth,
                naturalHeight,
            };

            newImageSrcs = await inpaintImage(currentSrc, scaledSelection, refinedPrompt);

        } else {
            // Use global edit tool for 'global' edits or if no selection is made.
            setGenerationStatus('Generating variations...');
            newImageSrcs = await editImage(currentSrc, refinedPrompt);
        }

        setVariants(newImageSrcs);

    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
      setGenerationStatus('');
      setSelection(null); // Clear selection after generation
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
        setSources([]); 
        try {
            const placementPrompt = prompt.trim() || 'Place the uploaded image in a suitable location on the slide.';
            const newImageSrcs = await compositeImage(currentSrc, overlayImageSrc, placementPrompt);
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

  // Mouse events for selection
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
    // If the selection is very small, treat it as a click and clear it
    if (selection && (selection.width < 5 || selection.height < 5)) {
        setSelection(null);
    }
  };

  const handleVariantSelected = (variantSrc: string) => {
    onNewSlideVersion(slide.id, variantSrc);
    setVariants(null);
  };

  const handleCancelVariants = () => {
    setVariants(null);
  };


  return (
    <>
        <div className="bg-gray-800 flex-grow flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div 
                ref={imageContainerRef}
                className="relative aspect-video bg-gray-900 rounded-lg shadow-lg flex items-center justify-center w-full max-w-4xl mx-auto select-none cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp} // End drawing if mouse leaves container
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
                            e.stopPropagation(); // prevent re-triggering mousedown
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
                    {isGenerating ? <><Spinner size="h-5 w-5 -ml-1 mr-3" /> Processing...</> : 'Generate with AI'}
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
                {sources.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-800 rounded-md border border-gray-600">
                        <h4 className="text-xs font-semibold text-gray-400 mb-2">
                            Information sourced from Google Search:
                        </h4>
                        <ul className="space-y-1 max-h-20 overflow-y-auto">
                            {sources.map((source, index) => (
                                source.web ? (
                                    <li key={index}>
                                        <a
                                            href={source.web.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-400 hover:underline block truncate"
                                            title={source.web.uri}
                                        >
                                            {source.web.title || source.web.uri}
                                        </a>
                                    </li>
                                ) : null
                            ))}
                        </ul>
                    </div>
                )}
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
    </>
  );
};

export default ActiveSlideView;
