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
        { title: 'Welcome', text: 'Browse all prompts, tap search, or drill down using the category dropdown menus.' },
        { title: 'Favourites', text: 'Tap the heart next to any prompt group then use the button at the top to view favourites.' },
        { title: 'Copy & Create', text: 'Copy a prompt, paste into your AI chatbot of choice and customise for your story or task.' },
        { title: 'Always check', text: 'AI can make mistakes - always check sources and facts. Happy storytelling with PromptFlam!' }
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
                item.addEventListener('click', function() {
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