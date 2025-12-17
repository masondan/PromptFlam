# Development Setup & Workflow

This document guides AI agents and developers through setting up the PromptFlam Svelte refactor locally.

---

## Quick Start (5 minutes)

### 1. Prerequisites Check
```bash
# Verify you have Node.js 18+
node --version    # Should be v18.0.0 or higher

# Verify you have npm 9+
npm --version     # Should be v9.0.0 or higher

# Verify you have Git
git --version     # Should be git version 2.x or higher
```

If any are missing, install them:
- **Node.js**: https://nodejs.org/ (Install LTS version)
- **Git**: https://git-scm.com/

---

## Setup Steps

### Step 1: Clone Repository
```bash
cd ~/Desktop  # Or wherever you keep projects
git clone https://github.com/masondan/PromptFlam.git
cd PromptFlam
```

### Step 2: Create Development Branch
```bash
git checkout -b svelte-refactor
# This creates an isolated branch where we work safely
```

### Step 3: Verify Existing Files
Your working directory should now look like:
```
PromptFlam/
├── .git/
├── public/
├── script.js
├── style.css
├── index.html
├── prompts.json
├── package.json
├── agents.md
├── ROADMAP.md (new)
└── DEVELOPMENT.md (this file)
```

Keep all these files—they're version history. Don't delete them yet.

### Step 4: Create SvelteKit Project (Parallel to Existing Code)

We'll create a NEW SvelteKit project in a sibling directory, develop it, then integrate it.

```bash
# Stay in PromptFlam directory
# Create the Svelte project OUTSIDE PromptFlam for now
cd ..
npm create svelte@latest promptflam-svelte
```

When prompted:
- **Which template?** → Choose "Skeleton project"
- **Add TypeScript?** → No (not needed; use JavaScript)
- **Add ESLint?** → Yes (helps catch bugs)
- **Add Prettier?** → Yes (formats code nicely)
- **Add Vitest?** → No (testing; can add later)
- **Add Playwright?** → No (E2E testing; skip for now)

### Step 5: Install Dependencies
```bash
cd promptflam-svelte
npm install
```

### Step 6: Install Cloudflare Pages Adapter
```bash
npm install -D @sveltejs/adapter-cloudflare
```

### Step 7: Configure Cloudflare Adapter

Edit `svelte.config.js`:

```javascript
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      }
    })
  }
};

export default config;
```

### Step 8: Create Environment File
```bash
# In promptflam-svelte directory
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_PERPLEXITY_API_KEY=pplx-your-key-here
```

You'll get the Perplexity API key later (see "Getting Perplexity API Key" section).

### Step 9: Test Local Dev Server
```bash
npm run dev
```

Output should show:
```
  VITE v4.x.x  build 0.00s

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

**Open browser to http://localhost:5173/**

You should see the SvelteKit welcome page. If you see errors, stop here and debug before moving forward.

### Step 10: Stop Dev Server
```bash
# In terminal, press Ctrl+C
```

---

## Getting Perplexity API Key

### Step 1: Create Perplexity Account
1. Go to https://www.perplexity.ai/
2. Click "Sign up" (or log in if you have account)
3. Verify your email

### Step 2: Create API Key
1. Go to https://www.perplexity.ai/settings (or Dashboard)
2. Navigate to "API Keys" section
3. Click "Create new API key"
4. Copy the key (you'll only see it once!)
5. Paste it into `.env.local`:
    ```
    VITE_PERPLEXITY_API_KEY=pplx-abc123...
    ```

### Step 3: Set Budget Limit (IMPORTANT)
1. Go to https://www.perplexity.ai/settings/billing
2. Set monthly spending limit to $5
3. This prevents surprise charges if something goes wrong

### Step 4: Test the Key Works
```bash
# Still in promptflam-svelte directory
npm run dev

# In browser console, open DevTools (F12)
# Create a simple test call:

const response = await fetch('https://api.perplexity.ai/openai/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'sonar',
    messages: [{ role: 'user', content: 'Say hello' }]
  })
});
const data = await response.json();
console.log(data);
```

If you see a response with `"choices"`, the key works. If you see an error, check:
- Key is copied correctly (no extra spaces)
- Budget limit set to at least $5
- Account is verified

---

## Phase 1 Setup: Build the Foundation

### Project Structure to Create

```
promptflam-svelte/
├── src/
│   ├── routes/
│   │   ├── +page.svelte          ← Create page (chat)
│   │   ├── +layout.svelte        ← Root layout
│   │   ├── prompts/
│   │   │   └── +page.svelte      ← Prompts library
│   │   └── notepad/
│   │       └── +page.svelte      ← Notepad editor
│   ├── lib/
│   │   ├── stores.js             ← State management
│   │   ├── services/
│   │   │   ├── openai.js         ← AI API calls
│   │   │   └── storage.js        ← localStorage wrapper
│   │   └── components/
│   │       ├── Header.svelte
│   │       ├── Footer.svelte
│   │       └── ChatMessage.svelte
│   ├── app.css                   ← Global styles
│   └── app.svelte                ← Root component
├── static/
│   ├── prompts.json              ← Copy from existing app
│   ├── promptflam-logo.png       ← Copy from existing app
│   └── promptflam-icon.png       ← Copy from existing app
├── svelte.config.js              ← Updated with adapter
├── .env.local                    ← API key (not committed)
├── .env.example                  ← Template (committed)
└── package.json
```

### Copy Assets from Old Project

```bash
# From promptflam-svelte directory
cp ../PromptFlam/prompts.json ./static/
cp ../PromptFlam/public/* ./static/
```

### Create Placeholder Pages

**src/routes/+page.svelte** (Create page):
```svelte
<script>
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<Header title="Create" />
<main>
  <p>Chat interface will go here (Phase 2)</p>
</main>
<Footer />

<style>
  main {
    padding: 1rem;
  }
</style>
```

**src/routes/prompts/+page.svelte** (Prompts page):
```svelte
<script>
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<Header title="Prompts" />
<main>
  <p>Prompt library will go here (Phase 4)</p>
</main>
<Footer />

<style>
  main {
    padding: 1rem;
  }
</style>
```

**src/routes/notepad/+page.svelte** (Notepad page):
```svelte
<script>
  import Header from '$lib/components/Header.svelte';
  import Footer from '$lib/components/Footer.svelte';
</script>

<Header title="Notepad" />
<main>
  <p>Text editor will go here (Phase 5)</p>
</main>
<Footer />

<style>
  main {
    padding: 1rem;
  }
</style>
```

### Create State Store

**src/lib/stores.js**:
```javascript
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Chat messages
function createChatStore() {
  const key = 'promptflam_chat';
  const stored = browser ? localStorage.getItem(key) : null;
  const initial = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    add: (message) => {
      update(messages => {
        const updated = [...messages, message];
        if (browser) localStorage.setItem(key, JSON.stringify(updated));
        return updated;
      });
    },
    clear: () => {
      set([]);
      if (browser) localStorage.removeItem(key);
    }
  };
}

export const chatMessages = createChatStore();

// Current prompts with bracket content in chat input
function createCurrentPromptsStore() {
  const key = 'promptflam_currentPrompts';
  const stored = browser ? localStorage.getItem(key) : null;
  const initial = stored ? JSON.parse(stored) : '';

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set,
    update
  };
}

export const currentPrompts = createCurrentPromptsStore();

// Drafts
function createDraftStore() {
  const key = 'promptflam_drafts';
  const stored = browser ? localStorage.getItem(key) : null;
  const initial = stored ? JSON.parse(stored) : [];

  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    add: (draft) => {
      update(drafts => {
        const updated = [...drafts, { id: Date.now(), ...draft }];
        if (browser) localStorage.setItem(key, JSON.stringify(updated));
        return updated;
      });
    },
    remove: (id) => {
      update(drafts => {
        const updated = drafts.filter(d => d.id !== id);
        if (browser) localStorage.setItem(key, JSON.stringify(updated));
        return updated;
      });
    }
  };
}

export const drafts = createDraftStore();
```

### Create localStorage Service

**src/lib/services/storage.js**:
```javascript
import { browser } from '$app/environment';

export const storage = {
  set: (key, value) => {
    if (browser) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  get: (key) => {
    if (browser) {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  },

  remove: (key) => {
    if (browser) {
      localStorage.removeItem(key);
    }
  },

  clear: () => {
    if (browser) {
      localStorage.clear();
    }
  }
};
```

### Create Perplexity Service

**src/lib/services/perplexity.js**:
```javascript
export async function callPerplexity(messages) {
  const systemPrompt = 'You are a helpful writing assistant for journalists. Provide accurate, well-researched responses with citations when relevant.';

  try {
    const response = await fetch('https://api.perplexity.ai/openai/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1500,
        search_recency_filter: 'month'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API error');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      citations: data.citations || []
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error;
  }
}
```

### Test Everything Works

```bash
# Make sure dev server is running
npm run dev

# Open http://localhost:5173/
# Navigate between pages using URL (type in address bar):
# - http://localhost:5173/ (Create)
# - http://localhost:5173/prompts (Prompts)
# - http://localhost:5173/notepad (Notepad)

# Open DevTools (F12) → Console
# Test the store:
# import { chatMessages } from '$lib/stores.js';
# chatMessages.add({ role: 'user', content: 'Hello' });
# Check localStorage in DevTools → Application → Local Storage
```

If you see "Uncaught ReferenceError" or import errors, stop and debug before moving to Phase 2.

---

## Git Workflow for Development

### Save Work (Daily)
```bash
# In promptflam-svelte directory
git add .
git commit -m "WIP: Phase 1 setup - stores and services"
git push origin svelte-refactor
```

### When Phase is Complete
```bash
git add .
git commit -m "Phase 1: SvelteKit foundation with router and state management"
git push origin svelte-refactor
```

Then create a pull request on GitHub for review before merging to main.

### If Something Breaks
```bash
# See recent commits
git log --oneline -5

# Undo last commit (keep changes locally)
git reset HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Restore file to previous state
git checkout <filename>
```

---

## Troubleshooting

### "npm: command not found"
→ Node.js not installed. Go to https://nodejs.org/ and install LTS version.

### "Port 5173 already in use"
→ Another process is using port 5173.
```bash
# Kill the process (macOS/Linux)
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 5174
```

### "VITE_PERPLEXITY_API_KEY is undefined"
→ Check `.env.local` exists and has your Perplexity API key.
→ Stop and restart dev server: `npm run dev`

### "Cannot find module '$lib/stores.js'"
→ Check file path is correct: `src/lib/stores.js`
→ Check file exists and has correct imports

### localStorage not persisting
→ Check browser isn't in private mode (private mode clears storage on close)
→ Open DevTools → Application → Local Storage → check key exists

### "401 Unauthorized" from Perplexity API
→ Check your API key is correct and copied fully
→ Verify API key is added to Perplexity account (https://www.perplexity.ai/settings)

---

## Next Steps After Phase 1

1. **Verify local setup works**
2. **Create integration branch** (svelte-refactor)
3. **Begin Phase 2**: Chat UI skeleton
4. **Daily commits** to track progress
5. **Weekly merge back to main** for stability

---

## Useful Commands Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Format code
npm run format

# Lint code
npm run lint

# Run tests (after setup)
npm run test

# Push branch to GitHub
git push origin svelte-refactor

# Pull latest changes
git pull origin svelte-refactor
```

---

## Questions?

If you get stuck:
1. Check this document again
2. Check https://kit.svelte.dev/docs (official SvelteKit docs)
3. Check https://svelte.dev/docs (Svelte docs)
4. Create an issue on GitHub with error message + screenshot
