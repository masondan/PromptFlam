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
	import { chatMessages, addChatMessage, clearChat, archiveCurrentChat } from '$lib/stores';

	let inputValue = '';
	let isLoading = false;
	let showPromptDrawer = false;
	let showSourcesDrawer = false;
	let currentSources = [];
	let highlightedSourceIndex = -1;
	let chatContentRef;

	$: hasMessages = $chatMessages.length > 0;

	const mockSources = [
		{
			title: 'Reuters: Global Climate Summit Reaches Historic Agreement',
			excerpt: 'World leaders have agreed to a landmark climate deal that sets ambitious targets for reducing carbon emissions by 2030...',
			url: 'https://reuters.com/climate-summit',
			domain: 'reuters.com'
		},
		{
			title: 'AP News: New Study Reveals Impact of Rising Temperatures',
			excerpt: 'Scientists have published findings showing the direct correlation between industrial emissions and global temperature increases...',
			url: 'https://apnews.com/climate-study',
			domain: 'apnews.com'
		},
		{
			title: 'BBC: Climate Change Effects Already Visible Worldwide',
			excerpt: 'From melting glaciers to intensifying storms, the effects of climate change are now observable across every continent...',
			url: 'https://bbc.com/climate-effects',
			domain: 'bbc.com'
		}
	];

	function generateMockResponse(prompt) {
		return `## Climate Crisis: A Call to Action

The global climate crisis has reached a critical juncture, demanding immediate and coordinated action from world leaders [1]. Recent scientific studies have confirmed that rising temperatures are directly linked to human industrial activity [2].

### Key Findings

The latest research shows that we are approaching several climate tipping points that could trigger irreversible changes to our planet's ecosystems. From the melting Arctic ice caps to the increasing frequency of extreme weather events, the evidence is undeniable [3].

### What Can Be Done

Experts recommend a multi-pronged approach:
- Rapid transition to renewable energy sources
- Investment in carbon capture technology
- International cooperation on emissions standards
- Support for communities most affected by climate change

The time for action is now. Every fraction of a degree matters in the fight against climate change.`;
	}

	async function handleSend(e) {
		const message = e.detail.message;
		if (!message) return;

		addChatMessage('user', message);
		inputValue = '';
		isLoading = true;

		await new Promise(resolve => setTimeout(resolve, 2000));

		const response = generateMockResponse(message);
		addChatMessage('assistant', response, mockSources);
		isLoading = false;
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
		currentSources = e.detail.sources || mockSources;
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
		showSourcesDrawer = true;
		currentSources = mockSources;
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
						on:rewrite={handleRewrite}
						on:openSources={handleOpenSources}
						on:share={handleShare}
						on:copy={handleCopy}
					/>
				{/if}
			{/each}
			
			{#if isLoading}
				<ThinkingDots />
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
</style>
