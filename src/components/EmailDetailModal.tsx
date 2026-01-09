import { useState, useEffect } from 'react';
import type { GmailEmail } from '../services/gmailService';
import { fetchEmailBody, sendReply } from '../services/gmailService';

interface EmailDetailModalProps {
    email: GmailEmail;
    token: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function EmailDetailModal({ email, token, onClose, onUpdate }: EmailDetailModalProps) {
    const [emailBody, setEmailBody] = useState<{ body: string; isHtml: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadEmailBody();
    }, [email.id]);

    const loadEmailBody = async () => {
        setLoading(true);
        try {
            const body = await fetchEmailBody(token, email.id);
            setEmailBody(body);
        } catch (error) {
            console.error('Error loading email body:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        setSending(true);
        try {
            await sendReply(token, email.id, email.threadId, replyText, email.fromEmail, email.subject);
            setReplyText('');
            onUpdate();
            alert('Réponse envoyée !');
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Erreur lors de l\'envoi de la réponse');
        } finally {
            setSending(false);
        }
    };

    const handleOpenInGmail = () => {
        window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {email.subject}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            De : {email.from} ({email.fromEmail})
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {new Date(email.date).toLocaleString('fr-FR')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={handleOpenInGmail}
                            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Ouvrir dans Gmail"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
                        </div>
                    ) : emailBody ? (
                        <div className="prose dark:prose-invert max-w-none">
                            {emailBody.isHtml ? (
                                <div
                                    dangerouslySetInnerHTML={{ __html: emailBody.body }}
                                    className="text-sm text-gray-700 dark:text-gray-300"
                                    style={{ wordWrap: 'break-word' }}
                                />
                            ) : (
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans" style={{ wordWrap: 'break-word' }}>
                                    {emailBody.body}
                                </pre>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Impossible de charger le contenu de l'email</p>
                    )}
                </div>

                {/* Reply section */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Répondre
                    </label>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Écrivez votre réponse..."
                        rows={4}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || sending}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 
                                       disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white 
                                       disabled:text-gray-500 transition-colors"
                        >
                            {sending ? 'Envoi...' : 'Envoyer'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
