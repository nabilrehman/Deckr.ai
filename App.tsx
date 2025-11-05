

import React, { useState, useCallback, useMemo } from 'react';
import { Slide } from './types';
import Header from './components/Header';
import Editor from './components/Editor';
import DeckUploader from './components/DeckUploader';
import PresentationView from './components/PresentationView';

declare const jspdf: any;

const App: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);

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
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageAspectRatio = pageWidth / pageHeight;

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const imgSrc = slide.history[slide.history.length - 1];

            const img = new Image();
            img.src = imgSrc;
            // Use a promise to wait for the image to load to get its dimensions
            await new Promise(resolve => { img.onload = resolve; });

            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;
            const imgAspectRatio = imgWidth / imgHeight;

            let finalImgWidth, finalImgHeight, xOffset, yOffset;

            // Compare aspect ratios to determine how to scale and position
            if (imgAspectRatio > pageAspectRatio) {
                // Image is wider than the page, so it should fill the page width
                finalImgWidth = pageWidth;
                finalImgHeight = pageWidth / imgAspectRatio;
                xOffset = 0;
                yOffset = (pageHeight - finalImgHeight) / 2;
            } else {
                // Image is taller or same aspect ratio as the page, so it should fill the page height
                finalImgHeight = pageHeight;
                finalImgWidth = pageHeight * imgAspectRatio;
                yOffset = 0;
                xOffset = (pageWidth - finalImgWidth) / 2;
            }

            if (i > 0) {
                pdf.addPage();
            }
            
            pdf.addImage(imgSrc, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
        }
        
        pdf.save('ai-deck-editor-presentation.pdf');

    } catch (error: any) {
        console.error("Failed to generate PDF:", error);
        alert(`Sorry, there was an error creating the PDF. ${error.message}`);
    } finally {
        setIsDownloadingPdf(false);
    }
}, [slides]);


  const handlePresent = useCallback(() => {
    if (slides.length > 0 && activeSlideId) {
      setIsPresenting(true);
    }
  }, [slides, activeSlideId]);

  const handleExitPresentation = useCallback(() => {
    setIsPresenting(false);
  }, []);

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
        onPresent={handlePresent}
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

      {isPresenting && activeSlideId && (
        <PresentationView
          slides={slides}
          activeSlideId={activeSlideId}
          onExit={handleExitPresentation}
        />
      )}
    </div>
  );
};

export default App;
