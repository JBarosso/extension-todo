import { useEffect, useRef } from 'react';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Configuration API
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {/* GitHub Section */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">GitHub</h3>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">1. Créer un Personal Access Token</h4>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>Aller sur <span className="text-blue-500">GitHub → Settings → Developer settings</span></li>
                                    <li>Cliquer sur "Personal access tokens" → "Tokens (classic)"</li>
                                    <li>Générer un nouveau token avec les scopes: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">repo</code>, <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">project</code></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">2. Trouver le Column ID</h4>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>Ouvrir votre projet GitHub (Projects classic)</li>
                                    <li>Inspecter l'élément de la colonne ou regarder l'URL en mode édition</li>
                                    <li>Le Column ID est le nombre dans l'URL de la colonne</li>
                                </ul>
                            </div>

                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                    <strong>Note:</strong> Cette extension utilise l'API Projects (classic). Les nouveaux Projects v2 utilisent une API GraphQL différente.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gmail Section */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                            </svg>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Gmail</h3>
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                                V2
                            </span>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            L'intégration Gmail sera disponible dans une prochaine version. Elle vous permettra de transformer des emails en tâches.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-sm font-medium rounded-lg
                       bg-blue-500 hover:bg-blue-600 text-white
                       transition-colors"
                    >
                        Compris !
                    </button>
                </div>
            </div>
        </div>
    );
}
