import React from 'react';
import { DebugLog } from '../services/geminiService';

interface DebugLogViewerProps {
    logs: DebugLog[];
    onClose: () => void;
}

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const DebugLogViewer: React.FC<DebugLogViewerProps> = ({ logs, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl h-[80vh] border border-gray-700 flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-white">Analysis Log</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="space-y-6">
                        {logs.map((log, index) => (
                            <div key={index} className="bg-gray-900 rounded-md border border-gray-700">
                                <h3 className="text-md font-semibold text-blue-400 px-4 py-2 bg-gray-700/50 rounded-t-md">{log.title}</h3>
                                <pre className="text-xs text-gray-300 p-4 whitespace-pre-wrap break-words font-mono">
                                    <code>{log.content}</code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DebugLogViewer;
