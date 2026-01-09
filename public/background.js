// Background service worker for Chrome extension

// Set sidePanel behavior to open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Handle alarm events (for reminders)
chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('[Background] Alarm triggered:', alarm.name);

    // Check if it's a reminder alarm
    if (alarm.name.startsWith('reminder_')) {
        const parts = alarm.name.split('_');
        if (parts.length === 3) {
            const todoId = parts[1];
            const reminderMinutes = parseInt(parts[2]);

            // Get the todo from storage
            const result = await chrome.storage.local.get(['todos']);
            const todos = result.todos || [];
            const todo = todos.find(t => t.id === todoId);

            if (todo && !todo.completed) {
                // Show notification
                await chrome.notifications.create(alarm.name, {
                    type: 'basic',
                    iconUrl: 'icon.png',
                    title: 'Rappel de tâche',
                    message: `${todo.title} commence dans ${formatReminderTime(reminderMinutes)}`,
                    priority: 2,
                    requireInteraction: false
                });

                console.log('[Background] Notification shown for:', todo.title);
            } else {
                console.log('[Background] Todo not found or completed:', todoId);
            }
        }
    }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
    console.log('[Background] Notification clicked:', notificationId);

    // Open sidepanel
    const windows = await chrome.windows.getAll();
    if (windows.length > 0) {
        await chrome.sidePanel.open({ windowId: windows[0].id });
    }

    // Clear the notification
    await chrome.notifications.clear(notificationId);
});

// Helper function to format reminder time
function formatReminderTime(minutes) {
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

console.log('[Background] Service worker initialized');
