

import React, { useState, useCallback, useMemo } from 'react';
import { Slide } from './types';
import Header from './components/Header';
import Editor from './components/Editor';
import DeckUploader from './components/DeckUploader';

declare const jspdf: any;

const App: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDeckUpload = useCallback((newSlides: Slide[]) => {
    setSlides(newSlides);
    setActiveSlideId(newSlides[0]?.id || null);
  }, []);

  const handleNewSlideVersion = useCallback((slideId: string, newSrc: string) => {
    setSlides(prevSlides =>
      prevSlides.map(slide =>
        slide.id === slideId ? { ...slide, history: [...slide.history, newSrc] } : slide
      )
    );
  }, []);

  const handleUndo = useCallback((slideId: string) => {
    setSlides(prevSlides =>
      prevSlides.map(slide => {
        if (slide.id === slideId && slide.history.length > 1) {
          const newHistory = [...slide.history];
          newHistory.pop();
          return { ...slide, history: newHistory };
        }
        return slide;
      })
    );
  }, []);

  const handleResetSlide = useCallback((slideId: string) => {
    setSlides(prevSlides =>
        prevSlides.map(slide =>
            slide.id === slideId ? { ...slide, history: [slide.originalSrc] } : slide
        )
    );
  }, []);


  const handleResetProject = useCallback(() => {
     if (window.confirm("Are you sure you want to start a new deck? All your changes will be lost.")) {
      setSlides([]);
      setActiveSlideId(null);
    }
  }, []);
  
  const handleDownloadPdf = useCallback(async () => {
    if (slides.length === 0) return;
    setIsDownloadingPdf(true);
    
    try {
        const { jsPDF } = jspdf;
        // Default PDF orientation is landscape, assuming presentation slides
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: 'a4'
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const imgSrc = slide.history[slide.history.length - 1];

            if (i > 0) {
                pdf.addPage();
            }
            // Add image to fill the page, maintaining aspect ratio
            pdf.addImage(imgSrc, 'PNG', 0, 0, pageWidth, pageHeight);
        }
        
        pdf.save('ai-deck-editor-presentation.pdf');

    } catch (error: any) {
        console.error("Failed to generate PDF:", error);
        alert(`Sorry, there was an error creating the PDF. ${error.message}`);
    } finally {
        setIsDownloadingPdf(false);
    }
  }, [slides]);

  const activeSlide = useMemo(() => {
    return slides.find(s => s.id === activeSlideId);
  }, [slides, activeSlideId]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header 
        onReset={handleResetProject} 
        hasActiveProject={slides.length > 0} 
        onDownloadPdf={handleDownloadPdf}
        isDownloading={isDownloadingPdf}
      />
      <main className="flex-grow overflow-hidden bg-gray-800">
        {slides.length > 0 && activeSlide ? (
          <Editor
            slides={slides}
            activeSlide={activeSlide}
            onSlideSelect={setActiveSlideId}
            onNewSlideVersion={handleNewSlideVersion}
            onUndo={handleUndo}
            onResetSlide={handleResetSlide}
          />
        ) : (
          <DeckUploader onDeckUpload={handleDeckUpload} />
        )}
      </main>
    </div>
  );
};

export default App;