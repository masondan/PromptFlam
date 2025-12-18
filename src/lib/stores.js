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
 * Save current chat to archive
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
}

/**
 * Save a note to archive
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
