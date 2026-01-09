import { useState, useEffect } from 'react';
import type { Todo, Category } from '../services/storageService';
import { getTodos, addTodo, toggleTodo, deleteTodo, updateTodo, getCategories } from '../services/storageService';
import { rescheduleReminders, cancelReminders } from '../services/reminderService';

export default function PersoTab() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [reminders, setReminders] = useState<number[]>([15]); // Default: 15min before

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [loadedTodos, loadedCategories] = await Promise.all([
                getTodos(),
                getCategories()
            ]);
            setTodos(loadedTodos);
            setCategories(loadedCategories);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setComment('');
        setCategoryId('');
        setStartDate('');
        setStartTime('');
        setReminders([15]);
        setEditingTodo(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        // Parse start date/time
        let startDateTime: number | undefined;
        if (startDate && startTime) {
            startDateTime = new Date(`${startDate}T${startTime}`).getTime();
        }

        if (editingTodo) {
            const updates = {
                title: title.trim(),
                comment: comment.trim() || undefined,
                categoryId: categoryId || undefined,
                startDate: startDateTime,
                reminders: startDateTime ? reminders : undefined
            };
            await updateTodo(editingTodo.id, updates);

            // Update reminders
            if (startDateTime && reminders.length > 0) {
                await rescheduleReminders(editingTodo.id, startDateTime, reminders);
            } else {
                await cancelReminders(editingTodo.id);
            }

            setTodos(todos.map(t =>
                t.id === editingTodo.id ? { ...t, ...updates } : t
            ));
        } else {
            const newTodo = await addTodo(
                title.trim(),
                categoryId || undefined,
                comment.trim() || undefined,
                startDateTime,
                startDateTime ? reminders : undefined
            );

            // Schedule reminders
            if (startDateTime && reminders.length > 0) {
                await rescheduleReminders(newTodo.id, startDateTime, reminders);
            }

            setTodos([...todos, newTodo]);
        }
        resetForm();
    };

    const handleEdit = (todo: Todo) => {
        setEditingTodo(todo);
        setTitle(todo.title);
        setComment(todo.comment || '');
        setCategoryId(todo.categoryId || '');

        // Parse start date/time
        if (todo.startDate) {
            const date = new Date(todo.startDate);
            setStartDate(date.toISOString().split('T')[0]);
            setStartTime(date.toTimeString().slice(0, 5));
        } else {
            setStartDate('');
            setStartTime('');
        }

        setReminders(todo.reminders || [15]);
        setShowForm(true);
    };

    const handleToggle = async (id: string) => {
        const todo = todos.find(t => t.id === id);
        await toggleTodo(id);

        // Cancel reminders if completing task
        if (todo && !todo.completed) {
            await cancelReminders(id);
        }

        setTodos(todos.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const handleDelete = async (id: string) => {
        await cancelReminders(id);
        await deleteTodo(id);
        setTodos(todos.filter(t => t.id !== id));
    };

    const getCategory = (id?: string) => categories.find(c => c.id === id);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    const pendingTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    return (
        <div className="flex flex-col h-full">
            {/* Add button or form */}
            {showForm ? (
                <form onSubmit={handleSubmit} className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Titre de la tâche..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />

                    {/* Category selector */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setCategoryId('')}
                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${!categoryId
                                ? 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500'
                                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            Sans catégorie
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategoryId(cat.id)}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${categoryId === cat.id
                                    ? 'border-current'
                                    : 'border-transparent hover:opacity-80'
                                    }`}
                                style={{
                                    backgroundColor: `${cat.color}20`,
                                    color: cat.color,
                                    borderColor: categoryId === cat.id ? cat.color : 'transparent'
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Commentaire (optionnel)..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />

                    {/* Date and Time */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Date et heure de début (optionnel)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                disabled={!startDate}
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                           focus:outline-none focus:ring-2 focus:ring-blue-500
                                           disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Reminders */}
                    {startDate && startTime && (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Rappels
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[15, 60, 1440].map(minutes => {
                                    const label = minutes === 15 ? '15 min' : minutes === 60 ? '1 heure' : '1 jour';
                                    const isSelected = reminders.includes(minutes);
                                    return (
                                        <button
                                            key={minutes}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setReminders(reminders.filter(m => m !== minutes));
                                                } else {
                                                    setReminders([...reminders, minutes]);
                                                }
                                            }}
                                            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${isSelected
                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            {label} avant
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                                       text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg
                                       bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
                                       text-white disabled:text-gray-500 transition-colors"
                        >
                            {editingTodo ? 'Modifier' : 'Ajouter'}
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="m-3 px-4 py-2.5 text-sm font-medium rounded-lg border-2 border-dashed 
                               border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400
                               hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400
                               transition-colors"
                >
                    + Nouvelle tâche
                </button>
            )}

            {/* Todo list */}
            <div className="flex-1 overflow-y-auto">
                {todos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">Aucune tâche</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {/* Pending todos */}
                        {pendingTodos.map(todo => (
                            <TodoItem
                                key={todo.id}
                                todo={todo}
                                category={getCategory(todo.categoryId)}
                                onToggle={handleToggle}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}

                        {/* Completed section */}
                        {completedTodos.length > 0 && (
                            <>
                                <div className="px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                                    Terminées ({completedTodos.length})
                                </div>
                                {completedTodos.map(todo => (
                                    <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        category={getCategory(todo.categoryId)}
                                        onToggle={handleToggle}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

interface TodoItemProps {
    todo: Todo;
    category?: Category;
    onToggle: (id: string) => void;
    onEdit: (todo: Todo) => void;
    onDelete: (id: string) => void;
}

function TodoItem({ todo, category, onToggle, onEdit, onDelete }: TodoItemProps) {
    return (
        <div className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
            <div className="flex items-start gap-3">
                <button
                    onClick={() => onToggle(todo.id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                               ${todo.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'}`}
                >
                    {todo.completed && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </button>

                <div className="flex-1 min-w-0" onClick={() => onEdit(todo)}>
                    <div className="flex items-center gap-2">
                        <span className={`text-sm ${todo.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                            {todo.title}
                        </span>
                        {category && (
                            <span
                                className="px-1.5 py-0.5 text-[10px] font-medium rounded-full"
                                style={{
                                    backgroundColor: `${category.color}20`,
                                    color: category.color
                                }}
                            >
                                {category.name}
                            </span>
                        )}
                        {todo.startDate && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(todo.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                    {todo.comment && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">
                            {todo.comment}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => onDelete(todo.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    title="Supprimer"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
