// Service for managing task reminders and notifications

export interface ReminderAlarm {
    todoId: string;
    reminderMinutes: number;
    scheduledTime: number;
}

// Schedule a reminder for a todo
export async function scheduleReminder(todoId: string, startDate: number, reminderMinutes: number) {
    const reminderTime = startDate - (reminderMinutes * 60 * 1000);
    const now = Date.now();

    // Don't schedule if reminder time has passed
    if (reminderTime <= now) {
        console.log(`[Reminder] Skipping past reminder for ${todoId}`);
        return;
    }

    const alarmName = `reminder_${todoId}_${reminderMinutes}`;

    // Schedule alarm
    await chrome.alarms.create(alarmName, {
        when: reminderTime
    });

    console.log(`[Reminder] Scheduled ${alarmName} for ${new Date(reminderTime).toLocaleString()}`);
}

// Cancel all reminders for a todo
export async function cancelReminders(todoId: string) {
    const alarms = await chrome.alarms.getAll();
    const todoAlarms = alarms.filter(alarm => alarm.name.startsWith(`reminder_${todoId}_`));

    for (const alarm of todoAlarms) {
        await chrome.alarms.clear(alarm.name);
        console.log(`[Reminder] Cancelled ${alarm.name}`);
    }
}

// Show notification for a reminder
export async function showReminderNotification(todoId: string, todoTitle: string, reminderMinutes: number) {
    const notificationId = `reminder_${todoId}_${reminderMinutes}`;

    await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Rappel de tâche',
        message: `${todoTitle} commence dans ${formatReminderTime(reminderMinutes)}`,
        priority: 2,
        requireInteraction: false
    });

    console.log(`[Reminder] Notification shown for ${todoId}`);
}

// Format reminder time for display
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

// Reschedule all reminders for a todo
export async function rescheduleReminders(todoId: string, startDate: number, reminders: number[]) {
    // Cancel existing reminders
    await cancelReminders(todoId);

    // Schedule new reminders
    for (const reminderMinutes of reminders) {
        await scheduleReminder(todoId, startDate, reminderMinutes);
    }
}

// Get upcoming reminders (for debugging/display)
export async function getUpcomingReminders(): Promise<ReminderAlarm[]> {
    const alarms = await chrome.alarms.getAll();
    const reminderAlarms: ReminderAlarm[] = [];

    for (const alarm of alarms) {
        if (alarm.name.startsWith('reminder_')) {
            const parts = alarm.name.split('_');
            if (parts.length === 3) {
                reminderAlarms.push({
                    todoId: parts[1],
                    reminderMinutes: parseInt(parts[2]),
                    scheduledTime: alarm.scheduledTime || 0
                });
            }
        }
    }

    return reminderAlarms;
}
