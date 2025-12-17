// Wait for the HTML to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // --- SPLASH SCREEN LOGIC ---
    const enterBtn = document.getElementById('enter-app-btn');
    const splashScreen = document.getElementById('splash-screen');
    const appContent = document.getElementById('app-content');

    if (enterBtn && splashScreen && appContent) {
        enterBtn.addEventListener('click', () => {
            splashScreen.style.display = 'none';
            appContent.style.display = 'block';
            const hasSeenTooltip = localStorage.getItem('promptflamTooltipSeen');
            if (!hasSeenTooltip) {
                showTooltip();
            }
        });
    }

    // --- TOOLTIP LOGIC ---
    const tooltip = document.getElementById('tooltip');
    const tooltipOverlay = document.getElementById('tooltip-overlay');
    const tooltipTitle = document.getElementById('tooltip-title');
    const tooltipText = document.getElementById('tooltip-text');
    const tooltipClose = document.getElementById('tooltip-close');
    const tooltipPrev = document.getElementById('tooltip-prev');
    const tooltipNext = document.getElementById('tooltip-next');
    const tooltipDots = document.querySelectorAll('.tooltip-progress-dots .dot');
    const tooltipSteps = [
        { title: 'Welcome', text: 'Browse all prompts, tap search, or refine using the dropdown menus.' },
        { title: 'Favourites', text: 'Add favourite prompts and view using the heart button at the top.' },
        { title: 'Edit & Share', text: 'Edit your prompt then copy or share to your AI chatbot of choice' },
        { title: 'Always check', text: 'AI makes mistakes - always check. Happy storytelling with PromptFlam!' }
    ];
    let currentTooltipStep = 0;

    function showTooltip() {
        currentTooltipStep = 0;
        updateTooltipContent();
        tooltip.classList.remove('hidden');
        tooltipOverlay.classList.remove('hidden');
    }

    function hideTooltip() {
        tooltip.classList.add('hidden');
        tooltipOverlay.classList.add('hidden');
        localStorage.setItem('promptflamTooltipSeen', 'true');
    }

    function updateTooltipContent() {
        const step = tooltipSteps[currentTooltipStep];
        tooltipTitle.textContent = step.title;
        tooltipText.textContent = step.text;
        tooltipDots.forEach((dot, index) => dot.classList.toggle('active', index === currentTooltipStep));
        tooltipPrev.classList.toggle('inactive', currentTooltipStep === 0);
        tooltipNext.classList.toggle('inactive', currentTooltipStep === tooltipSteps.length - 1);
    }

    function nextTooltipStep() {
        if (currentTooltipStep < tooltipSteps.length - 1) {
            currentTooltipStep++;
            updateTooltipContent();
        } else {
            hideTooltip();
        }
    }

    function prevTooltipStep() {
        if (currentTooltipStep > 0) {
            currentTooltipStep--;
            updateTooltipContent();
        }
    }

    tooltipClose.addEventListener('click', hideTooltip);
    tooltipOverlay.addEventListener('click', hideTooltip);
    tooltipNext.addEventListener('click', nextTooltipStep);
    tooltipPrev.addEventListener('click', prevTooltipStep);

    // --- HEADER SCROLL TRANSPARENCY ---
    const appHeader = document.getElementById('app-header');
    window.addEventListener('scroll', () => {
        appHeader.classList.toggle('scrolled', window.scrollY > 50);
    });

    // --- 1. STATE ---
    let allPrompts = [];
    let favourites = JSON.parse(localStorage.getItem('promptflamFavourites')) || [];
    let showingFavourites = false;

    function getSubcategoryId(category, subCategory) {
        return `${category}-${subCategory}`;
    }

    // --- 2. ELEMENTS ---
    const promptListContainer = document.getElementById('prompt-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const subcategoryFilter = document.getElementById('subcategory-filter');
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchContainer = document.getElementById('search-container');
    const favouritesFilterBtn = document.getElementById('favourites-filter-btn');

    // Edit drawer elements
    const editDrawer = document.getElementById('edit-drawer');
    const editDrawerOverlay = document.getElementById('edit-drawer-overlay');

    const editDrawerTextarea = document.getElementById('edit-drawer-textarea');
    const editDrawerCopyBtn = document.getElementById('edit-drawer-copy-btn');
    const editDrawerShareBtn = document.getElementById('edit-drawer-share-btn');
    const editDrawerCloseBtn = document.getElementById('edit-drawer-close-btn');

    // Bracket tooltip elements
    const bracketTooltip = document.getElementById('bracket-tooltip');
    const bracketTooltipClose = document.getElementById('bracket-tooltip-close');

    // --- 3. CUSTOM SELECT DROPDOWN LOGIC ---
    function initCustomSelect(selectElement) {
        const selected = selectElement.querySelector('.select-selected');
        const items = selectElement.querySelector('.select-items');
        const selectedText = selected.querySelector('span');

        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllSelect(selected);
            items.classList.toggle('select-hide');
            selected.classList.toggle('select-arrow-active');
        });

        selectElement.populate = (options, defaultText, defaultValue = 'all') => {
            items.innerHTML = '';
            selectedText.textContent = defaultText;
            selectElement.dataset.value = defaultValue;

            const defaultOption = document.createElement('div');
            defaultOption.textContent = defaultText;
            defaultOption.setAttribute('data-value', defaultValue);
            items.appendChild(defaultOption);

            options.forEach(optionText => {
                const option = document.createElement('div');
                option.textContent = optionText;
                option.setAttribute('data-value', optionText);
                items.appendChild(option);
            });

            // Add click listeners to new options
            Array.from(items.children).forEach(item => {
                item.addEventListener('click', function () {
                    selectedText.textContent = this.textContent;
                    selectElement.dataset.value = this.getAttribute('data-value');
                    items.classList.add('select-hide');
                    selected.classList.remove('select-arrow-active');
                    // Trigger a change event for filtering
                    selectElement.dispatchEvent(new Event('change'));
                });
            });
        };
    }

    function closeAllSelect(exceptThis) {
        document.querySelectorAll('.custom-select .select-items').forEach((items, i, arr) => {
            const selected = arr[i].previousElementSibling;
            if (selected !== exceptThis) {
                items.classList.add('select-hide');
                selected.classList.remove('select-arrow-active');
            }
        });
    }

    document.addEventListener('click', closeAllSelect);

    // --- 3B. BRACKET SELECTION FUNCTIONS ---
    let lastSelectedBracket = null; // Track last selected bracket for double-tap logic

    function findBracketAtPosition(text, cursorPos) {
        // Find all [bracketed] text patterns
        const bracketRegex = /\[([^\]]+)\]/g;
        let match;
        
        while ((match = bracketRegex.exec(text)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            
            // Check if cursor is inside this bracket (including the brackets themselves)
            if (cursorPos >= start && cursorPos <= end) {
                return {
                    start: start,
                    end: end,
                    text: match[0]
                };
            }
        }
        return null;
    }

    function showBracketTooltip(x, y, textareaRect, isNearBottom, isMobile) {
        const hasSeenTip = localStorage.getItem('bracketTipSeen');
        if (hasSeenTip) return;

        bracketTooltip.classList.remove('hidden');
        
        // Wait for browser to calculate dimensions
        setTimeout(() => {
            const tooltipWidth = bracketTooltip.offsetWidth;
            const tooltipHeight = bracketTooltip.offsetHeight;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let left, top;
            
            if (isMobile) {
                // Mobile: Center horizontally within textarea, position below selection
                const textareaCenterX = textareaRect.left + (textareaRect.width / 2);
                left = textareaCenterX - (tooltipWidth / 2);
                
                // Ensure tooltip doesn't overflow left/right edges
                const margin = 10;
                left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin));
                
                // Position below or above selection
                if (isNearBottom) {
                    top = y - tooltipHeight - 10;
                } else {
                    top = y + 20;
                }
            } else {
                // Desktop: Position near click but ensure visibility
                left = x - (tooltipWidth / 2);
                
                // Keep within viewport bounds
                const margin = 20;
                left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin));
                
                // Position below or above
                if (isNearBottom) {
                    top = y - tooltipHeight - 15;
                } else {
                    top = y + 15;
                }
            }
            
            bracketTooltip.style.left = left + 'px';
            bracketTooltip.style.top = top + 'px';
            
            // Trigger show animation
            bracketTooltip.classList.add('show');
        }, 10);
    }

    function hideBracketTooltip() {
        bracketTooltip.classList.remove('show');
        setTimeout(() => {
            bracketTooltip.classList.add('hidden');
        }, 200);
    }

    function dismissBracketTooltip() {
        hideBracketTooltip();
        localStorage.setItem('bracketTipSeen', 'true');
    }

    // --- 3C. EDIT DRAWER FUNCTIONS ---
    function openEditDrawer(promptId) {
        const prompt = allPrompts.find(p => p.id === promptId);
        if (!prompt) return;

        // Extract plain text from HTML, preserving line breaks
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = prompt.prompt;
        
        // Replace <br> tags with newlines before extracting text
        tempDiv.querySelectorAll('br').forEach(br => {
            br.replaceWith('\n');
        });
        
        // Replace closing </p> tags with double newlines for paragraph breaks
        tempDiv.querySelectorAll('p').forEach(p => {
            p.insertAdjacentText('afterend', '\n');
        });
        
        const plainText = (tempDiv.innerText || tempDiv.textContent).trim();

        // Populate textarea
        editDrawerTextarea.value = plainText;

        // Show drawer
        editDrawerOverlay.classList.remove('hidden');
        editDrawer.classList.remove('hidden');

        // Trigger animation
        setTimeout(() => {
            editDrawer.classList.add('open');
        }, 10);

        // Focus textarea with small delay for iOS
        setTimeout(() => {
            editDrawerTextarea.focus();
            // Move cursor to end of text
            editDrawerTextarea.setSelectionRange(plainText.length, plainText.length);
        }, 350);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    function closeEditDrawer() {
        editDrawer.classList.remove('open');

        setTimeout(() => {
            editDrawer.classList.add('hidden');
            editDrawerOverlay.classList.add('hidden');
            editDrawerTextarea.value = '';
        }, 300);

        // Restore body scroll
        document.body.style.overflow = '';
    }

    function copyTextFromDrawer() {
        const text = editDrawerTextarea.value;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            editDrawerCopyBtn.classList.add('copied');
            setTimeout(() => editDrawerCopyBtn.classList.remove('copied'), 2000);
        }).catch(err => console.error('Failed to copy text: ', err));
    }

    async function shareTextFromDrawer() {
        const text = editDrawerTextarea.value;
        if (!text) return;

        // Check if Web Share API is supported
        if (navigator.share) {
            try {
                await navigator.share({
                    text: text,
                    title: 'PromptFlam Prompt'
                });
            } catch (err) {
                // User cancelled or error occurred
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                    // Fallback to copy
                    copyTextFromDrawer();
                }
            }
        } else {
            // Fallback to copy for desktop
            copyTextFromDrawer();
        }
    }

    // --- 4. FUNCTIONS ---
    function displayPrompts(prompts) {
        if (prompts.length === 0) {
            promptListContainer.innerHTML = '<p>No prompts found.</p>';
            return;
        }
        const groupedPrompts = prompts.reduce((acc, prompt) => {
            if (!acc[prompt.category]) acc[prompt.category] = {};
            if (!acc[prompt.category][prompt.subCategory]) acc[prompt.category][prompt.subCategory] = [];
            acc[prompt.category][prompt.subCategory].push(prompt);
            return acc;
        }, {});

        let html = '';
        for (const category in groupedPrompts) {
            html += `<div class="category-group"><h2 class="category-title">${category}</h2>`;
            for (const subCategory in groupedPrompts[category]) {
                const subcategoryId = getSubcategoryId(category, subCategory);
                const isFavourite = favourites.includes(subcategoryId);
                html += `
                    <div class="subcategory-card">
                        <div class="subcategory-title-row">
                            <h3 class="subcategory-title">${subCategory}</h3>
                            <button class="action-btn subcategory-favourite-btn ${isFavourite ? 'active' : ''}" data-subcategory-id="${subcategoryId}" aria-label="Add subcategory to favourites">
                                ${isFavourite ? '<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' : '<svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'}
                            </button>
                        </div>`;
                groupedPrompts[category][subCategory].forEach(task => {
                    html += `
                        <div class="task-item">
                            ${task.prompt.trim().startsWith('<p>') ? task.prompt.replace('<p>', `<p>${task.task ? `<strong class="task-label">${task.task}</strong> ` : ''}`) : `<p>${task.task ? `<strong class="task-label">${task.task}</strong> ` : ''}${task.prompt}</p>`}
                            <div class="action-buttons">
                                <button class="action-btn edit-btn" data-prompt-id="${task.id}" aria-label="Edit prompt">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="action-btn copy-btn" data-prompt-id="${task.id}" aria-label="Copy prompt">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z" fill="currentColor"/></svg>
                                </button>
                                <button class="action-btn back-to-top-btn" aria-label="Back to top">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 14 4-4 4 4"/></svg>
                                </button>
                            </div>
                        </div>`;
                });
                html += `</div>`;
            }
            html += `</div>`;
        }
        promptListContainer.innerHTML = html;
    }

    function populateCategoryFilter() {
        const customCategoryOrder = ['Text', 'Audio', 'Video', 'Social Media', 'Website', 'Strategy', 'Co-pilot', 'Image Gen'];
        const categories = [...new Set(allPrompts.map(prompt => prompt.category))];
        categories.sort((a, b) => customCategoryOrder.indexOf(a) - customCategoryOrder.indexOf(b));
        categoryFilter.populate(categories, 'All Prompts');
    }

    function populateSubcategoryFilter() {
        const selectedCategory = categoryFilter.dataset.value;
        if (selectedCategory === 'all') {
            subcategoryFilter.classList.add('hidden');
            subcategoryFilter.dataset.value = 'all';
            return;
        }
        const promptsInCategory = allPrompts.filter(p => p.category === selectedCategory);
        const subcategories = [...new Set(promptsInCategory.map(p => p.subCategory))];
        subcategories.sort();
        subcategoryFilter.populate(subcategories, `All ${selectedCategory}`);
        subcategoryFilter.classList.remove('hidden');
    }

    function saveFavourites() {
        localStorage.setItem('promptflamFavourites', JSON.stringify(favourites));
    }

    function toggleFavourite(subcategoryId) {
        const index = favourites.indexOf(subcategoryId);
        if (index > -1) {
            favourites.splice(index, 1);
        } else {
            favourites.push(subcategoryId);
        }
        saveFavourites();
        applyFilters();
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.dataset.value;
        const selectedSubcategory = subcategoryFilter.dataset.value;

        let filteredPrompts = allPrompts;

        if (showingFavourites) {
            filteredPrompts = filteredPrompts.filter(prompt => favourites.includes(getSubcategoryId(prompt.category, prompt.subCategory)));
        }
        if (searchTerm) {
            filteredPrompts = filteredPrompts.filter(p =>
                p.task.toLowerCase().includes(searchTerm) ||
                p.prompt.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm) ||
                p.subCategory.toLowerCase().includes(searchTerm));
        }
        if (selectedCategory !== 'all') {
            filteredPrompts = filteredPrompts.filter(p => p.category === selectedCategory);
        }
        if (selectedCategory !== 'all' && selectedSubcategory !== 'all') {
            filteredPrompts = filteredPrompts.filter(p => p.subCategory === selectedSubcategory);
        }
        displayPrompts(filteredPrompts);
    }

    // --- 5. EVENT LISTENERS ---
    promptListContainer.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        if (target.classList.contains('subcategory-favourite-btn')) {
            toggleFavourite(target.dataset.subcategoryId);
        }
        if (target.classList.contains('edit-btn')) {
            const promptId = parseInt(target.dataset.promptId, 10);
            openEditDrawer(promptId);
        }
        if (target.classList.contains('copy-btn')) {
            const promptId = parseInt(target.dataset.promptId, 10);
            const promptToCopy = allPrompts.find(p => p.id === promptId);
            if (promptToCopy) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = promptToCopy.prompt;
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                document.body.appendChild(tempDiv);
                const plainText = tempDiv.innerText;
                document.body.removeChild(tempDiv);
                navigator.clipboard.writeText(plainText).then(() => {
                    target.classList.add('copied');
                    setTimeout(() => target.classList.remove('copied'), 2000);
                }).catch(err => console.error('Failed to copy text: ', err));
            }
        }
        if (target.classList.contains('back-to-top-btn')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', () => {
        populateSubcategoryFilter();
        applyFilters();
    });
    subcategoryFilter.addEventListener('change', applyFilters);

    searchToggleBtn.addEventListener('click', () => {
        searchContainer.classList.toggle('hidden');
        if (!searchContainer.classList.contains('hidden')) {
            searchInput.focus();
        }
    });

    favouritesFilterBtn.addEventListener('click', () => {
        showingFavourites = !showingFavourites;
        favouritesFilterBtn.classList.toggle('active', showingFavourites);
        if (showingFavourites) {
            categoryFilter.dataset.value = 'all';
            categoryFilter.querySelector('.select-selected span').textContent = 'All Prompts';
            subcategoryFilter.classList.add('hidden');
        }
        applyFilters();
    });

    // Edit drawer event listeners
    editDrawerCloseBtn.addEventListener('click', closeEditDrawer);
    editDrawerOverlay.addEventListener('click', closeEditDrawer);
    editDrawerCopyBtn.addEventListener('click', copyTextFromDrawer);
    editDrawerShareBtn.addEventListener('click', shareTextFromDrawer);

    // Close drawer on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !editDrawer.classList.contains('hidden')) {
            closeEditDrawer();
        }
    });

    // Prevent context menu on textarea (prevents right-click menu on second tap)
    editDrawerTextarea.addEventListener('contextmenu', (e) => {
        const cursorPos = editDrawerTextarea.selectionStart;
        const text = editDrawerTextarea.value;
        const bracket = findBracketAtPosition(text, cursorPos);
        if (bracket) {
            e.preventDefault();
        }
    });

    // Bracket selection on textarea click
    editDrawerTextarea.addEventListener('mousedown', (e) => {
        // Use mousedown instead of click for better control over selection behavior
        const text = editDrawerTextarea.value;
        
        // Small delay to let browser process the mousedown first
        setTimeout(() => {
            const currentSelection = {
                start: editDrawerTextarea.selectionStart,
                end: editDrawerTextarea.selectionEnd
            };

            // Check if there's currently a selection
            const hasSelection = currentSelection.start !== currentSelection.end;

            // Use the current cursor position to find if we're in a bracket
            const clickPos = editDrawerTextarea.selectionStart;
            const bracket = findBracketAtPosition(text, clickPos);

            if (bracket) {
                // Check if this bracket is already selected (second tap)
                if (lastSelectedBracket &&
                    lastSelectedBracket.start === bracket.start &&
                    lastSelectedBracket.end === bracket.end &&
                    hasSelection) {

                    // Second tap - clear tracking and let the cursor stay where browser placed it
                    lastSelectedBracket = null;
                    // The browser has already collapsed the selection and placed cursor
                    return;
                }

                // First tap - select the bracket
                editDrawerTextarea.setSelectionRange(bracket.start, bracket.end);
                lastSelectedBracket = bracket;

                // Show tooltip
                const textareaRect = editDrawerTextarea.getBoundingClientRect();
                const isNearBottom = e.clientY > (window.innerHeight / 2);
                const isMobile = window.innerWidth <= 768;
                showBracketTooltip(e.clientX, e.clientY, textareaRect, isNearBottom, isMobile);
            } else {
                // Not clicking on a bracket - clear tracking
                lastSelectedBracket = null;
            }
        }, 0);
    });

    // Dismiss tooltip on any keystroke
    editDrawerTextarea.addEventListener('input', () => {
        if (!bracketTooltip.classList.contains('hidden')) {
            dismissBracketTooltip();
        }
    });

    // Tooltip close button
    bracketTooltipClose.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissBracketTooltip();
    });

    // Dismiss tooltip on tap/click anywhere (including on tooltip itself)
    document.addEventListener('click', (e) => {
        if (!bracketTooltip.classList.contains('hidden') && 
            bracketTooltip.classList.contains('show')) {
            // Check if click is not on the close button (already handled above)
            if (!bracketTooltipClose.contains(e.target)) {
                dismissBracketTooltip();
            }
        }
    }, true); // Use capture phase to catch all clicks

    // --- 6. INITIALIZATION ---
    initCustomSelect(categoryFilter);
    initCustomSelect(subcategoryFilter);

    fetch('prompts.json')
        .then(response => response.json())
        .then(data => {
            allPrompts = data;
            populateCategoryFilter();
            applyFilters();
        })
        .catch(error => {
            console.error('Error fetching prompts:', error);
            promptListContainer.innerHTML = '<p>Could not load prompts. Please check the console for errors.</p>';
        });
});