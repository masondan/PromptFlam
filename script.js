// Wait for the HTML to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // --- SPLASH SCREEN LOGIC ---
    const enterBtn = document.getElementById('enter-app-btn');
    const splashScreen = document.getElementById('splash-screen');
    const appContent = document.getElementById('app-content');

    // Check if all elements exist before adding the event listener
    if (enterBtn && splashScreen && appContent) {
        enterBtn.addEventListener('click', () => {
            splashScreen.style.display = 'none';
            appContent.style.display = 'block';
            
            // Show tooltip if user hasn't seen it before
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
        {
            title: 'Welcome',
            text: 'Browse all prompts, tap search, or drill down using the category dropdown menus.'
        },
        {
            title: 'Favourites',
            text: 'Tap the button under any prompt then use the heart at the top to view favourites.'
        },
        {
            title: 'Copy and Go',
            text: 'Copy a prompt, paste into your AI chatbot of choice and customise for your story.'
        },
        {
            title: 'Remember',
            text: 'AI can make mistakes - always check. Happy storytelling with PromptFlam!'
        }
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

        // Update dots
        tooltipDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentTooltipStep);
        });

        // Update button states
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

    // Tooltip event listeners
    tooltipClose.addEventListener('click', hideTooltip);
    tooltipOverlay.addEventListener('click', hideTooltip);
    tooltipNext.addEventListener('click', nextTooltipStep);
    tooltipPrev.addEventListener('click', prevTooltipStep);

    // --- HEADER SCROLL TRANSPARENCY ---
    const appHeader = document.getElementById('app-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            appHeader.classList.add('scrolled');
        } else {
            appHeader.classList.remove('scrolled');
        }
    });

    // --- 1. STATE ---
    // This will hold all our prompts after we fetch them.
    let allPrompts = [];
    let favourites = JSON.parse(localStorage.getItem('promptflamFavourites')) || [];
    let showingFavourites = false;

    // --- 2. ELEMENTS ---
    // Get references to the HTML elements we'll be working with.
    const promptListContainer = document.getElementById('prompt-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const subcategoryFilter = document.getElementById('subcategory-filter');
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchContainer = document.getElementById('search-container');
    const favouritesFilterBtn = document.getElementById('favourites-filter-btn');

    // --- 3. FUNCTIONS ---

    /**
     * Renders a list of prompts to the page.
     * @param {Array} prompts - The array of prompt objects to display.
     */
    function displayPrompts(prompts) {
        // If there are no prompts, show a message.
        if (prompts.length === 0) {
            promptListContainer.innerHTML = '<p>No prompts found.</p>';
            return;
        }

        // Group prompts by category, then by subCategory
        const groupedPrompts = prompts.reduce((acc, prompt) => {
            // Group by Category
            if (!acc[prompt.category]) {
                acc[prompt.category] = {};
            }
            // Group by SubCategory
            if (!acc[prompt.category][prompt.subCategory]) {
                acc[prompt.category][prompt.subCategory] = [];
            }
            acc[prompt.category][prompt.subCategory].push(prompt);
            return acc;
        }, {});

        let html = '';

        // Loop through categories
        for (const category in groupedPrompts) {
            html += `<div class="category-group">`;
            html += `<h2 class="category-title">${category}</h2>`;

            // Loop through subcategories within the current category
            for (const subCategory in groupedPrompts[category]) {
                html += `<div class="subcategory-card">`;
                html += `<h3 class="subcategory-title">${subCategory}</h3>`;

                // Loop through tasks within the current subcategory
                const tasks = groupedPrompts[category][subCategory];
                tasks.forEach(task => {
                    const isFavourite = favourites.includes(task.id);
                    html += `
                        <div class="task-item">
                            ${task.prompt.trim().startsWith('<p>') ? 
                                // If prompt already has a <p> tag, inject the label inside it
                                task.prompt.replace('<p>', `<p>${task.task ? `<strong class="task-label">${task.task}</strong> ` : ''}`) :
                                // Otherwise, wrap everything in a new <p> tag
                                `<p>${task.task ? `<strong class="task-label">${task.task}</strong> ` : ''}${task.prompt}</p>`
                            }
                            <div class="action-buttons">
                                <button class="action-btn favourite-btn ${isFavourite ? 'active' : ''}" data-prompt-id="${task.id}" aria-label="Add to favourites">
                                    ${isFavourite ? 
                                        '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M14.88 4.78079C14.7993 4.46498 14.6748 4.16202 14.51 3.88077C14.3518 3.58819 14.1493 3.3217 13.91 3.09073C13.563 2.74486 13.152 2.46982 12.7 2.28079C11.7902 1.90738 10.7698 1.90738 9.85999 2.28079C9.43276 2.46163 9.04027 2.71541 8.70002 3.03079L8.65003 3.09073L8.00001 3.74075L7.34999 3.09073L7.3 3.03079C6.95975 2.71541 6.56726 2.46163 6.14002 2.28079C5.23018 1.90738 4.20984 1.90738 3.3 2.28079C2.84798 2.46982 2.43706 2.74486 2.09004 3.09073C1.85051 3.32402 1.64514 3.59002 1.48002 3.88077C1.32258 4.1644 1.20161 4.46682 1.12 4.78079C1.03522 5.10721 0.994861 5.44358 1.00001 5.78079C1.00053 6.09791 1.04084 6.41365 1.12 6.72073C1.20384 7.03078 1.32472 7.32961 1.48002 7.61075C1.64774 7.89975 1.85285 8.16542 2.09004 8.40079L8.00001 14.3108L13.91 8.40079C14.1471 8.16782 14.3492 7.90169 14.51 7.61075C14.6729 7.33211 14.7974 7.03272 14.88 6.72073C14.9592 6.41365 14.9995 6.09791 15 5.78079C15.0052 5.44358 14.9648 5.10721 14.88 4.78079Z"/></svg>' :
                                        '<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M14.88 4.78a3.489 3.489 0 0 0-.37-.9 3.24 3.24 0 0 0-.6-.79 3.78 3.78 0 0 0-1.21-.81 3.74 3.74 0 0 0-2.84 0 4 4 0 0 0-1.16.75l-.05.06-.65.65-.65-.65-.05-.06a4 4 0 0 0-1.16-.75 3.74 3.74 0 0 0-2.84 0 3.78 3.78 0 0 0-1.21.81 3.55 3.55 0 0 0-.97 1.69 3.75 3.75 0 0 0-.12 1c0 .317.04.633.12.94a4 4 0 0 0 .36.89 3.8 3.8 0 0 0 .61.79L8 14.31l5.91-5.91c.237-.233.44-.5.6-.79A3.578 3.578 0 0 0 15 5.78a3.747 3.747 0 0 0-.12-1zm-1 1.63a2.69 2.69 0 0 1-.69 1.21l-5.21 5.2-5.21-5.2a2.9 2.9 0 0 1-.44-.57 3 3 0 0 1-.27-.65 3.25 3.25 0 0 1-.08-.69A3.36 3.36 0 0 1 2.06 5a2.8 2.8 0 0 1 .27-.65c.12-.21.268-.4.44-.57a2.91 2.91 0 0 1 .89-.6 2.8 2.8 0 0 1 2.08 0c.33.137.628.338.88.59l1.36 1.37 1.36-1.37a2.72 2.72 0 0 1 .88-.59 2.8 2.8 0 0 1 2.08 0c.331.143.633.347.89.6.174.165.32.357.43.57a2.69 2.69 0 0 1 .35 1.34 2.6 2.6 0 0 1-.06.72h-.03z"/></svg>'
                                    }
                                </button>
                                <button class="action-btn copy-btn" data-prompt-id="${task.id}" aria-label="Copy prompt">
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z" fill="currentColor"/>
                                    </svg>
                                </button>
                                <button class="action-btn back-to-top-btn" aria-label="Back to top">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 14 4-4 4 4"/></svg>
                                </button>
                            </div>
                        </div>
                    `;
                });

                html += `</div>`; // Close subcategory-card
            }

            html += `</div>`; // Close category-group
        }

        promptListContainer.innerHTML = html;
    }

    /**
     * Populates the category filter dropdown with unique categories from allPrompts.
     */
    function populateCategoryFilter() {
        // Define the desired order for categories
        const customCategoryOrder = ['Text', 'Audio', 'Video', 'Social Media', 'Website', 'Strategy', 'Co-pilot', 'Image Gen'];

        // Get unique categories, convert to Set to remove duplicates, then back to Array
        const categories = [...new Set(allPrompts.map(prompt => prompt.category))];
        // Sort categories based on the custom order
        categories.sort((a, b) => customCategoryOrder.indexOf(a) - customCategoryOrder.indexOf(b));

        // Clear existing options (keeping the "All Prompts" option from HTML)
        categoryFilter.innerHTML = '<option value="all">All Prompts</option>';

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    /**
     * Populates the sub-category filter based on the selected main category.
     */
    function populateSubcategoryFilter() {
        const selectedCategory = categoryFilter.value;

        if (selectedCategory === 'all') {
            subcategoryFilter.classList.add('hidden');
            subcategoryFilter.value = 'all'; // Reset selection
            return;
        }

        const promptsInCategory = allPrompts.filter(p => p.category === selectedCategory);
        const subcategories = [...new Set(promptsInCategory.map(p => p.subCategory))];
        subcategories.sort();

        subcategoryFilter.innerHTML = '<option value="all">Filter Prompts</option>';
        subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subcategoryFilter.appendChild(option);
        });

        subcategoryFilter.classList.remove('hidden');
    }

    /**
     * Saves favourites to localStorage
     */
    function saveFavourites() {
        localStorage.setItem('promptflamFavourites', JSON.stringify(favourites));
    }

    /**
     * Toggles a prompt's favourite status
     */
    function toggleFavourite(promptId) {
        const index = favourites.indexOf(promptId);
        if (index > -1) {
            favourites.splice(index, 1);
        } else {
            favourites.push(promptId);
        }
        saveFavourites();
    }

    /**
     * Applies all active filters (search, category, and favourites) to the prompts and displays them.
     */
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedSubcategory = subcategoryFilter.value;

        let filteredPrompts = allPrompts;

        // Filter by favourites if active
        if (showingFavourites) {
            filteredPrompts = filteredPrompts.filter(prompt => favourites.includes(prompt.id));
        }

        if (searchTerm) {
            filteredPrompts = filteredPrompts.filter(prompt =>
                prompt.task.toLowerCase().includes(searchTerm) ||
                prompt.prompt.toLowerCase().includes(searchTerm) ||
                prompt.category.toLowerCase().includes(searchTerm) ||
                prompt.subCategory.toLowerCase().includes(searchTerm));
        }

        if (selectedCategory !== 'all') {
            filteredPrompts = filteredPrompts.filter(prompt => prompt.category === selectedCategory);
        }

        if (selectedCategory !== 'all' && selectedSubcategory !== 'all') {
            filteredPrompts = filteredPrompts.filter(prompt => prompt.subCategory === selectedSubcategory);
        }

        displayPrompts(filteredPrompts);
    }

    // --- 4. EVENT LISTENERS ---
    promptListContainer.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        // Handle favourite button clicks
        if (target.classList.contains('favourite-btn')) {
            const promptId = parseInt(target.dataset.promptId, 10);
            toggleFavourite(promptId);
            applyFilters(); // Re-render to update the heart icon
        }

        // Handle copy button clicks
        if (target.classList.contains('copy-btn')) {
            const promptId = parseInt(target.dataset.promptId, 10);
            const promptToCopy = allPrompts.find(p => p.id === promptId);

            if (promptToCopy) {
                // Create a temporary element to convert HTML to plain text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = promptToCopy.prompt;

                // For innerText to correctly calculate line breaks, the element must be in the DOM.
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                document.body.appendChild(tempDiv);
                const plainText = tempDiv.innerText;
                document.body.removeChild(tempDiv);
                
                // Use the Clipboard API to copy the plain text version
                navigator.clipboard.writeText(plainText).then(() => {
                    // Provide visual feedback
                    target.classList.add('copied');

                    // Revert after 2 seconds
                    setTimeout(() => {
                        target.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        }

        // Handle back to top button clicks
        if (target.classList.contains('back-to-top-btn')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Modify existing search input listener to call applyFilters
    searchInput.addEventListener('input', applyFilters);

    // New event listener for category filter dropdown
    categoryFilter.addEventListener('change', () => {
        populateSubcategoryFilter();
        applyFilters();
    });
    subcategoryFilter.addEventListener('change', applyFilters);

    // New event listener for the search toggle icon
    searchToggleBtn.addEventListener('click', () => {
        searchContainer.classList.toggle('hidden');
        if (!searchContainer.classList.contains('hidden')) {
            searchInput.focus(); // Automatically focus the input when shown
        }
    });

    // Event listener for favourites filter button
    favouritesFilterBtn.addEventListener('click', () => {
        showingFavourites = !showingFavourites;
        favouritesFilterBtn.classList.toggle('active', showingFavourites);
        
        // Reset category filters when showing favourites
        if (showingFavourites) {
            categoryFilter.value = 'all';
            subcategoryFilter.classList.add('hidden');
        }
        
        applyFilters();
    });


    // --- 5. INITIALIZATION ---
    // Fetch the prompts from the JSON file and initialize the app.
    fetch('prompts.json')
        .then(response => response.json())
        .then(data => {
            allPrompts = data; // Store the fetched prompts
            populateCategoryFilter(); // Populate the filter dropdown
            applyFilters(); // Display all prompts initially (or filtered if search is pre-filled)
        })
        .catch(error => {
            console.error('Error fetching prompts:', error);
            promptListContainer.innerHTML = '<p>Could not load prompts. Please check the console for errors.</p>';
        });
});