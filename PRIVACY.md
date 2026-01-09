# Privacy Policy for Todo Manager Extension

**Last updated: January 9, 2026**

## Overview

Todo Manager is a Chrome extension that helps you manage your tasks, GitHub issues, and Gmail emails in one place. This privacy policy explains how the extension handles your data.

## Data Collection and Storage

### Local Storage Only
- **All data is stored locally** in your browser using Chrome's storage API
- **No data is transmitted** to any external servers owned or operated by us
- **No analytics or tracking** is performed by this extension
- Your tasks, categories, and settings remain private on your device

### Data Types Stored Locally
- Personal tasks and categories
- GitHub settings (token, repository, column preferences)
- Gmail authentication tokens (managed by Google)
- Task reminders and notification preferences
- Theme preferences (light/dark mode)

## Third-Party Services

### Gmail API
- **Purpose**: Access your Gmail emails to display starred and unread messages
- **Data accessed**: Email metadata (sender, subject, snippet, date), read/unread status, starred status
- **Data usage**: Displayed locally in the extension only
- **Data storage**: Not stored by the extension; accessed on-demand via Google's API
- **Governed by**: [Google Privacy Policy](https://policies.google.com/privacy)

### GitHub API
- **Purpose**: Access your GitHub issues from specified projects
- **Data accessed**: Issue titles, descriptions, labels, assignees, comments
- **Data usage**: Displayed locally in the extension only
- **Data storage**: Not stored permanently; cached temporarily in browser
- **Governed by**: [GitHub Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

## Permissions Explained

The extension requests the following Chrome permissions:

- **`storage`**: Store your tasks and settings locally in your browser
- **`sidePanel`**: Display the extension interface in Chrome's side panel
- **`tabs`**: Open links in new tabs when you click on issues or emails
- **`notifications`**: Show reminder notifications for scheduled tasks
- **`alarms`**: Schedule reminder notifications
- **`identity`**: Authenticate with Google for Gmail access

## OAuth Authentication

### Gmail Authentication
- Uses Google's official OAuth 2.0 authentication
- Your Gmail password is **never** shared with this extension
- Authentication tokens are managed securely by Chrome's identity API
- You can revoke access at any time from your [Google Account settings](https://myaccount.google.com/permissions)

### GitHub Authentication
- Uses personal access tokens that you create
- Tokens are stored locally and encrypted by Chrome
- You control the scope and permissions of the token

## Data Retention

- **Tasks and settings**: Retained until you delete them or uninstall the extension
- **Gmail tokens**: Retained until you log out or revoke access
- **GitHub tokens**: Retained until you remove them from settings

## Data Deletion

You can delete all data by:
1. Uninstalling the extension from Chrome
2. Clearing Chrome's extension data
3. Logging out from Gmail within the extension
4. Removing GitHub tokens from settings

## Security

- All data is stored using Chrome's secure storage API
- API tokens are encrypted by Chrome
- No data is transmitted to third-party servers (except official Google and GitHub APIs)
- All API communications use HTTPS encryption

## Children's Privacy

This extension is not directed to children under 13. We do not knowingly collect data from children.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in the "Last updated" date above.

## Contact

For questions or concerns about this privacy policy, please contact:
- GitHub Issues: [Your Repository URL]
- Email: [Your Email]

## Open Source

This extension is open source. You can review the code at:
[Your GitHub Repository URL]

---

**Your Privacy Matters**: This extension is designed with privacy in mind. Your data stays on your device, and we have no access to it.
