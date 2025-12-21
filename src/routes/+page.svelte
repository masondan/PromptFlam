<script>
	import { tick, onMount } from 'svelte';
	import { 
		Header, 
		ChatInput, 
		ChatMessage, 
		PromptCard, 
		PromptDrawer, 
		SourcesDrawer, 
		TextSelectionMenu,
		ThinkingDots 
	} from '$lib/components';
	import { chatMessages, addChatMessage, clearChat, archiveCurrentChat, updateLastMessage, autoSaveChat, currentChatSessionId, pendingChatInput } from '$lib/stores';
	import { callPerplexity } from '$lib/services/perplexity.js';
	import { formatMarkdownForCopy } from '$lib/utils.js';

	let inputValue = '';
	let isLoading = false;
	let isStreaming = false;
	let streamingContent = '';
	let errorMessage = '';
	let showPromptDrawer = false;
	let showSourcesDrawer = false;
	let currentSources = [];
	let highlightedSourceIndex = -1;
	let chatContentRef;
	let abortController = null;
	let chatInputHeight = 120;

	$: hasMessages = $chatMessages.length > 0;

	function isMobile() {
		if (typeof navigator === 'undefined') return false;
		return /Mobi|Android/i.test(navigator.userAgent);
	}

	function waitForLayoutSettle({ maxWait = 600, stableFor = 150 } = {}) {
		if (typeof window === 'undefined') return Promise.resolve();

		if (!isMobile() || !window.visualViewport) {
			return new Promise((resolve) => setTimeout(resolve, 50));
		}

		const vv = window.visualViewport;
		let lastVvHeight = vv.height;
		let lastInputHeight = chatInputHeight;
		let lastChange = performance.now();
		const start = lastChange;

		return new Promise((resolve) => {
			const check = (now) => {
				const vh = vv.height;
				const ih = chatInputHeight;

				if (vh !== lastVvHeight || ih !== lastInputHeight) {
					lastVvHeight = vh;
					lastInputHeight = ih;
					lastChange = now;
				}

				if (now - lastChange >= stableFor || now - start >= maxWait) {
					cleanup();
					resolve();
				}
			};

			const onVvResize = () => check(performance.now());
			const onWinResize = () => check(performance.now());

			const cleanup = () => {
				vv.removeEventListener('resize', onVvResize);
				window.removeEventListener('resize', onWinResize);
				clearTimeout(timeoutId);
			};

			vv.addEventListener('resize', onVvResize);
			window.addEventListener('resize', onWinResize);

			const timeoutId = setTimeout(() => {
				cleanup();
				resolve();
			}, maxWait);

			requestAnimationFrame((ts) => check(ts));
		});
	}

	onMount(() => {
		if ($pendingChatInput) {
			inputValue = $pendingChatInput;
			pendingChatInput.set('');
		}
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

		// Scroll to show the new prompt at the top of the visible area (just under header)
		const lastPromptIndex = $chatMessages.length - 1;

		await tick();
		await waitForLayoutSettle();
		await tick();

		const lastPromptEl = chatContentRef?.querySelector(`[data-prompt-index="${lastPromptIndex}"]`);
		if (lastPromptEl) {
			lastPromptEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}

		try {
			// Prepare messages for API (convert to simple format, filter out non-API roles)
			const apiMessages = $chatMessages
				.filter(m => m.role === 'user' || m.role === 'assistant')
				.map(m => ({
					role: m.role,
					content: m.content
				}));

			const { content, sources, aborted } = await callPerplexity(apiMessages, (chunk, fullContent) => {
				// On first chunk, switch from thinking dots to streaming
				if (!isStreaming) {
					isStreaming = true;
					addChatMessage('assistant', '', []);
				}
				// Update streaming content as chunks arrive
				streamingContent = fullContent;
				updateLastMessage(fullContent);
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
		}
	}

	function handleNewChat() {
		// Don't archive again - it's already auto-saved
		// Just reset the session to start fresh
		clearChat();
		currentChatSessionId.set(null);
	}

	function handleOpenPromptDrawer() {
		showPromptDrawer = true;
	}

	function handleClosePromptDrawer() {
		showPromptDrawer = false;
	}

	function handleInsertPrompt(e) {
		inputValue = e.detail.prompt;
		showPromptDrawer = false;
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

	function handleSelectionCopy(e) {
		console.log('Copied:', e.detail.text);
	}
</script>

<svelte:head>
	<title>Create | PromptFlam</title>
</svelte:head>

<Header showNewChat={hasMessages} onNewChat={handleNewChat} />

<main class="create-page" style="--chat-input-height: {chatInputHeight}px;">
	{#if !hasMessages && !isLoading}
		<div class="logo-container">
			<img 
				src="/promptflam-purple-logo.png" 
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
					/>
				{/if}
			{/each}

			{#if errorMessage}
				<div class="error-message">
					<p>{errorMessage}</p>
					<button on:click={() => errorMessage = ''}>Dismiss</button>
				</div>
			{/if}
		</div>
		
		<TextSelectionMenu 
			containerRef={chatContentRef}
			messages={$chatMessages}
			on:copy={handleSelectionCopy}
		/>
	{/if}
</main>

<ChatInput 
	bind:value={inputValue}
	{isLoading}
	on:send={handleSend}
	on:openPromptDrawer={handleOpenPromptDrawer}
	on:stop={handleStop}
	on:resize={(e) => { chatInputHeight = e.detail.height; }}
/>

<PromptDrawer 
	isOpen={showPromptDrawer}
	on:close={handleClosePromptDrawer}
	on:insert={handleInsertPrompt}
/>

<SourcesDrawer 
	isOpen={showSourcesDrawer}
	sources={currentSources}
	highlightIndex={highlightedSourceIndex}
	on:close={handleCloseSources}
/>

<style>
	.create-page {
		min-height: 100vh;
		padding-top: calc(var(--header-height) + var(--spacing-md) + var(--spacing-md));
		padding-bottom: calc(var(--chat-input-height, var(--input-drawer-min-height)) + 40px);
		display: flex;
		flex-direction: column;
	}

	.logo-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-lg);
	}

	.logo {
		width: 60%;
		max-width: 280px;
		height: auto;
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
		scroll-margin-top: calc(var(--header-height) + var(--spacing-md) + var(--spacing-lg));
	}
</style>
