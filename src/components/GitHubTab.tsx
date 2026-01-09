import { useState, useEffect } from 'react';
import type { GitHubSettings } from '../services/storageService';
import { getGitHubSettings } from '../services/storageService';
import type { GitHubIssue } from '../services/githubService';
import { fetchColumnCards } from '../services/githubService';
import GitHubSettingsForm from './GitHubSettings';

export default function GitHubTab() {
    const [settings, setSettings] = useState<GitHubSettings | null>(null);
    const [issues, setIssues] = useState<GitHubIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const storedSettings = await getGitHubSettings();
        setSettings(storedSettings);

        if (storedSettings.token && storedSettings.columnId) {
            await loadIssues(storedSettings);
        } else {
            setShowSettings(true);
            setLoading(false);
        }
    };

    const loadIssues = async (s: GitHubSettings) => {
        setLoading(true);
        setError(null);

        try {
            const fetchedIssues = await fetchColumnCards(s);
            setIssues(fetchedIssues);
            setShowSettings(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsSave = async (newSettings: GitHubSettings) => {
        setSettings(newSettings);
        await loadIssues(newSettings);
    };

    const handleRefresh = () => {
        if (settings) {
            loadIssues(settings);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (showSettings || !settings?.token) {
        return (
            <GitHubSettingsForm
                settings={settings || { token: '', repo: '', columnId: '' }}
                onSave={handleSettingsSave}
                onCancel={settings?.token ? () => setShowSettings(false) : undefined}
            />
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {issues.length} issue{issues.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleRefresh}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Actualiser"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Paramètres"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-3 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={() => setShowSettings(true)}
                        className="mt-2 text-xs text-red-600 dark:text-red-400 underline"
                    >
                        Modifier les paramètres
                    </button>
                </div>
            )}

            {/* Issues list */}
            <div className="flex-1 overflow-y-auto">
                {issues.length === 0 && !error ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">Aucune issue dans cette colonne</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {issues.map(issue => (
                            <IssueItem key={issue.id} issue={issue} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface IssueItemProps {
    issue: GitHubIssue;
}

function IssueItem({ issue }: IssueItemProps) {
    const handleClick = () => {
        if (issue.url) {
            window.open(issue.url, '_blank');
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${issue.url ? 'cursor-pointer' : ''}`}
        >
            <div className="flex items-start gap-2">
                {/* Issue icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {issue.state === 'note' ? (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    ) : (
                        <svg className={`w-4 h-4 ${issue.state === 'open' ? 'text-green-500' : 'text-purple-500'}`} fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" />
                        </svg>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100 leading-snug">
                        {issue.title}
                    </p>

                    {/* Labels */}
                    {issue.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                            {issue.labels.map(label => (
                                <span
                                    key={label.name}
                                    className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                                    style={{
                                        backgroundColor: `#${label.color}20`,
                                        color: `#${label.color}`
                                    }}
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Meta */}
                    {issue.number > 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            #{issue.number}
                            {issue.assignee && (
                                <span className="ml-2">• {issue.assignee.login}</span>
                            )}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
