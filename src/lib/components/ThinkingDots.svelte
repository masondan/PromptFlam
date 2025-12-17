<script>
	// Pulsing dots animation for AI "thinking" state
</script>

<div class="thinking-dots" aria-label="AI is thinking">
	<span class="dot"></span>
	<span class="dot"></span>
	<span class="dot"></span>
</div>

<style>
	.thinking-dots {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: var(--spacing-sm) 0;
	}

	.dot {
		width: 6px;
		height: 6px;
		background-color: var(--color-icon-default);
		border-radius: 50%;
		animation: pulse 1.4s ease-in-out infinite;
	}

	.dot:nth-child(1) {
		animation-delay: 0s;
	}

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
