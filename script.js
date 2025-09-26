// Wait for the HTML to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. STATE ---
    // This will hold all our prompts after we fetch them.
    let allPrompts = [];

    // --- 2. ELEMENTS ---
    // Get references to the HTML elements we'll be working with.
    const promptListContainer = document.getElementById('prompt-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const subcategoryFilter = document.getElementById('subcategory-filter');

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
                    html += `
                        <div class="task-item">
                            ${task.task ? `<h4>${task.task}</h4>` : ''}
                            <p>${task.prompt}</p>
                            <button class="copy-btn" data-prompt-id="${task.id}">Copy</button>
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
        // Get unique categories, convert to Set to remove duplicates, then back to Array
        const categories = [...new Set(allPrompts.map(prompt => prompt.category))];
        categories.sort(); // Sort categories alphabetically for a better user experience

        // Clear existing options (keeping the "All Categories" option from HTML)
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';

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

        subcategoryFilter.innerHTML = '<option value="all">All Sub-categories</option>';
        subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subcategoryFilter.appendChild(option);
        });

        subcategoryFilter.classList.remove('hidden');
    }

    /**
     * Applies all active filters (search and category) to the prompts and displays them.
     */
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedSubcategory = subcategoryFilter.value;

        let filteredPrompts = allPrompts;

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
        // Check if a copy button was clicked
        if (event.target.matches('.copy-btn')) {
            const button = event.target;
            const promptId = parseInt(button.dataset.promptId, 10);
            const promptToCopy = allPrompts.find(p => p.id === promptId);

            if (promptToCopy) {
                // Create a temporary element to convert HTML to plain text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = promptToCopy.prompt;
                const plainText = tempDiv.textContent || tempDiv.innerText || "";

                // Use the Clipboard API to copy the plain text version
                navigator.clipboard.writeText(plainText).then(() => {
                    // Provide visual feedback
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    button.classList.add('copied');

                    // Revert the button text after 2 seconds
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
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