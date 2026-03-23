<script>
	import { tick, onMount } from 'svelte';
	import { 
		Header, 
		ChatInput, 
		ChatMessage, 
		PromptCard, 
		SourcesDrawer, 
		ThinkingDots 
	} from '$lib/components';
	import { goto } from '$app/navigation';
	import { chatMessages, addChatMessage, clearChat, archiveCurrentChat, updateLastMessage, autoSaveChat, currentChatSessionId, pendingChatInput, currentNoteTitle, currentNoteContent, currentNoteSessionId, startNewNote } from '$lib/stores';
	import { callPerplexity } from '$lib/services/perplexity.js';
	import { formatMarkdownForCopy, stripMarkdownFormatting, normalizeLineBreaks } from '$lib/utils.js';
	import { marked } from 'marked';

	let inputValue = '';
	let isLoading = false;
	let isStreaming = false;
	let streamingContent = '';
	let errorMessage = '';
	let showSourcesDrawer = false;
	let currentSources = [];
	let highlightedSourceIndex = -1;
	let mainEl;
	let chatContentRef;
	let abortController = null;
	let chatInputHeight = 120;
	let shouldPreventAutoScroll = false;
	let shouldAutoScroll = true;
	let userHasScrolledUp = false;
	let showNotepadModal = false;
	let notepadContent = '';

	$: hasMessages = $chatMessages.length > 0;

	function checkIfUserScrolledUp() {
		if (!chatContentRef) return;
		
		// Find the last actual message element (ignore spacer)
		const messages = chatContentRef.querySelectorAll('.prompt-wrapper, :scope > :not(.scroll-spacer):not(.error-message)');
		const lastMsg = messages[messages.length - 1];
		if (!lastMsg) return;
		
		// Check if the bottom of the last message is within 300px of the viewport bottom
		const rect = lastMsg.getBoundingClientRect();
		const isNearBottom = rect.bottom < window.innerHeight + 300;
		
		userHasScrolledUp = !isNearBottom;
		shouldAutoScroll = isNearBottom;
	}

	function scrollToBottom(smooth = false) {
		if (!shouldAutoScroll || !chatContentRef) return;
		
		requestAnimationFrame(() => {
			// Find the last actual message (skip the scroll-spacer)
			const messages = chatContentRef.querySelectorAll('.prompt-wrapper, :scope > :not(.scroll-spacer):not(.error-message)');
			const lastMsg = messages[messages.length - 1];
			if (!lastMsg) return;
			
			// Scroll so the bottom of the last message is visible at viewport bottom
			const rect = lastMsg.getBoundingClientRect();
			const bottomOfMessage = window.scrollY + rect.bottom + 40;
			window.scrollTo({
				top: bottomOfMessage - window.innerHeight,
				behavior: smooth ? 'smooth' : 'auto'
			});
		});
	}

	async function scrollNewPromptToTop() {
		if (typeof window === 'undefined') return;
		if (!chatContentRef) return;

		await tick();

		requestAnimationFrame(() => {
			const prompts = chatContentRef.querySelectorAll('.prompt-wrapper[data-prompt-index]');
			if (!prompts || !prompts.length) return;

			const lastPrompt = prompts[prompts.length - 1];
			const rect = lastPrompt.getBoundingClientRect();
			const paddingOffset = 90;
			window.scrollTo({
				top: window.scrollY + rect.top - paddingOffset,
				behavior: 'auto'
			});
		});
	}



	onMount(() => {
		if ($pendingChatInput) {
			inputValue = $pendingChatInput;
			pendingChatInput.set('');
		}

		window.addEventListener('scroll', checkIfUserScrolledUp);
		return () => {
			window.removeEventListener('scroll', checkIfUserScrolledUp);
		};
	});

	async function handleSend(e) {
		const message = e.detail.message;
		if (!message || isLoading) return;

		errorMessage = '';
		addChatMessage('user', message);
		inputValue = '';
		isLoading = true;
		isStreaming = false;
		streamingContent = '';
		abortController = new AbortController();
		shouldPreventAutoScroll = true;
		shouldAutoScroll = true;
		userHasScrolledUp = false;

		// Wait for DOM update then scroll new prompt to top
		await scrollNewPromptToTop();
		// Then scroll to bottom to show response as it arrives
		await tick();
		scrollToBottom();

		try {
			// Prepare messages for API (convert to simple format, filter out non-API roles)
			const apiMessages = $chatMessages
				.filter(m => m.role === 'user' || m.role === 'assistant')
				.map(m => ({
					role: m.role,
					content: m.content
				}));

			const { content, sources, aborted } = await callPerplexity(apiMessages, async (chunk, fullContent) => {
				// On first chunk, switch from thinking dots to streaming
				if (!isStreaming) {
					isStreaming = true;
					addChatMessage('assistant', '', []);
				}
				// Update streaming content as chunks arrive
				streamingContent = fullContent;
				updateLastMessage(fullContent);

				await tick();
				// Auto-scroll to bottom as response streams in
				scrollToBottom(true);
    
			}, abortController.signal);

			if (aborted) {
				// User stopped the generation
				if (!isStreaming || !content) {
					// No response was generated - remove empty assistant message if it exists
					chatMessages.update(msgs => {
						const lastMsg = msgs[msgs.length - 1];
						if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
							return msgs.slice(0, -1);
						}
						return msgs;
					});
				} else {
					// Partial response exists - keep it with whatever was generated
					updateLastMessage(content, sources);
				}
				// Add the stopped message
				addChatMessage('stopped', 'You stopped the prompt.');
			} else {
				// Final update with complete content and sources
				updateLastMessage(content, sources);
				
				// Auto-save to archive after each AI response
				autoSaveChat();
			}
			
		} catch (error) {
			// Ignore abort errors since we handle them above
			if (error.name === 'AbortError') {
				// Add stopped message for abort during initial fetch
				addChatMessage('stopped', 'You stopped the prompt.');
			} else {
				console.error('Chat error:', error);
				errorMessage = error.message || 'Failed to get response. Please try again.';
				
				// Remove the placeholder message on error
				chatMessages.update(msgs => msgs.slice(0, -1));
			}
		} finally {
			isLoading = false;
			isStreaming = false;
			streamingContent = '';
			abortController = null;
			shouldPreventAutoScroll = false;
		}
	}

	function handleNewChat() {
		// Don't archive again - it's already auto-saved
		// Just reset the session to start fresh
		clearChat();
		currentChatSessionId.set(null);
	}

	function handleOpenSources(e) {
		currentSources = e.detail.sources || [];
		highlightedSourceIndex = e.detail.highlightIndex ?? -1;
		showSourcesDrawer = true;
	}

	function handleCloseSources() {
		showSourcesDrawer = false;
		highlightedSourceIndex = -1;
	}

	async function handleRewrite(e) {
		const messageIndex = e.detail?.index;
		if (messageIndex === undefined || isLoading) return;

		const messageToRewrite = $chatMessages[messageIndex];
		if (!messageToRewrite || messageToRewrite.role !== 'assistant') return;

		errorMessage = '';
		isLoading = true;
		isStreaming = true;

		// Clear the message content to show streaming
		chatMessages.update(msgs => {
			const updated = [...msgs];
			updated[messageIndex] = { ...updated[messageIndex], content: '' };
			return updated;
		});

		try {
			// Find the user message that prompted this response
			let userPrompt = '';
			for (let i = messageIndex - 1; i >= 0; i--) {
				if ($chatMessages[i].role === 'user') {
					userPrompt = $chatMessages[i].content;
					break;
				}
			}

			const rewriteMessages = [
				{ role: 'user', content: userPrompt },
				{ role: 'assistant', content: messageToRewrite.content },
				{ role: 'user', content: 'Please rewrite your previous response. Keep the same information but use different wording and structure. Make it fresh and engaging.' }
			];

			const { content, sources } = await callPerplexity(rewriteMessages, (chunk, fullContent) => {
				chatMessages.update(msgs => {
					const updated = [...msgs];
					updated[messageIndex] = { ...updated[messageIndex], content: fullContent };
					return updated;
				});
			});

			// Final update with complete content and sources
			chatMessages.update(msgs => {
				const updated = [...msgs];
				updated[messageIndex] = { ...updated[messageIndex], content, sources };
				return updated;
			});

		} catch (error) {
			console.error('Rewrite error:', error);
			errorMessage = error.message || 'Failed to rewrite. Please try again.';
			// Restore original content on error
			chatMessages.update(msgs => {
				const updated = [...msgs];
				updated[messageIndex] = messageToRewrite;
				return updated;
			});
		} finally {
			isLoading = false;
			isStreaming = false;
		}
	}

	function handleShare() {
		if (navigator.share) {
			navigator.share({
				title: 'PromptFlam Response',
				text: 'Check out this AI response from PromptFlam'
			});
		}
	}

	async function handleCopy(e) {
		const messageIndex = e.detail?.index;
		if (messageIndex !== undefined) {
			const message = $chatMessages[messageIndex];
			if (message && message.role === 'assistant') {
				const cleanContent = formatMarkdownForCopy(message.content);
				await navigator.clipboard.writeText(cleanContent);
			}
		}
	}

	function handleStop() {
		if (abortController) {
			abortController.abort();
		}
	}

	function stripCitationsFromMarkdown(text) {
		return text.replace(/\[(\d+)\]/g, '');
	}

	function handleSendToNotepad(e) {
		const messageIndex = e.detail?.index;
		if (messageIndex === undefined) return;

		const message = $chatMessages[messageIndex];
		if (!message || message.role !== 'assistant') return;

		// First strip citations
		const cleanMarkdown = stripCitationsFromMarkdown(message.content);
		
		// Use formatMarkdownForCopy to get clean text with proper formatting
		const plainText = formatMarkdownForCopy(cleanMarkdown);
		
		// Convert plain text to HTML with proper paragraph breaks
		// This mimics how copy/paste works by preserving paragraph structure
		// Add a full blank line between paragraphs for better readability
		const formattedContent = plainText
			.split('\n\n')
			.map(para => para.trim())
			.filter(para => para.length > 0)
			.map(para => {
				// Check if this is a list item
				if (para.startsWith('- ')) {
					return `<div>${para}</div><div><br></div>`;
				}
				return `<div>${para}</div><div><br></div>`;
			})
			.join('')
			// Remove the last <div><br></div> to avoid extra space at the end
			.replace(/<div><br><\/div>$/, '');
		
		// Set the formatted content
		notepadContent = formattedContent;

		let existingContent = '';
		currentNoteContent.subscribe(c => existingContent = c)();

		if (existingContent.trim()) {
			showNotepadModal = true;
		} else {
			sendToNotepadNew();
		}
	}

	function sendToNotepadNew() {
		startNewNote();
		// Set formatted content to the notepad
		currentNoteContent.set(notepadContent);
		showNotepadModal = false;
		goto('/notepad');
	}

	function sendToNotepadAppend() {
		let existing = '';
		currentNoteContent.subscribe(c => existing = c)();
		// Append with proper spacing between existing content and new content
		currentNoteContent.set(existing + notepadContent);
		showNotepadModal = false;
		goto('/notepad');
	}

</script>

<svelte:head>
	<title>Create | PromptFlam</title>
</svelte:head>

<Header />

<main class="create-page" bind:this={mainEl} style="--chat-input-height: {chatInputHeight}px;">
	{#if !hasMessages && !isLoading}
		<div class="logo-container">
			<img 
				src="/logos/logo-promptflam-trs.png" 
				alt="PromptFlam" 
				class="logo"
			/>
		</div>
	{:else}
		<div class="chat-content" bind:this={chatContentRef}>
			{#each $chatMessages as message, index}
				{#if message.role === 'user'}
					<div class="prompt-wrapper" data-prompt-index={index}>
						<PromptCard content={message.content} timestamp={message.timestamp} />
					</div>
					{#if index === $chatMessages.length - 1 && isLoading && !isStreaming}
						<ThinkingDots />
					{/if}
				{:else if message.role === 'stopped'}
					<div class="stopped-message">
						{message.content}
					</div>
				{:else}
					{@const isCurrentlyStreaming = isStreaming && index === $chatMessages.length - 1}
					{@const isComplete = !isCurrentlyStreaming && message.content}
					<ChatMessage 
						content={message.content}
						sources={message.sources}
						isStreaming={isCurrentlyStreaming}
						showSourcesLink={isComplete && message.sources && message.sources.length > 0}
						{index}
						on:rewrite={handleRewrite}
						on:openSources={handleOpenSources}
						on:share={handleShare}
						on:copy={handleCopy}
						on:sendToNotepad={handleSendToNotepad}
					/>
				{/if}
			{/each}

			{#if errorMessage}
				<div class="error-message">
					<p>{errorMessage}</p>
					<button on:click={() => errorMessage = ''}>Dismiss</button>
				</div>
			{/if}
			
			<!-- Spacer ensures we can always scroll the last prompt to the top -->
			<div class="scroll-spacer"></div>
		</div>
	{/if}
</main>

<ChatInput 
	bind:value={inputValue}
	{isLoading}
	{hasMessages}
	on:send={handleSend}
	on:newChat={handleNewChat}
	on:stop={handleStop}
	on:resize={(e) => { chatInputHeight = e.detail.height; }}
/>

<SourcesDrawer 
	isOpen={showSourcesDrawer}
	sources={currentSources}
	highlightIndex={highlightedSourceIndex}
	on:close={handleCloseSources}
/>

{#if showNotepadModal}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="modal-overlay" on:click={() => showNotepadModal = false} on:keydown={(e) => e.key === 'Escape' && (showNotepadModal = false)}>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal" on:click|stopPropagation>
			<p class="modal-text">Your notepad has content</p>
			<div class="modal-buttons">
				<button class="modal-btn" on:click={sendToNotepadNew}>Start new note</button>
				<button class="modal-btn" on:click={sendToNotepadAppend}>Add to current</button>
			</div>
			<button class="modal-cancel" on:click={() => showNotepadModal = false}>Cancel</button>
		</div>
	</div>
{/if}

<style>
	.create-page {
		padding-top: var(--spacing-md);
		padding-bottom: calc(var(--chat-input-height, var(--input-drawer-min-height)) + 40px);
		display: flex;
		flex-direction: column;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}

	.logo-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-lg);
		transform: translateY(120px);
		position: relative;
		z-index: 2;
	}

	.logo {
		width: 40%;
		height: auto;
		opacity: 0.15;
	}

	.chat-content {
		flex: 1;
		padding: var(--spacing-md);
		max-width: var(--max-content-width);
		margin: 0 auto;
		width: 100%;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: var(--radius);
		padding: var(--spacing-md);
		margin-top: var(--spacing-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.error-message p {
		color: #dc2626;
		margin: 0;
		font-size: 0.875rem;
	}

	.error-message button {
		background: transparent;
		color: #dc2626;
		font-size: 0.875rem;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.error-message button:hover {
		background: #fee2e2;
	}

	.stopped-message {
		display: inline-block;
		background: #efefef;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius);
		font-size: var(--font-size-base);
		color: var(--text-primary);
		margin-top: var(--spacing-sm);
	}

	.prompt-wrapper {
		/* Offset for the fixed header when scrolling into view */
		scroll-margin-top: 88px;
	}

	.scroll-spacer {
		/* Fill remaining viewport height so we can always scroll last prompt to top */
		min-height: calc(100vh - var(--header-height) - 150px);
		flex-shrink: 0;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: var(--z-overlay);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.modal {
		background: var(--bg-main);
		border-radius: var(--radius);
		padding: var(--spacing-lg);
		max-width: 320px;
		width: 100%;
		box-shadow: var(--shadow-md);
	}

	.modal-text {
		margin: 0 0 var(--spacing-lg);
		font-size: 1rem;
		color: var(--text-primary);
		text-align: center;
	}

	.modal-buttons {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.modal-btn {
		width: 100%;
		padding: var(--spacing-md);
		font-size: 1rem;
		font-weight: 500;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--bg-main);
		color: var(--text-primary);
		cursor: pointer;
		transition: background 0.15s;
	}

	.modal-btn:hover {
		background: var(--color-highlight);
	}

	.modal-cancel {
		display: block;
		width: 100%;
		margin-top: var(--spacing-md);
		padding: var(--spacing-sm);
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 0.9rem;
		cursor: pointer;
		text-align: center;
	}

	.modal-cancel:hover {
		color: var(--text-primary);
	}
</style>
