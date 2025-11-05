
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Slide } from '../types';

interface PresentationViewProps {
  slides: Slide[];
  activeSlideId: string;
  onExit: () => void;
}

// Icons for controls
const ChevronLeftIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PresentationView: React.FC<PresentationViewProps> = ({ slides, activeSlideId, onExit }) => {
  const findInitialIndex = useCallback(() => slides.findIndex(s => s.id === activeSlideId), [slides, activeSlideId]);
  const [currentIndex, setCurrentIndex] = useState(findInitialIndex);
  const presentationRef = useRef<HTMLDivElement>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Effect for handling keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'Escape') {
        // The fullscreenchange listener will handle the exit
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrev, onExit]);

  // Effect for managing fullscreen mode
  useEffect(() => {
    const element = presentationRef.current;
    if (!element) return;

    // Enter fullscreen
    element.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });

    const handleFullscreenChange = () => {
        // If user exits fullscreen (e.g., via Esc), exit presentation mode
        if (!document.fullscreenElement) {
            onExit();
        }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Ensure we exit fullscreen if the component unmounts for any reason
      if (document.fullscreenElement === element) {
        document.exitFullscreen();
      }
    };
  }, [onExit]);


  if (currentIndex === -1) {
    useEffect(() => {
        onExit();
    }, [onExit]);
    return null;
  }
  
  const currentSlide = slides[currentIndex];
  const currentSrc = currentSlide.history[currentSlide.history.length - 1];

  return (
    <div ref={presentationRef} className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
      <img src={currentSrc} alt={currentSlide.name} className="max-w-full max-h-full object-contain" />

      {/* Controls */}
      <div className="absolute top-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
        <button onClick={onExit} className="p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors">
          <CloseIcon />
        </button>
      </div>

      <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
        <button onClick={goToPrev} className="p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors disabled:opacity-20 disabled:cursor-not-allowed" disabled={currentIndex === 0}>
          <ChevronLeftIcon />
        </button>
      </div>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity">
        <button onClick={goToNext} className="p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors disabled:opacity-20 disabled:cursor-not-allowed" disabled={currentIndex === slides.length - 1}>
          <ChevronRightIcon />
        </button>
      </div>

      <div className="absolute bottom-4 text-center text-sm bg-black/50 px-3 py-1 rounded-full">
        <span>{currentIndex + 1} / {slides.length}</span>
      </div>
    </div>
  );
};

export default PresentationView;
