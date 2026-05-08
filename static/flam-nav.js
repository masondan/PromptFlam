/**
 * FlamNav Web Component
 * Shared hamburger menu for all FlamTools apps.
 * Usage: <flam-nav current="promptflam"></flam-nav>
 */
class FlamNav extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this._open = false;
		this._portalOverlay = null;
		this._portalDrawer = null;
	}

	static get observedAttributes() {
		return ['current'];
	}

	get current() {
		return this.getAttribute('current') || '';
	}

	connectedCallback() {
		this.render();
		this._onKeyDown = (e) => { if (e.key === 'Escape') this.close(); };
	}

	disconnectedCallback() {
		document.removeEventListener('keydown', this._onKeyDown);
		this._removePortal();
	}

	toggle() {
		this._open ? this.close() : this.open();
	}

	_createPortal() {
		if (this._portalOverlay) return;

		const style = `
			<style id="flam-nav-portal-style">
				.flam-nav-overlay {
					position: fixed;
					inset: 0;
					background: rgba(0, 0, 0, 0.3);
					z-index: 9998;
					opacity: 0;
					visibility: hidden;
					transition: opacity 250ms ease, visibility 250ms ease;
				}
				.flam-nav-overlay.open {
					opacity: 1;
					visibility: visible;
				}
				.flam-nav-drawer {
					position: fixed;
					top: 0;
					left: 0;
					width: 180px;
					height: 100vh;
					background: #fff;
					z-index: 9999;
					opacity: 0;
					visibility: hidden;
					transition: opacity 250ms ease, visibility 250ms ease;
					display: flex;
					flex-direction: column;
					box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
					overflow: hidden;
					font-family: 'Saira', -apple-system, BlinkMacSystemFont, sans-serif;
				}
				.flam-nav-drawer.open {
					opacity: 1;
					visibility: visible;
				}
				.flam-nav-drawer-header {
					padding: 20px 16px 12px;
					border-bottom: 1px solid #e0e0e0;
					flex-shrink: 0;
				}
				.flam-nav-drawer-header a {
					display: flex;
					align-items: center;
					gap: 8px;
					text-decoration: none;
					color: #5422b0;
					font-size: 15px;
					font-weight: 750;
				}
				.flam-nav-drawer-header img {
					width: 20px;
					height: 20px;
				}
				.flam-nav-drawer-list {
					list-style: none;
					margin: 0;
					padding: 8px 0;
					flex: 1;
					overflow-y: auto;
				}
				.flam-nav-drawer-list li a {
					display: block;
					padding: 10px 16px;
					text-decoration: none;
					font-size: 15px;
					font-weight: 550;
					color: #333;
					transition: background-color 150ms ease;
				}
				.flam-nav-drawer-list li a:hover {
					background-color: #f5f0fa;
				}
				.flam-nav-drawer-list li a.current {
					color: #5422b0;
					font-weight: 750;
					background-color: #f0e6f7;
				}
				.flam-nav-drawer-list li a.training {
					color: #777;
				}
				.flam-nav-drawer-list li a.training.current {
					color: #5422b0;
				}
				.flam-nav-drawer-list li.separator {
					height: 1px;
					background: #eee;
					margin: 6px 16px;
				}
			</style>
		`;

		if (!document.getElementById('flam-nav-portal-style')) {
			document.head.insertAdjacentHTML('beforeend', style);
		}

		const apps = [
			{ id: 'promptflam', name: 'PromptFlam', url: 'https://promptflam.flamtools.com' },
			{ id: 'picflam', name: 'PicFlam', url: 'https://picflam.flamtools.com' },
			{ id: 'audioflam', name: 'AudioFlam', url: 'https://audioflam.flamtools.com' },
			{ id: 'chartflam', name: 'ChartFlam', url: 'https://chartflam.flamtools.com' },
			{ id: 'mapflam', name: 'MapFlam', url: 'https://mapflam.flamtools.com' },
			{ id: 'subflam', name: 'SubFlam', url: 'https://subflam.flamtools.com' },
			{ id: 'storyflam', name: 'StoryFlam', url: 'https://storyflam.flamtools.com', training: true },
			{ id: 'flamit', name: 'FlamIt', url: 'https://flamit.flamtools.com', training: true }
		];
		const current = this.current;

		const listItems = apps.map((app, i) => {
			const isCurrent = app.id === current;
			const classes = [isCurrent ? 'current' : '', app.training ? 'training' : ''].filter(Boolean).join(' ');
			const separator = i === 6 ? '<li class="separator"></li>' : '';
			return `${separator}<li><a href="${app.url}"${classes ? ` class="${classes}"` : ''}>${app.name}</a></li>`;
		}).join('');

		this._portalOverlay = document.createElement('div');
		this._portalOverlay.className = 'flam-nav-overlay';
		this._portalOverlay.addEventListener('click', () => this.close());

		this._portalDrawer = document.createElement('div');
		this._portalDrawer.className = 'flam-nav-drawer';
		this._portalDrawer.setAttribute('role', 'navigation');
		this._portalDrawer.setAttribute('aria-label', 'FlamTools navigation');
		this._portalDrawer.innerHTML = `
			<div class="flam-nav-drawer-header">
				<a href="https://flamtools.com">
					<img src="https://flamtools.com/logos/logo-flamtools-favicon.svg" alt="" />
					FlamTools
				</a>
			</div>
			<ul class="flam-nav-drawer-list">${listItems}</ul>
		`;

		document.body.appendChild(this._portalOverlay);
		document.body.appendChild(this._portalDrawer);
	}

	_removePortal() {
		if (this._portalOverlay) {
			this._portalOverlay.remove();
			this._portalOverlay = null;
		}
		if (this._portalDrawer) {
			this._portalDrawer.remove();
			this._portalDrawer = null;
		}
	}

	open() {
		this._open = true;
		this._createPortal();
		// Force reflow before adding open class for transition to work
		this._portalOverlay.getBoundingClientRect();
		this._portalOverlay.classList.add('open');
		this._portalDrawer.classList.add('open');
		document.addEventListener('keydown', this._onKeyDown);
	}

	close() {
		this._open = false;
		if (this._portalOverlay) this._portalOverlay.classList.remove('open');
		if (this._portalDrawer) this._portalDrawer.classList.remove('open');
		setTimeout(() => {
			this._removePortal();
		}, 250);
		document.removeEventListener('keydown', this._onKeyDown);
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: flex;
					align-items: center;
				}

				.menu-btn {
					display: flex;
					align-items: center;
					justify-content: center;
					border: none;
					background: transparent;
					cursor: pointer;
					padding: 0;
					color: inherit;
					transition: color 150ms ease;
				}

				.menu-btn:hover {
					color: var(--flam-nav-hover, #5422b0);
				}

				.menu-btn svg {
					width: 22px;
					height: 22px;
				}
			</style>

			<button class="menu-btn" aria-label="Open navigation menu" type="button">
				<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4">
					<path d="M7.95 11.95H39.95"/>
					<path d="M7.95 23.95H39.95"/>
					<path d="M7.95 35.95H39.95"/>
				</svg>
			</button>
		`;

		this.shadowRoot.querySelector('.menu-btn').addEventListener('click', () => this.toggle());
	}
}

customElements.define('flam-nav', FlamNav);
