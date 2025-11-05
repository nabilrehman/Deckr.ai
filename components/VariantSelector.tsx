

import React, { useState } from 'react';

interface VariantSelectorProps {
    variants: string[];
    onSelect: (variantSrc: string) => void;
    onCancel: () => void;
    onRegenerate: () => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({ variants, onSelect, onCancel, onRegenerate }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl p-6 md:p-8 border border-gray-700 flex flex-col">
                <h2 className="text-2xl font-bold text-center mb-2 text-white">Choose Your Favorite</h2>
                <p className="text-center text-gray-400 mb-6">Select the version you like best, or regenerate to get new options.</p>

                {/* Main Preview Area */}
                <div className="w-full aspect-video bg-gray-900 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                    <img src={variants[activeIndex]} alt={`Selected Variant ${activeIndex + 1}`} className="w-full h-full object-contain" />
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {variants.map((src, index) => (
                        <div 
                            key={index} 
                            className={`group cursor-pointer aspect-video bg-gray-900 rounded-lg overflow-hidden relative transition-all duration-200 ${
                                activeIndex === index ? 'ring-4 ring-blue-500' : 'ring-2 ring-transparent hover:ring-blue-600'
                            }`}
                            onClick={() => setActiveIndex(index)}
                        >
                            <img src={src} alt={`Variant ${index + 1}`} className="w-full h-full object-contain" />
                             <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                                 activeIndex === index ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                             }`}>
                                <p className="text-white font-semibold text-lg">View Version {index + 1}</p>
                            </div>
                        </div>
                    ))}
                </div>


                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                    >
                        Cancel
                    </button>
                     <button
                        onClick={() => onSelect(variants[activeIndex])}
                        className="px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors order-first sm:order-none w-full sm:w-auto"
                    >
                        Select this Version
                    </button>
                    <button
                        onClick={onRegenerate}
                        className="px-6 py-2.5 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                    >
                        Regenerate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantSelector;