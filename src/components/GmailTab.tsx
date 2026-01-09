import { useState } from 'react';
import type { GmailEmail } from '../services/gmailService';
import { authenticateGmail, fetchEmails, markAsRead, markAsUnread, toggleStar, revokeGmailAuth, deleteEmail } from '../services/gmailService';
import EmailDetailModal from './EmailDetailModal';

type FilterType = 'starred' | 'unread';

export default function GmailTab() {
    const [authenticated, setAuthenticated] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [emails, setEmails] = useState<GmailEmail[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterType>('starred');
    const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);

    const handleAuthenticate = async () => {
        setLoading(true);
        setError(null);
        try {
            const authToken = await authenticateGmail();
            setToken(authToken);
            setAuthenticated(true);
            await loadEmails(authToken, filter);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur d\'authentification');
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (token) {
            try {
                await revokeGmailAuth(token);
            } catch (err) {
                console.error('Error revoking token:', err);
            }
        }
        setToken(null);
        setAuthenticated(false);
        setEmails([]);
    };

    const loadEmails = async (authToken: string, filterType: FilterType) => {
        setLoading(true);
        setError(null);
        try {
            // Only search in inbox, excluding spam and trash
            const query = filterType === 'starred'
                ? 'in:inbox is:starred'
                : 'in:inbox is:unread';
            const fetchedEmails = await fetchEmails(authToken, query);
            setEmails(fetchedEmails);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = async (newFilter: FilterType) => {
        setFilter(newFilter);
        if (token) {
            await loadEmails(token, newFilter);
        }
    };

    const handleRefresh = () => {
        if (token) {
            loadEmails(token, filter);
        }
    };

    const handleToggleStar = async (email: GmailEmail) => {
        if (!token) return;
        try {
            await toggleStar(token, email.id, !email.isStarred);
            setEmails(emails.map(e =>
                e.id === email.id ? { ...e, isStarred: !e.isStarred } : e
            ));
        } catch (err) {
            console.error('Error toggling star:', err);
        }
    };

    const handleToggleRead = async (email: GmailEmail) => {
        if (!token) return;
        try {
            if (email.isRead) {
                await markAsUnread(token, email.id);
            } else {
                await markAsRead(token, email.id);
            }
            setEmails(emails.map(e =>
                e.id === email.id ? { ...e, isRead: !e.isRead } : e
            ));
        } catch (err) {
            console.error('Error toggling read:', err);
        }
    };

    const handleOpenEmail = (email: GmailEmail) => {
        setSelectedEmail(email);
    };

    const handleDelete = async (email: GmailEmail) => {
        if (!token) return;
        try {
            await deleteEmail(token, email.id);
            setEmails(emails.filter(e => e.id !== email.id));
        } catch (err) {
            console.error('Error deleting email:', err);
        }
    };

    if (!authenticated) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                    </svg>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Connectez-vous à Gmail
                </h3>

                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[250px] mb-6">
                    Authentifiez-vous pour accéder à vos emails étoilés et non lus
                </p>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 max-w-[300px]">
                        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <button
                    onClick={handleAuthenticate}
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white disabled:text-gray-500 transition-colors flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Connexion...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                            </svg>
                            Se connecter avec Google
                        </>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {emails.length} email{emails.length !== 1 ? 's' : ''}
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
                        onClick={handleLogout}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Déconnexion"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => handleFilterChange('starred')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${filter === 'starred'
                        ? 'text-red-600 dark:text-red-400 border-b-2 border-red-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    ⭐ Étoilés
                </button>
                <button
                    onClick={() => handleFilterChange('unread')}
                    className={`flex-1 px-4 py-2 text-xs font-medium transition-colors ${filter === 'unread'
                        ? 'text-red-600 dark:text-red-400 border-b-2 border-red-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    📧 Non lus
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mx-3 mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Email list */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Aucun email {filter === 'starred' ? 'étoilé' : 'non lu'}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {emails.map(email => (
                            <EmailItem
                                key={email.id}
                                email={email}
                                onToggleStar={handleToggleStar}
                                onToggleRead={handleToggleRead}
                                onOpen={handleOpenEmail}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Email Detail Modal */}
            {selectedEmail && token && (
                <EmailDetailModal
                    email={selectedEmail}
                    token={token}
                    onClose={() => setSelectedEmail(null)}
                    onUpdate={() => {
                        if (token) loadEmails(token, filter);
                    }}
                />
            )}
        </div>
    );
}

interface EmailItemProps {
    email: GmailEmail;
    onToggleStar: (email: GmailEmail) => void;
    onToggleRead: (email: GmailEmail) => void;
    onOpen: (email: GmailEmail) => void;
    onDelete: (email: GmailEmail) => void;
}

function EmailItem({ email, onToggleStar, onToggleRead, onOpen, onDelete }: EmailItemProps) {
    return (
        <div className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
            <div className="flex items-start gap-2">
                {/* Star button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(email);
                    }}
                    className="mt-0.5 flex-shrink-0 p-0.5 text-gray-400 hover:text-yellow-500 transition-colors"
                >
                    {email.isStarred ? (
                        <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    )}
                </button>

                {/* Email content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(email)}>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm truncate ${!email.isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                            {email.from}
                        </span>
                        {!email.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                        )}
                    </div>
                    <p className={`text-xs truncate ${!email.isRead ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                        {email.subject}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                        {email.snippet}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(email.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>

                {/* Read/Unread toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleRead(email);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                    title={email.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                >
                    {email.isRead ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>

                {/* Delete button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(email);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Supprimer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
