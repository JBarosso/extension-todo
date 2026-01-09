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
        // Get message IDs
        const listResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
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

        // Fetch details for each message
        const emailPromises = messages.map(async (msg: { id: string }) => {
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
                console.error(`Failed to fetch message ${msg.id}`);
                return null;
            }

            const detail = await detailResponse.json();
            return parseEmailFromGmailAPI(detail);
        });

        const emails = await Promise.all(emailPromises);
        return emails.filter((email): email is GmailEmail => email !== null);
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
