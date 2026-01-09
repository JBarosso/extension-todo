import { fetchColumnCards } from './services/githubService';
import { fetchEmails } from './services/gmailService';
import { getGitHubSettings, getTodos } from './services/storageService';

// Set sidePanel behavior
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Initialize alarms
chrome.runtime.onInstalled.addListener(() => {
    console.log('[Background] Extension installed, creating alarms');
    chrome.alarms.create('refreshData', { periodInMinutes: 15 });
});

// Alarm handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('[Background] Alarm triggered:', alarm.name);

    if (alarm.name === 'refreshData') {
        await checkGitHubUpdates();
        await checkGmailUpdates();
    } else if (alarm.name.startsWith('reminder_')) {
        await handleReminderAlarm(alarm.name);
    }
});

// Reminder checking logic
async function handleReminderAlarm(alarmName: string) {
    const parts = alarmName.split('_');
    if (parts.length === 3) {
        const todoId = parts[1];
        const reminderMinutes = parseInt(parts[2]);

        const todos = await getTodos();
        const todo = todos.find(t => t.id === todoId);

        if (todo && !todo.completed) {
            await chrome.notifications.create(alarmName, {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Rappel de tâche',
                message: `${todo.title} commence dans ${formatReminderTime(reminderMinutes)}`,
                priority: 2,
                requireInteraction: false
            });
        }
    }
}

// GitHub polling logic
async function checkGitHubUpdates() {
    try {
        const settings = await getGitHubSettings();
        if (!settings.token || !settings.columnId) return;

        console.log('[Background] Checking GitHub updates...');
        const issues = await fetchColumnCards(settings);
        const currentIds = issues.map(i => i.id);

        // Get stored IDs
        const result = await chrome.storage.local.get('lastKnownIssues');
        const lastKnownIssues = result.lastKnownIssues;
        const lastKnownIds: string[] = Array.isArray(lastKnownIssues) ? lastKnownIssues : [];

        // Check for new IDs
        const newIssues = issues.filter(i => !lastKnownIds.includes(i.id));

        if (newIssues.length > 0) {
            console.log('[Background] New issues found:', newIssues.length);

            // Notify for first new issue (summary)
            const title = newIssues.length === 1
                ? 'Nouvelle tâche GitHub'
                : `${newIssues.length} nouvelles tâches GitHub`;

            const message = newIssues.length === 1
                ? newIssues[0].title
                : `${newIssues[0].title} et ${newIssues.length - 1} autres...`;

            await chrome.notifications.create(`github_${Date.now()}`, {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: title,
                message: message,
                priority: 2
            });
        }

        // Update storage
        await chrome.storage.local.set({ lastKnownIssues: currentIds });

    } catch (error) {
        console.error('[Background] Error checking GitHub:', error);
    }
}

// Gmail polling logic
async function checkGmailUpdates() {
    try {
        // We only check if we can get a token silently (already authenticated)
        const token = await new Promise<string | null>((resolve) => {
            chrome.identity.getAuthToken({ interactive: false }, (result) => {
                if (chrome.runtime.lastError || !result) {
                    resolve(null);
                } else {
                    // Check if result is the token string (UserInfo) or token object
                    resolve(typeof result === 'string' ? result : (result as any).token);
                }
            });
        });

        if (!token) {
            console.log('[Background] Not authenticated for Gmail, skipping check');
            return;
        }

        console.log('[Background] Checking Gmail updates...');
        // Check unread emails specifically for notifications
        const emails = await fetchEmails(token, 'is:unread');
        const currentIds = emails.map(e => e.id);

        // Get stored IDs
        const result = await chrome.storage.local.get('lastKnownEmails');
        const lastKnownEmails = result.lastKnownEmails;
        const lastKnownIds: string[] = Array.isArray(lastKnownEmails) ? lastKnownEmails : [];

        // Check for new IDs
        const newEmails = emails.filter(e => !lastKnownIds.includes(e.id));

        if (newEmails.length > 0) {
            console.log('[Background] New emails found:', newEmails.length);

            const title = newEmails.length === 1
                ? 'Nouveau mail reçu'
                : `${newEmails.length} nouveaux mails`;

            const message = newEmails.length === 1
                ? `De: ${newEmails[0].from}\n${newEmails[0].subject}`
                : `Dernier de: ${newEmails[0].from}`;

            await chrome.notifications.create(`gmail_${Date.now()}`, {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: title,
                message: message,
                priority: 2
            });
        }

        // Update storage
        await chrome.storage.local.set({ lastKnownEmails: currentIds });

    } catch (error) {
        console.error('[Background] Error checking Gmail:', error);
    }
}

function formatReminderTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(minutes / 1440);
        return `${days} jour${days > 1 ? 's' : ''}`;
    }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
    // Open sidepanel
    const windows = await chrome.windows.getAll();
    if (windows.length > 0 && typeof windows[0]?.id === 'number') {
        const winId = windows[0].id;
        await chrome.sidePanel.open({ windowId: winId });
    }
    chrome.notifications.clear(notificationId);
});
