<script>
	import { Icon } from '$lib/components';
	import { createEventDispatcher, afterUpdate, onMount } from 'svelte';

	export let value = '';
	export let isLoading = false;
	export let placeholder = 'Write or speak...';

	const dispatch = createEventDispatcher();

	export let hasMessages = false;

	let textareaEl;
	let drawerEl;
	let lastHeight = 0;
	
	// Voice input state
	let isListening = false;
	let recognition = null;
	let speechSupported = false;
	let baseValueBeforeSpeech = '';

	$: hasContent = value.trim().length > 0;
	$: canSend = hasContent && !isLoading;
	
	onMount(() => {
		// Check for Web Speech API support
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		speechSupported = !!SpeechRecognition;
		
		if (speechSupported) {
			recognition = new SpeechRecognition();
			recognition.continuous = false;
			recognition.interimResults = true;
			recognition.lang = 'en-US';
			
			recognition.onresult = (event) => {
				let transcript = '';
				for (let i = 0; i < event.results.length; i++) {
					transcript += event.results[i][0].transcript;
				}
				// Replace from base value (not append) to avoid duplicates
				if (baseValueBeforeSpeech && !baseValueBeforeSpeech.endsWith(' ')) {
					value = baseValueBeforeSpeech + ' ' + transcript;
				} else {
					value = baseValueBeforeSpeech + transcript;
				}
			};
			
			recognition.onend = () => {
				isListening = false;
			};
			
			recognition.onerror = (event) => {
				console.error('Speech recognition error:', event.error);
				isListening = false;
			};
		}
		
		return () => {
			if (recognition) {
				recognition.abort();
			}
		};
	});
	
	afterUpdate(() => {
		if (textareaEl) {
			autoResize();
		}
		if (drawerEl) {
			const h = drawerEl.offsetHeight;
			if (h !== lastHeight) {
				lastHeight = h;
				dispatch('resize', { height: h });
			}
		}
	});

	function findBracketBoundaries(text, cursorPos) {
		let openBracket = -1;
		let closeBracket = -1;

		for (let i = cursorPos - 1; i >= 0; i--) {
			if (text[i] === '[') {
				openBracket = i;
				break;
			}
			if (text[i] === ']') {
				break;
			}
		}

		if (openBracket === -1) return null;

		for (let i = cursorPos; i < text.length; i++) {
			if (text[i] === ']') {
				closeBracket = i;
				break;
			}
			if (text[i] === '[') {
				break;
			}
		}

		if (closeBracket === -1) return null;

		return { start: openBracket, end: closeBracket + 1 };
	}

	function handleClick(e) {
		if (!textareaEl) return;
		
		setTimeout(() => {
			const cursorPos = textareaEl.selectionStart;
			const boundaries = findBracketBoundaries(value, cursorPos);
			
			if (boundaries) {
				textareaEl.setSelectionRange(boundaries.start, boundaries.end);
			}
		}, 0);
	}

	function handleInput(e) {
		value = e.target.value;
		autoResize();
	}

	function autoResize() {
		if (!textareaEl) return;
		textareaEl.style.height = 'auto';
		const headerHeight = 80;
		const buttonRowHeight = 52;
		const padding = 32;
		const maxHeight = window.innerHeight - headerHeight - buttonRowHeight - padding;
		textareaEl.style.height = Math.min(textareaEl.scrollHeight, maxHeight) + 'px';
	}

	function handleSend() {
		if (!canSend) return;
		dispatch('send', { message: value.trim() });
		value = '';
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.blur();
		}
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function handleNewChat() {
		dispatch('newChat');
	}

	function handleStop() {
		dispatch('stop');
	}

	function toggleVoiceInput() {
		if (!speechSupported || !recognition) return;
		
		if (isListening) {
			recognition.stop();
			isListening = false;
		} else {
			try {
				baseValueBeforeSpeech = value;
				recognition.start();
				isListening = true;
			} catch (e) {
				console.error('Failed to start speech recognition:', e);
			}
		}
	}
</script>

<div class="input-drawer" bind:this={drawerEl}>
	<div class="input-container">
		<textarea
			bind:this={textareaEl}
			{value}
			{placeholder}
			on:input={handleInput}
			on:keydown={handleKeydown}
			on:click={handleClick}
			rows="1"
			aria-label="Message input"
		></textarea>
		
		<div class="button-row">
			<div class="left-buttons">
				{#if hasMessages}
					<button
						class="new-chat-btn"
						on:click={handleNewChat}
						aria-label="Start new chat"
						type="button"
					>
						<Icon name="newchat" size={15} />
					</button>
				{/if}
				
				{#if speechSupported}
					<button
						class="mic-button"
						class:listening={isListening}
						on:click={toggleVoiceInput}
						aria-label={isListening ? 'Stop listening' : 'Start voice input'}
						type="button"
					>
						{#if isListening}
							<div class="pulse-ring"></div>
							<div class="pulse-ring delay"></div>
						{/if}
						<Icon name={isListening ? 'mic-fill' : 'mic'} size={22} />
					</button>
				{/if}
			</div>
			
			<div class="right-buttons">
				{#if isLoading}
					<button
						class="action-button stop"
						on:click={handleStop}
						aria-label="Stop generating"
						type="button"
					>
						<Icon name="stop-fill" size={26} />
					</button>
				{:else}
					<button
						class="action-button send"
						class:active={canSend}
						on:click={handleSend}
						disabled={!canSend}
						aria-label="Send message"
						type="button"
					>
						<Icon name={canSend ? 'send-fill' : 'send'} size={22} />
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes pulse-ring {
		0% {
			transform: scale(1);
			opacity: 0.4;
		}
		100% {
			transform: scale(1.4);
			opacity: 0;
		}
	}
	.input-drawer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: var(--z-input-drawer);
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
	}

	@media (min-width: 768px) {
		.input-drawer {
			left: 50%;
			right: auto;
			transform: translateX(-50%);
			width: 100%;
			max-width: var(--app-max-width);
		}
	}

	.input-container {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		background: var(--bg-main);
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		padding: var(--spacing-md) var(--spacing-lg);
		padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
		box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
	}

	textarea {
		width: 100%;
		min-height: 24px;
		max-height: 40vh;
		line-height: 1.5;
		padding: 0;
		overflow-y: auto;
		font-size: var(--font-size-base);
	}

	textarea::placeholder {
		color: #999999;
	}

	.button-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-left: -8px;
		margin-right: -8px;
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		transition: all 0.15s;
	}

	.action-button.send {
		color: #555555;
		opacity: 1;
	}

	.action-button.send:disabled {
		opacity: 1;
		cursor: default;
	}

	.action-button.send.active {
		color: var(--color-icon-active);
	}

	.action-button.send:hover:not(:disabled) {
		color: var(--color-icon-active);
	}

	.action-button.stop {
		color: var(--accent-brand);
	}

	.new-chat-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: none;
		background: #5422b0;
		color: #fff;
		transition: all 0.15s;
	}

	.new-chat-btn:hover {
		background: var(--accent-brand);
	}

	.left-buttons {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.right-buttons {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.mic-button {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 37px;
		height: 37px;
		border-radius: 50%;
		color: #555555;
		transition: color 0.15s;
		transform: translateY(2px);
	}

	.mic-button:hover {
		color: var(--color-icon-active);
	}

	.mic-button.listening {
		color: var(--accent-brand);
	}

	.pulse-ring {
		position: absolute;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 1px solid var(--accent-brand);
		animation: pulse-ring 0.8s ease-out infinite;
		pointer-events: none;
	}

	.pulse-ring.delay {
		animation-delay: 0.3s;
	}
</style>
