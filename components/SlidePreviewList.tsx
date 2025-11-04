import React from 'react';
import { Slide } from '../types';

interface SlidePreviewListProps {
  slides: Slide[];
  activeSlideId: string;
  onSlideSelect: (id: string) => void;
}

const SlidePreviewList: React.FC<SlidePreviewListProps> = ({ slides, activeSlideId, onSlideSelect }) => {
  return (
    <aside className="w-48 bg-gray-900 flex-shrink-0 p-2 overflow-y-auto border-r border-gray-700">
      <div className="space-y-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => onSlideSelect(slide.id)}
            className={`cursor-pointer rounded-md p-1 border-2 transition-colors ${
              slide.id === activeSlideId
                ? 'border-blue-500'
                : 'border-transparent hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 font-mono mt-1">{index + 1}</span>
                <div className="aspect-video bg-gray-800 rounded-sm overflow-hidden w-full">
                    <img src={slide.history[slide.history.length - 1]} alt={slide.name} className="object-cover w-full h-full" />
                </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SlidePreviewList;