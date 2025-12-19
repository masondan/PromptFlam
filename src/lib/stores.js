/**
 * PromptFlam State Management
 * 
 * All stores auto-persist to localStorage for session recovery.
 * 
 * Store Schema:
 * - chatMessages: [{role: 'user'|'assistant', content: string, timestamp: number, sources?: array}]
 * - drafts: [{id: number, title: string, content: string, timestamp: number}]
 * - currentPrompts: [{bracketContent: string}] - prompts in chat input with bracket chips
 * - archiveChats: [{id: number, messages: array, timestamp: number}]
 * - archiveEdits: [{id: number, title: string, content: string, timestamp: number}]
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Creates a persistent store that syncs with localStorage
 * @param {string} key - localStorage key
 * @param {any} initialValue - default value if nothing in storage
 */
function createPersistentStore(key, initialValue) {
	const storageKey = `promptflam_${key}`;
	
	// Get initial value from localStorage or use default
	const stored = browser ? localStorage.getItem(storageKey) : null;
	const initial = stored ? JSON.parse(stored) : initialValue;
	
	const { subscribe, set, update } = writable(initial);
	
	return {
		subscribe,
		set: (value) => {
			set(value);
			if (browser) {
				localStorage.setItem(storageKey, JSON.stringify(value));
			}
		},
		update: (fn) => {
			update((current) => {
				const updated = fn(current);
				if (browser) {
					localStorage.setItem(storageKey, JSON.stringify(updated));
				}
				return updated;
			});
		},
		reset: () => {
			set(initialValue);
			if (browser) {
				localStorage.removeItem(storageKey);
			}
		}
	};
}

// Chat messages for current session
// Schema: [{role: 'user'|'assistant', content: string, timestamp: number, sources?: [{title, url}]}]
export const chatMessages = createPersistentStore('chatMessages', []);

// Current chat session ID (for auto-save to update existing archive entry)
export const currentChatSessionId = createPersistentStore('currentChatSessionId', null);

// Saved text drafts from Edit page
// Schema: [{id: number, title: string, content: string, timestamp: number}]
export const drafts = createPersistentStore('drafts', []);

// Current prompts in chat input (with bracket content for chips)
// Schema: [{bracketContent: string}]
export const currentPrompts = createPersistentStore('currentPrompts', []);

// Archived chat sessions (max 10, auto-cleanup after 30 days)
// Schema: [{id: number, messages: array, timestamp: number}]
export const archiveChats = createPersistentStore('archiveChats', []);

// Archived notes (max 10, auto-cleanup after 30 days)
// Schema: [{id: number, title: string, content: string, timestamp: number}]
export const archiveNotes = createPersistentStore('archiveNotes', []);

// Current note session ID (for auto-save to update existing archive entry)
export const currentNoteSessionId = createPersistentStore('currentNoteSessionId', null);

// Current note content (for notepad page)
export const currentNoteTitle = createPersistentStore('currentNoteTitle', '');
export const currentNoteContent = createPersistentStore('currentNoteContent', '');

// Helper functions for common operations

/**
 * Add a message to the chat
 */
export function addChatMessage(role, content, sources = []) {
	chatMessages.update((messages) => [
		...messages,
		{
			role,
			content,
			timestamp: Date.now(),
			sources
		}
	]);
}

/**
 * Update the last message (used for streaming)
 */
export function updateLastMessage(content, sources = null) {
	chatMessages.update((messages) => {
		if (messages.length === 0) return messages;
		
		const updated = [...messages];
		const lastIndex = updated.length - 1;
		updated[lastIndex] = {
			...updated[lastIndex],
			content,
			...(sources !== null ? { sources } : {})
		};
		return updated;
	});
}

/**
 * Clear current chat session
 */
export function clearChat() {
	chatMessages.reset();
}

/**
 * Save current chat to archive (creates new entry, used when starting new chat)
 */
export function archiveCurrentChat() {
	let currentMessages = [];
	chatMessages.subscribe((m) => (currentMessages = m))();
	
	if (currentMessages.length === 0) return;
	
	archiveChats.update((chats) => {
		const newChat = {
			id: Date.now(),
			messages: currentMessages,
			timestamp: Date.now()
		};
		
		// Add new chat, keep max 10, remove oldest if exceeded
		const updated = [newChat, ...chats].slice(0, 10);
		return updated;
	});
	
	// Reset session ID since we're archiving and will start fresh
	currentChatSessionId.set(null);
}

/**
 * Auto-save current chat to archive (updates existing or creates new)
 * Called after each AI response
 */
export function autoSaveChat() {
	let currentMessages = [];
	let sessionId = null;
	
	chatMessages.subscribe((m) => (currentMessages = m))();
	currentChatSessionId.subscribe((id) => (sessionId = id))();
	
	if (currentMessages.length === 0) return;
	
	archiveChats.update((chats) => {
		if (sessionId) {
			// Update existing archive entry
			const existingIndex = chats.findIndex(c => c.id === sessionId);
			if (existingIndex !== -1) {
				const updated = [...chats];
				updated[existingIndex] = {
					...updated[existingIndex],
					messages: currentMessages,
					timestamp: Date.now()
				};
				return updated;
			}
		}
		
		// Create new archive entry
		const newId = Date.now();
		currentChatSessionId.set(newId);
		
		const newChat = {
			id: newId,
			messages: currentMessages,
			timestamp: Date.now()
		};
		
		// Add new chat, keep max 10, remove oldest if exceeded
		return [newChat, ...chats].slice(0, 10);
	});
}

/**
 * Start a new chat session (clears messages and resets session)
 */
export function startNewChat() {
	archiveCurrentChat();
	chatMessages.reset();
	currentChatSessionId.set(null);
}

/**
 * Restore a chat from archive (sets messages and session ID)
 */
export function restoreChat(archivedChat) {
	chatMessages.set(archivedChat.messages);
	currentChatSessionId.set(archivedChat.id);
}

/**
 * Save a note to archive (creates new entry)
 */
export function archiveNote(title, content) {
	archiveNotes.update((notes) => {
		const newNote = {
			id: Date.now(),
			title,
			content,
			timestamp: Date.now()
		};
		
		// Add new note, keep max 10, remove oldest if exceeded
		const updated = [newNote, ...notes].slice(0, 10);
		return updated;
	});
	
	currentNoteSessionId.set(null);
}

/**
 * Auto-save current note to archive (updates existing or creates new)
 * Called on content change (debounced)
 */
export function autoSaveNote() {
	let title = '';
	let content = '';
	let sessionId = null;
	
	currentNoteTitle.subscribe((t) => (title = t))();
	currentNoteContent.subscribe((c) => (content = c))();
	currentNoteSessionId.subscribe((id) => (sessionId = id))();
	
	// Don't save empty notes
	if (!title.trim() && !content.trim()) return;
	
	archiveNotes.update((notes) => {
		if (sessionId) {
			// Update existing archive entry
			const existingIndex = notes.findIndex(n => n.id === sessionId);
			if (existingIndex !== -1) {
				const updated = [...notes];
				updated[existingIndex] = {
					...updated[existingIndex],
					title: title || 'Untitled Note',
					content,
					timestamp: Date.now()
				};
				return updated;
			}
		}
		
		// Create new archive entry
		const newId = Date.now();
		currentNoteSessionId.set(newId);
		
		const newNote = {
			id: newId,
			title: title || 'Untitled Note',
			content,
			timestamp: Date.now()
		};
		
		// Add new note, keep max 10, remove oldest if exceeded
		return [newNote, ...notes].slice(0, 10);
	});
}

/**
 * Start a new note (clears content and resets session)
 */
export function startNewNote() {
	currentNoteTitle.set('');
	currentNoteContent.set('');
	currentNoteSessionId.set(null);
}

/**
 * Restore a note from archive
 */
export function restoreNote(archivedNote) {
	currentNoteTitle.set(archivedNote.title || '');
	currentNoteContent.set(archivedNote.content || '');
	currentNoteSessionId.set(archivedNote.id);
}

/**
 * Clean up items older than 30 days (call on app init)
 */
export function cleanupOldArchives() {
	const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
	
	archiveChats.update((chats) => 
		chats.filter((chat) => chat.timestamp > thirtyDaysAgo)
	);
	
	archiveNotes.update((notes) => 
		notes.filter((note) => note.timestamp > thirtyDaysAgo)
	);
}

// Favorites store for prompt subcategories
// Uses category-subcategory ID pattern to avoid collisions
// Schema: ['Text-Blog', 'Audio-Mini-pod', ...]
export const favorites = createPersistentStore('favorites', []);

/**
 * Toggle a subcategory in favorites
 * @param {string} category - The category name
 * @param {string} subCategory - The subcategory name
 */
export function toggleFavorite(category, subCategory) {
	const id = `${category}-${subCategory}`;
	favorites.update((favs) => {
		if (favs.includes(id)) {
			return favs.filter((f) => f !== id);
		}
		return [...favs, id];
	});
}

/**
 * Check if a subcategory is favorited
 * @param {string} category - The category name
 * @param {string} subCategory - The subcategory name
 * @param {array} favsList - Current favorites array
 * @returns {boolean}
 */
export function isFavorite(category, subCategory, favsList) {
	const id = `${category}-${subCategory}`;
	return favsList.includes(id);
}
