/**
 * localStorage Wrapper Service
 * 
 * Provides safe access to browser localStorage with SSR guards.
 * Use this for direct localStorage operations outside of Svelte stores.
 */

import { browser } from '$app/environment';

export const storage = {
	/**
	 * Store a value in localStorage
	 * @param {string} key - Storage key
	 * @param {any} value - Value to store (will be JSON stringified)
	 */
	set(key, value) {
		if (browser) {
			try {
				localStorage.setItem(key, JSON.stringify(value));
			} catch (error) {
				console.error('localStorage set error:', error);
			}
		}
	},

	/**
	 * Retrieve a value from localStorage
	 * @param {string} key - Storage key
	 * @param {any} defaultValue - Value to return if key doesn't exist
	 * @returns {any} Parsed value or defaultValue
	 */
	get(key, defaultValue = null) {
		if (browser) {
			try {
				const item = localStorage.getItem(key);
				return item ? JSON.parse(item) : defaultValue;
			} catch (error) {
				console.error('localStorage get error:', error);
				return defaultValue;
			}
		}
		return defaultValue;
	},

	/**
	 * Remove a value from localStorage
	 * @param {string} key - Storage key
	 */
	remove(key) {
		if (browser) {
			try {
				localStorage.removeItem(key);
			} catch (error) {
				console.error('localStorage remove error:', error);
			}
		}
	},

	/**
	 * Clear all localStorage data
	 */
	clear() {
		if (browser) {
			try {
				localStorage.clear();
			} catch (error) {
				console.error('localStorage clear error:', error);
			}
		}
	},

	/**
	 * Check if localStorage is available and has space
	 * @returns {boolean}
	 */
	isAvailable() {
		if (!browser) return false;
		
		try {
			const testKey = '__storage_test__';
			localStorage.setItem(testKey, testKey);
			localStorage.removeItem(testKey);
			return true;
		} catch (error) {
			return false;
		}
	},

	/**
	 * Get approximate storage usage
	 * @returns {object} {used: number, total: number, percentage: number}
	 */
	getUsage() {
		if (!browser) return { used: 0, total: 0, percentage: 0 };
		
		let used = 0;
		for (let key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				used += localStorage.getItem(key).length * 2; // UTF-16 = 2 bytes per char
			}
		}
		
		const total = 5 * 1024 * 1024; // 5MB typical limit
		const percentage = Math.round((used / total) * 100);
		
		return { used, total, percentage };
	}
};
