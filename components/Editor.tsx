import React from 'react';
import { Slide } from '../types';
import SlidePreviewList from './SlidePreviewList';
import ActiveSlideView from './SlideEditor';

interface EditorProps {
  slides: Slide[];
  activeSlide: Slide;
  onSlideSelect: (id: string) => void;
  onNewSlideVersion: (id: string, newSrc: string) => void;
  onUndo: (id: string) => void;
  onResetSlide: (id: string) => void;
}

const Editor: React.FC<EditorProps> = ({ slides, activeSlide, onSlideSelect, onNewSlideVersion, onUndo, onResetSlide }) => {
  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Left Vertical Slide Preview */}
      <SlidePreviewList
        slides={slides}
        activeSlideId={activeSlide.id}
        onSlideSelect={onSlideSelect}
      />
      
      {/* Main Content Area: Active Slide Editing View */}
      <ActiveSlideView
        slide={activeSlide}
        onNewSlideVersion={onNewSlideVersion}
        onUndo={onUndo}
        onResetSlide={onResetSlide}
      />
    </div>
  );
};

export default Editor;