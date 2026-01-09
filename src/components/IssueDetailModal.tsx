import { useState, useEffect } from 'react';
import type { GitHubIssue } from '../services/githubService';
import {
    fetchIssueDetails,
    fetchIssueComments,
    updateIssueLabels,
    addIssueComment,
    fetchRepoLabels,
    closeIssue
} from '../services/githubService';

interface IssueDetailModalProps {
    issue: GitHubIssue;
    token: string;
    repo: string;
    onClose: () => void;
    onUpdate: () => void;
}

interface IssueDetail {
    body: string;
    labels: { name: string; color: string }[];
    user: { login: string; avatar_url: string };
    created_at: string;
    updated_at: string;
}

interface Comment {
    id: number;
    user: { login: string; avatar_url: string };
    body: string;
    created_at: string;
}

export default function IssueDetailModal({ issue, token, repo, onClose, onUpdate }: IssueDetailModalProps) {
    const [details, setDetails] = useState<IssueDetail | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [availableLabels, setAvailableLabels] = useState<{ name: string; color: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showLabelPicker, setShowLabelPicker] = useState(false);

    const [owner, repoName] = repo.split('/');

    useEffect(() => {
        loadIssueData();
    }, []);

    const loadIssueData = async () => {
        if (issue.number === 0) {
            setLoading(false);
            return;
        }

        try {
            const [detailsData, commentsData, labelsData] = await Promise.all([
                fetchIssueDetails(token, owner, repoName, issue.number),
                fetchIssueComments(token, owner, repoName, issue.number),
                fetchRepoLabels(token, owner, repoName)
            ]);

            setDetails(detailsData);
            setComments(commentsData);
            setAvailableLabels(labelsData);
        } catch (error) {
            console.error('Error loading issue data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim() || issue.number === 0) return;

        setSubmitting(true);
        try {
            await addIssueComment(token, owner, repoName, issue.number, commentText);
            setCommentText('');
            await loadIssueData();
            onUpdate();
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleLabel = async (labelName: string) => {
        if (!details || issue.number === 0) return;

        const currentLabels = details.labels.map(l => l.name);
        const newLabels = currentLabels.includes(labelName)
            ? currentLabels.filter(l => l !== labelName)
            : [...currentLabels, labelName];

        try {
            await updateIssueLabels(token, owner, repoName, issue.number, newLabels);
            await loadIssueData();
            onUpdate();
        } catch (error) {
            console.error('Error updating labels:', error);
        }
    };

    const handleCloseIssue = async () => {
        if (issue.number === 0) return;

        try {
            await closeIssue(token, owner, repoName, issue.number);
            await loadIssueData();
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error closing issue:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <svg className={`w-5 h-5 flex-shrink-0 ${issue.state === 'open' ? 'text-green-500' : 'text-purple-500'}`} fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" />
                            </svg>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {issue.title}
                            </h2>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            #{issue.number}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {issue.url && (
                            <a
                                href={issue.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                            >
                                Ouvrir sur GitHub
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                    ) : issue.number === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Note ou draft issue</p>
                    ) : (
                        <>
                            {/* Labels */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Labels</h3>
                                    <button
                                        onClick={() => setShowLabelPicker(!showLabelPicker)}
                                        className="text-xs text-blue-500 hover:text-blue-600"
                                    >
                                        {showLabelPicker ? 'Fermer' : 'Modifier'}
                                    </button>
                                </div>

                                {details?.labels && details.labels.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {details.labels.map(label => (
                                            <span
                                                key={label.name}
                                                className="px-2 py-1 text-xs font-medium rounded-full"
                                                style={{
                                                    backgroundColor: `#${label.color}30`,
                                                    color: `#${label.color}`
                                                }}
                                            >
                                                {label.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">Aucun label</p>
                                )}

                                {showLabelPicker && (
                                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-48 overflow-y-auto">
                                        <div className="space-y-1">
                                            {availableLabels.map(label => {
                                                const isSelected = details?.labels.some(l => l.name === label.name);
                                                return (
                                                    <button
                                                        key={label.name}
                                                        onClick={() => handleToggleLabel(label.name)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                                    >
                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <span
                                                            className="px-2 py-0.5 text-xs font-medium rounded-full"
                                                            style={{
                                                                backgroundColor: `#${label.color}30`,
                                                                color: `#${label.color}`
                                                            }}
                                                        >
                                                            {label.name}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {details?.body && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap" style={{ wordWrap: 'break-word' }}>
                                        {details.body}
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Commentaires ({comments.length})
                                </h3>
                                <div className="space-y-3">
                                    {comments.map(comment => (
                                        <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <img
                                                    src={comment.user.avatar_url}
                                                    alt={comment.user.login}
                                                    className="w-6 h-6 rounded-full"
                                                />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {comment.user.login}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(comment.created_at).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                                {comment.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Add comment */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ajouter un commentaire</h3>
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Écrivez votre commentaire..."
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                             bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows={3}
                                />
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim() || submitting}
                                        className="px-4 py-2 text-sm font-medium rounded-lg
                                                 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                                                 text-white disabled:text-gray-500
                                                 transition-colors"
                                    >
                                        {submitting ? 'Envoi...' : 'Commenter'}
                                    </button>
                                    {issue.state === 'open' && (
                                        <button
                                            onClick={handleCloseIssue}
                                            className="px-4 py-2 text-sm font-medium rounded-lg
                                                     bg-purple-500 hover:bg-purple-600
                                                     text-white
                                                     transition-colors"
                                        >
                                            Close Issue
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
