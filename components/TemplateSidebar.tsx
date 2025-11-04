import React from 'react';
import { Template } from '../types';

interface TemplateSidebarProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isVisible: boolean;
}

const SearchIcon: React.FC = () => (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);


const TemplateSidebar: React.FC<TemplateSidebarProps> = ({ templates, onSelectTemplate, searchTerm, onSearchChange, isVisible }) => {
    if (!isVisible) return null;

    return (
        <aside className="w-96 bg-gray-900 border-r border-gray-700 flex-shrink-0 flex flex-col p-4">
            <div className="relative mb-4">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                    {templates.map(template => (
                        <div key={template.id} className="cursor-pointer group" onClick={() => onSelectTemplate(template)}>
                            <div className="aspect-[16/9] bg-gray-800 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all">
                                <img src={template.previewSrc} alt={template.name} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-sm mt-2 text-gray-300 group-hover:text-white transition-colors truncate">{template.name}</p>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default TemplateSidebar;
