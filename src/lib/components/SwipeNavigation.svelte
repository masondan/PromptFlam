<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount, tick } from 'svelte';

	const pages = ['/prompts', '/', '/notepad', '/archive'];
	
	let container;
	let startX = 0;
	let startY = 0;
	let currentX = 0;
	let isDragging = false;
	let isHorizontalSwipe = null;
	let translateX = 0;
	let transitioning = false;
	let animating = false;
	let enterDirection = null;

	const SWIPE_THRESHOLD = 80;
	const VELOCITY_THRESHOLD = 0.3;
	let startTime = 0;

	function getCurrentIndex() {
		const path = $page.url.pathname;
		const idx = pages.indexOf(path);
		return idx === -1 ? 1 : idx;
	}

	function handleTouchStart(e) {
		if (transitioning || animating) return;
		
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
		currentX = startX;
		startTime = Date.now();
		isDragging = true;
		isHorizontalSwipe = null;
		translateX = 0;
	}

	function handleTouchMove(e) {
		if (!isDragging || transitioning || animating) return;

		const touchX = e.touches[0].clientX;
		const touchY = e.touches[0].clientY;
		const deltaX = touchX - startX;
		const deltaY = touchY - startY;

		if (isHorizontalSwipe === null) {
			if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
				isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
			}
		}

		if (isHorizontalSwipe) {
			e.preventDefault();
			currentX = touchX;
			
			const currentIndex = getCurrentIndex();
			const atStart = currentIndex === 0 && deltaX > 0;
			const atEnd = currentIndex === pages.length - 1 && deltaX < 0;
			
			if (atStart || atEnd) {
				translateX = deltaX * 0.3;
			} else {
				translateX = deltaX;
			}
		}
	}

	function handleTouchEnd() {
		if (!isDragging || transitioning || animating) {
			isDragging = false;
			return;
		}

		const deltaX = currentX - startX;
		const elapsed = Date.now() - startTime;
		const velocity = Math.abs(deltaX) / elapsed;
		const currentIndex = getCurrentIndex();

		const shouldNavigate = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD;

		if (isHorizontalSwipe && shouldNavigate) {
			if (deltaX > 0 && currentIndex > 0) {
				navigateTo(currentIndex - 1, 'from-left');
			} else if (deltaX < 0 && currentIndex < pages.length - 1) {
				navigateTo(currentIndex + 1, 'from-right');
			} else {
				resetPosition();
			}
		} else {
			resetPosition();
		}

		isDragging = false;
		isHorizontalSwipe = null;
	}

	async function navigateTo(index, direction) {
		transitioning = true;
		enterDirection = direction;
		
		const exitX = direction === 'from-right' ? -window.innerWidth : window.innerWidth;
		translateX = exitX;

		await new Promise(r => setTimeout(r, 200));
		
		await goto(pages[index]);
		await tick();
		
		// Position new page off-screen BEFORE enabling transition
		translateX = direction === 'from-right' ? window.innerWidth : -window.innerWidth;
		
		await tick();
		
		// Now enable transition and animate to center
		requestAnimationFrame(() => {
			transitioning = false;
			animating = true;
			
			requestAnimationFrame(() => {
				translateX = 0;
				setTimeout(() => {
					animating = false;
					enterDirection = null;
				}, 200);
			});
		});
	}

	function resetPosition() {
		translateX = 0;
	}

	onMount(() => {
		if (container) {
			container.addEventListener('touchstart', handleTouchStart, { passive: true });
			container.addEventListener('touchmove', handleTouchMove, { passive: false });
			container.addEventListener('touchend', handleTouchEnd, { passive: true });
		}

		return () => {
			if (container) {
				container.removeEventListener('touchstart', handleTouchStart);
				container.removeEventListener('touchmove', handleTouchMove);
				container.removeEventListener('touchend', handleTouchEnd);
			}
		};
	});

	$: transitionStyle = (isDragging || transitioning) ? 'none' : 'transform 0.2s ease-out';
$: isTransforming = (isDragging && isHorizontalSwipe) || transitioning || animating || translateX !== 0;
</script>

<div 
	bind:this={container} 
	class="swipe-container"
	class:transforming={isTransforming}
	style={isTransforming ? `transform: translateX(${translateX}px); transition: ${transitionStyle};` : ''}
>
	<slot />
</div>

<style>
	.swipe-container {
		min-height: 100dvh;
		background: var(--bg-main);
	}
	
	.swipe-container.transforming {
		will-change: transform;
	}
</style>
