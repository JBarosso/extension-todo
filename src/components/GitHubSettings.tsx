import { useState, useEffect } from 'react';
import type { GitHubSettings } from '../services/storageService';
import { saveGitHubSettings } from '../services/storageService';
import { fetchProjectColumns } from '../services/githubService';

interface GitHubSettingsFormProps {
    settings: GitHubSettings;
    onSave: (settings: GitHubSettings) => void;
    onCancel?: () => void;
}

export default function GitHubSettingsForm({ settings, onSave, onCancel }: GitHubSettingsFormProps) {
    const [token, setToken] = useState(settings.token);
    const [repo, setRepo] = useState(settings.repo);
    const [columnId, setColumnId] = useState(settings.columnId);
    const [saving, setSaving] = useState(false);
    const [columns, setColumns] = useState<{ id: string; name: string }[]>([]);
    const [loadingColumns, setLoadingColumns] = useState(false);
    const [columnsError, setColumnsError] = useState<string | null>(null);

    // Fetch columns when token and repo are set
    useEffect(() => {
        if (token.trim() && repo.trim() && repo.includes('/')) {
            loadColumns();
        } else {
            setColumns([]);
        }
    }, [token, repo]);

    const loadColumns = async () => {
        setLoadingColumns(true);
        setColumnsError(null);
        try {
            const cols = await fetchProjectColumns({ token: token.trim(), repo: repo.trim(), columnId: '' });
            setColumns(cols);
        } catch (err) {
            setColumnsError(err instanceof Error ? err.message : 'Erreur de chargement');
            setColumns([]);
        } finally {
            setLoadingColumns(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const newSettings: GitHubSettings = {
            token: token.trim(),
            repo: repo.trim(),
            columnId: columnId.trim()
        };

        await saveGitHubSettings(newSettings);
        onSave(newSettings);
        setSaving(false);
    };

    const isValid = token.trim() && columnId.trim() && repo.trim();

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                    <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Configuration GitHub</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Connectez votre projet GitHub pour voir les issues
                </p>
            </div>

            <div className="space-y-3">
                {/* PAT Token */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Personal Access Token (PAT) *
                    </label>
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Comment obtenir un PAT ?</strong>
                        </p>
                        <ol className="text-xs text-blue-600 dark:text-blue-400 mt-1 space-y-0.5 list-decimal list-inside">
                            <li>Aller sur GitHub → Settings → Developer settings</li>
                            <li>Personal access tokens → Tokens (classic)</li>
                            <li>Generate new token avec scopes: <code className="px-1 bg-blue-100 dark:bg-blue-800 rounded">repo</code>, <code className="px-1 bg-blue-100 dark:bg-blue-800 rounded">project</code>, <code className="px-1 bg-blue-100 dark:bg-blue-800 rounded">read:project</code></li>
                        </ol>
                        <a
                            href="https://github.com/settings/tokens/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Créer un token →
                        </a>
                    </div>
                </div>

                {/* Repository */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Repository *
                    </label>
                    <input
                        type="text"
                        value={repo}
                        onChange={(e) => setRepo(e.target.value)}
                        placeholder="owner/repo"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Format: votre-username/nom-du-repo
                    </p>
                </div>

                {/* Column Selection */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Colonne du projet *
                    </label>

                    {loadingColumns ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                            Chargement des colonnes...
                        </div>
                    ) : columns.length > 0 ? (
                        <select
                            value={columnId}
                            onChange={(e) => setColumnId(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Sélectionnez une colonne...</option>
                            {columns.map(col => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={columnId}
                            onChange={(e) => setColumnId(e.target.value)}
                            placeholder="projectNumber:fieldId:optionId"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    )}

                    {columnsError && (
                        <p className="text-xs text-red-500 mt-1">{columnsError}</p>
                    )}

                    {!loadingColumns && columns.length === 0 && token && repo && (
                        <p className="text-xs text-gray-400 mt-1">
                            Entrez le Token et le Repo pour voir les colonnes disponibles
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 text-sm font-medium rounded-lg
                       border border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300
                       hover:bg-gray-50 dark:hover:bg-gray-800
                       transition-colors"
                    >
                        Annuler
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!isValid || saving}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg
                     bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                     text-white disabled:text-gray-500
                     transition-colors"
                >
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}
