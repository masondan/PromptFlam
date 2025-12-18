<script>
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
	import { chatMessages, addChatMessage, clearChat, archiveCurrentChat, updateLastMessage } from '$lib/stores';
	import { callPerplexity } from '$lib/services/perplexity.js';

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

	$: hasMessages = $chatMessages.length > 0;

	async function handleSend(e) {
		const message = e.detail.message;
		if (!message || isLoading) return;

		errorMessage = '';
		addChatMessage('user', message);
		inputValue = '';
		isLoading = true;
		isStreaming = false;
		streamingContent = '';

		try {
			// Prepare messages for API (convert to simple format)
			const apiMessages = $chatMessages.map(m => ({
				role: m.role,
				content: m.content
			}));

			// Start streaming - add placeholder message
			isStreaming = true;
			addChatMessage('assistant', '', []);

			const { content, sources } = await callPerplexity(apiMessages, (chunk, fullContent) => {
				// Update streaming content as chunks arrive
				streamingContent = fullContent;
				updateLastMessage(fullContent);
			});

			// Final update with complete content and sources
			updateLastMessage(content, sources);
			
		} catch (error) {
			console.error('Chat error:', error);
			errorMessage = error.message || 'Failed to get response. Please try again.';
			
			// Remove the placeholder message on error
			chatMessages.update(msgs => msgs.slice(0, -1));
		} finally {
			isLoading = false;
			isStreaming = false;
			streamingContent = '';
		}
	}

	function handleNewChat() {
		archiveCurrentChat();
		clearChat();
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

	function handleRewrite() {
		console.log('Rewrite requested');
	}

	function handleShare() {
		if (navigator.share) {
			navigator.share({
				title: 'PromptFlam Response',
				text: 'Check out this AI response from PromptFlam'
			});
		}
	}

	async function handleCopy() {
		const lastAssistantMessage = $chatMessages.findLast(m => m.role === 'assistant');
		if (lastAssistantMessage) {
			await navigator.clipboard.writeText(lastAssistantMessage.content);
		}
	}

	function handleStop() {
		isLoading = false;
	}

	function handleSelectionRewrite(e) {
		console.log('Rewrite selection:', e.detail.text);
	}

	function handleSelectionSource(e) {
		// Find the last assistant message to get its sources
		const lastAssistant = $chatMessages.findLast(m => m.role === 'assistant');
		currentSources = lastAssistant?.sources || [];
		showSourcesDrawer = true;
	}

	function handleSelectionCopy(e) {
		console.log('Copied:', e.detail.text);
	}
</script>

<svelte:head>
	<title>Create | PromptFlam</title>
</svelte:head>

<Header showNewChat={hasMessages} onNewChat={handleNewChat} />

<main class="create-page">
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
					<PromptCard content={message.content} timestamp={message.timestamp} />
				{:else}
					<ChatMessage 
						content={message.content}
						sources={message.sources}
						isStreaming={isStreaming && index === $chatMessages.length - 1}
						on:rewrite={handleRewrite}
						on:openSources={handleOpenSources}
						on:share={handleShare}
						on:copy={handleCopy}
					/>
				{/if}
			{/each}
			
			{#if isLoading && !isStreaming}
				<ThinkingDots />
			{/if}

			{#if errorMessage}
				<div class="error-message">
					<p>{errorMessage}</p>
					<button on:click={() => errorMessage = ''}>Dismiss</button>
				</div>
			{/if}
		</div>
		
		<TextSelectionMenu 
			containerRef={chatContentRef}
			on:rewrite={handleSelectionRewrite}
			on:source={handleSelectionSource}
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
		padding-top: var(--header-height);
		padding-bottom: calc(var(--input-drawer-min-height) + 40px);
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
		border-radius: var(--radius-md);
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
		font-size: var(--font-size-sm);
	}

	.error-message button {
		background: transparent;
		color: #dc2626;
		font-size: var(--font-size-sm);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.error-message button:hover {
		background: #fee2e2;
	}
</style>
