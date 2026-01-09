// Gmail API service using Chrome Identity API

export interface GmailEmail {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    fromEmail: string;
    snippet: string;
    date: number;
    isRead: boolean;
    isStarred: boolean;
    labels: string[];
    locallyModified?: boolean;
    modifiedAt?: number;
}

// Authenticate and get OAuth token
export async function authenticateGmail(): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else if (result && typeof result === 'string') {
                resolve(result);
            } else if (result && typeof result === 'object' && 'token' in result) {
                resolve(result.token as string);
            } else {
                reject(new Error('No token received'));
            }
        });
    });
}

// Remove cached token (for logout)
export async function revokeGmailAuth(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.identity.removeCachedAuthToken({ token }, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                // Revoke token on Google's servers
                fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
                    .then(() => resolve())
                    .catch(reject);
            }
        });
    });
}

// Fetch emails based on query
export async function fetchEmails(token: string, query: string = 'is:starred'): Promise<GmailEmail[]> {
    try {
        // Get message IDs - reduced to 20 to avoid rate limiting
        const listResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!listResponse.ok) {
            throw new Error(`Gmail API error: ${listResponse.status}`);
        }

        const listData = await listResponse.json();
        const messages = listData.messages || [];

        if (messages.length === 0) {
            return [];
        }

        // Fetch details in smaller batches to avoid rate limiting
        const batchSize = 5;
        const emails: GmailEmail[] = [];

        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);

            const batchPromises = batch.map(async (msg: { id: string }) => {
                try {
                    const detailResponse = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (!detailResponse.ok) {
                        console.error(`Failed to fetch message ${msg.id}: ${detailResponse.status}`);
                        return null;
                    }

                    const detail = await detailResponse.json();
                    return parseEmailFromGmailAPI(detail);
                } catch (error) {
                    console.error(`Error fetching message ${msg.id}:`, error);
                    return null;
                }
            });

            const batchResults = await Promise.all(batchPromises);
            emails.push(...batchResults.filter((email): email is GmailEmail => email !== null));

            // Add delay between batches to avoid rate limiting
            if (i + batchSize < messages.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        return emails;
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

// Parse Gmail API response to our Email format
function parseEmailFromGmailAPI(message: any): GmailEmail | null {
    try {
        const headers = message.payload?.headers || [];
        const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';

        const fromHeader = getHeader('From');
        const fromMatch = fromHeader.match(/(.*?)\s*<(.+?)>/) || [null, fromHeader, fromHeader];
        const fromName = fromMatch[1]?.trim() || fromMatch[2];
        const fromEmail = fromMatch[2] || fromHeader;

        return {
            id: message.id,
            threadId: message.threadId,
            subject: getHeader('Subject') || '(No subject)',
            from: fromName,
            fromEmail: fromEmail,
            snippet: message.snippet || '',
            date: parseInt(message.internalDate),
            isRead: !message.labelIds?.includes('UNREAD'),
            isStarred: message.labelIds?.includes('STARRED') || false,
            labels: message.labelIds || []
        };
    } catch (error) {
        console.error('Error parsing email:', error);
        return null;
    }
}

// Mark email as read
export async function markAsRead(token: string, messageId: string): Promise<void> {
    await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                removeLabelIds: ['UNREAD']
            })
        }
    );
}

// Mark email as unread
export async function markAsUnread(token: string, messageId: string): Promise<void> {
    await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                addLabelIds: ['UNREAD']
            })
        }
    );
}

// Toggle star on email
export async function toggleStar(token: string, messageId: string, starred: boolean): Promise<void> {
    await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                starred
                    ? { addLabelIds: ['STARRED'] }
                    : { removeLabelIds: ['STARRED'] }
            )
        }
    );
}

// Fetch full email body
export async function fetchEmailBody(token: string, messageId: string): Promise<{ body: string; isHtml: boolean }> {
    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Gmail API error: ${response.status}`);
    }

    const message = await response.json();

    // Extract body from payload
    const getBody = (payload: any): { body: string; isHtml: boolean } => {
        if (payload.body?.data) {
            return {
                body: atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/')),
                isHtml: payload.mimeType === 'text/html'
            };
        }

        if (payload.parts) {
            // Try to find HTML part first, then plain text
            const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html');
            if (htmlPart?.body?.data) {
                return {
                    body: atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/')),
                    isHtml: true
                };
            }

            const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain');
            if (textPart?.body?.data) {
                return {
                    body: atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/')),
                    isHtml: false
                };
            }
        }

        return { body: '', isHtml: false };
    };

    return getBody(message.payload);
}

// Send reply to email
export async function sendReply(token: string, messageId: string, threadId: string, replyBody: string, to: string, subject: string): Promise<void> {
    // Create email in RFC 2822 format
    const email = [
        `To: ${to}`,
        `Subject: Re: ${subject}`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        '',
        replyBody
    ].join('\r\n');

    // Encode to base64url
    const encodedEmail = btoa(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                raw: encodedEmail,
                threadId: threadId
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to send reply: ${response.status}`);
    }
}

// Delete email (move to trash)
export async function deleteEmail(token: string, messageId: string): Promise<void> {
    const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete email: ${response.status}`);
    }
}
