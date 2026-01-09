// Types for storage
export interface Category {
    id: string;
    name: string;
    color: string;
}

export interface Todo {
    id: string;
    title: string;
    comment?: string;
    categoryId?: string;
    completed: boolean;
    createdAt: number;
}

export interface GitHubSettings {
    token: string;
    repo: string;
    columnId: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface StorageData {
    todos: Todo[];
    categories: Category[];
    githubSettings: GitHubSettings;
    theme: Theme;
}

// Default categories
const defaultCategories: Category[] = [
    { id: 'work', name: 'Travail', color: '#3b82f6' },
    { id: 'personal', name: 'Personnel', color: '#10b981' },
    { id: 'urgent', name: 'Urgent', color: '#ef4444' },
    { id: 'ideas', name: 'Idées', color: '#f59e0b' },
];

// Default values
const defaultGitHubSettings: GitHubSettings = {
    token: '',
    repo: '',
    columnId: ''
};

// Check if chrome.storage is available (for development)
const isExtension = typeof chrome !== 'undefined' && chrome.storage;

// Get todos from storage
export async function getTodos(): Promise<Todo[]> {
    if (!isExtension) {
        const stored = localStorage.getItem('todos');
        return stored ? JSON.parse(stored) : [];
    }

    const result = await chrome.storage.local.get('todos') as { todos?: Todo[] };
    return result.todos || [];
}

// Save todos to storage
export async function saveTodos(todos: Todo[]): Promise<void> {
    if (!isExtension) {
        localStorage.setItem('todos', JSON.stringify(todos));
        return;
    }

    await chrome.storage.local.set({ todos });
}

// Add a new todo
export async function addTodo(title: string, categoryId?: string, comment?: string): Promise<Todo> {
    const todos = await getTodos();
    const newTodo: Todo = {
        id: crypto.randomUUID(),
        title,
        comment,
        categoryId,
        completed: false,
        createdAt: Date.now()
    };
    todos.push(newTodo);
    await saveTodos(todos);
    return newTodo;
}

// Update a todo
export async function updateTodo(id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<void> {
    const todos = await getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
        todos[index] = { ...todos[index], ...updates };
        await saveTodos(todos);
    }
}

// Toggle todo completion
export async function toggleTodo(id: string): Promise<void> {
    const todos = await getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        await saveTodos(todos);
    }
}

// Delete a todo
export async function deleteTodo(id: string): Promise<void> {
    const todos = await getTodos();
    const filtered = todos.filter(t => t.id !== id);
    await saveTodos(filtered);
}

// Get categories
export async function getCategories(): Promise<Category[]> {
    if (!isExtension) {
        const stored = localStorage.getItem('categories');
        return stored ? JSON.parse(stored) : defaultCategories;
    }

    const result = await chrome.storage.local.get('categories') as { categories?: Category[] };
    return result.categories || defaultCategories;
}

// Save categories
export async function saveCategories(categories: Category[]): Promise<void> {
    if (!isExtension) {
        localStorage.setItem('categories', JSON.stringify(categories));
        return;
    }

    await chrome.storage.local.set({ categories });
}

// Get theme
export async function getTheme(): Promise<Theme> {
    if (!isExtension) {
        const stored = localStorage.getItem('theme');
        return (stored as Theme) || 'system';
    }

    const result = await chrome.storage.local.get('theme') as { theme?: Theme };
    return result.theme || 'system';
}

// Save theme
export async function saveTheme(theme: Theme): Promise<void> {
    if (!isExtension) {
        localStorage.setItem('theme', theme);
        return;
    }

    await chrome.storage.local.set({ theme });
}

// Get GitHub settings
export async function getGitHubSettings(): Promise<GitHubSettings> {
    if (!isExtension) {
        const stored = localStorage.getItem('githubSettings');
        return stored ? JSON.parse(stored) : defaultGitHubSettings;
    }

    const result = await chrome.storage.local.get('githubSettings') as { githubSettings?: GitHubSettings };
    return result.githubSettings || defaultGitHubSettings;
}

// Save GitHub settings
export async function saveGitHubSettings(settings: GitHubSettings): Promise<void> {
    if (!isExtension) {
        localStorage.setItem('githubSettings', JSON.stringify(settings));
        return;
    }

    await chrome.storage.local.set({ githubSettings: settings });
}
