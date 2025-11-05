
import React from 'react';

interface VariantSelectorProps {
    variants: string[];
    onSelect: (variantSrc: string) => void;
    onCancel: () => void;
    onRegenerate: () => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({ variants, onSelect, onCancel, onRegenerate }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl p-6 border border-gray-700">
                <h2 className="text-2xl font-bold text-center mb-2 text-white">Choose Your Favorite</h2>
                <p className="text-center text-gray-400 mb-6">Select the version you like best, or regenerate to get new options.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {variants.map((src, index) => (
                        <div 
                            key={index} 
                            className="group cursor-pointer aspect-video bg-gray-900 rounded-lg overflow-hidden relative border-2 border-transparent hover:border-blue-500 focus-within:border-blue-600 transition-all"
                            onClick={() => onSelect(src)}
                            tabIndex={0}
                            onKeyPress={(e) => e.key === 'Enter' && onSelect(src)}
                        >
                            <img src={src} alt={`Variant ${index + 1}`} className="w-full h-full object-contain" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center">
                                <p className="text-white font-semibold mb-4 text-lg">Select Version {index + 1}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onRegenerate}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-colors"
                    >
                        Regenerate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantSelector;
