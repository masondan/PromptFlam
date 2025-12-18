# Phase 3: Real AI Integration

**Objective**: Connect to Perplexity API; handle streaming responses with citations.  
**Status**: Current Phase  
**Approval Required Before Phase 4**: Project Lead (Dan Mason)

---

## What to Build

Replace mock AI responses with real Perplexity API calls. Focus on:
- Real API integration
- Streaming response display (token-by-token animation)
- Citation extraction and display
- Error handling for network failures
- Loading states and user feedback

---

## Deliverables (Non-Negotiable)

### Core API Integration
- [ ] `src/lib/services/perplexity.js` fully implemented
  - [ ] Function signature: `callPerplexity(messages)`
  - [ ] Real Perplexity API calls (not mock)
  - [ ] API key from `import.meta.env.VITE_PERPLEXITY_API_KEY`
  - [ ] Model: `sonar` with `search_recency_filter: 'month'`
  - [ ] Returns: `{ content, citations }`
  - [ ] System prompt: "You are a helpful writing assistant for journalists. Provide accurate, well-researched responses with citations when relevant."

### Streaming Response Display
- [ ] Response appears animated (token-by-token)
- [ ] Visible progress while API is responding
- [ ] Response updates in-place (appends to message)
- [ ] Smooth animation, not jerky or slow

### Citation Extraction & Display
- [ ] Citations extracted from Perplexity response
- [ ] Display below response text as clickable links
- [ ] Format: `[Source 1] [Source 2]` or similar (clickable)
- [ ] Each link opens in new tab
- [ ] Citation data stored in message object

### Error Handling
- [ ] Network errors displayed to user (not silent fails)
- [ ] API quota exceeded → helpful message
- [ ] Invalid API key → clear error message
- [ ] Malformed response → graceful fallback
- [ ] Timeout after 30 seconds with retry option

### Loading States
- [ ] Send button disabled while processing
- [ ] "Thinking..." dots visible to user
- [ ] User cannot send multiple concurrent requests
- [ ] Clear indication that API is working (not frozen)

### Cost Monitoring
- [ ] Log request count to console (dev mode)
- [ ] Display cost info in dev tools
- [ ] No impact on production performance

### Security
- [ ] API key NOT exposed in browser console
- [ ] API key NOT visible in network requests (use server proxy if needed)
- [ ] `.env.local` in `.gitignore` (never commit keys)
- [ ] `.env.example` provided as template

---

## Key Files to Create/Modify

### Create
- `src/lib/services/perplexity.js` - API wrapper with streaming + citations

### Modify
- `src/routes/+page.svelte` - Update to use real API instead of mock
- `src/lib/stores.js` - Add loading/error states if needed
- `src/lib/components/ChatMessage.svelte` - Add citation display

### No Changes Needed
- Routes, layout, state stores schema
- localStorage persistence
- Header/navigation

---

## Implementation Guide

### Step 1: Create Perplexity Service

**File**: `src/lib/services/perplexity.js`

```javascript
/**
 * Call Perplexity API for AI-powered responses
 * Returns: { content, citations }
 */
export async function callPerplexity(messages) {
  const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const systemPrompt = 'You are a helpful writing assistant for journalists. Provide accurate, well-researched responses with citations when relevant.';

  try {
    const response = await fetch('https://api.perplexity.ai/openai/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0]?.message?.content || '',
      citations: data.citations || []
    };
  } catch (error) {
    console.error('Perplexity API error:', error);
    throw error;
  }
}
```

### Step 2: Update Chat Component

In `src/routes/+page.svelte`:

```javascript
<script>
  import { chatMessages } from '$lib/stores.js';
  import { callPerplexity } from '$lib/services/perplexity.js';

  let isLoading = false;

  async function sendMessage() {
    isLoading = true;
    try {
      const { content, citations } = await callPerplexity($chatMessages);
      
      chatMessages.add({
        role: 'assistant',
        content,
        timestamp: new Date(),
        sources: citations
      });
    } catch (error) {
      // Display error to user
      console.error('Error:', error.message);
    } finally {
      isLoading = false;
    }
  }
</script>

<button on:click={sendMessage} disabled={isLoading}>
  {isLoading ? 'Thinking...' : 'Send'}
</button>
```

### Step 3: Display Citations

In `src/lib/components/ChatMessage.svelte`:

```svelte
{#if message.role === 'assistant' && message.sources}
  <div class="citations">
    {#each message.sources as source}
      <a href={source.url} target="_blank" rel="noopener">
        [{source.title}]
      </a>
    {/each}
  </div>
{/if}

<style>
  .citations {
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
  
  .citations a {
    color: #0066cc;
    text-decoration: none;
    margin-right: 0.5rem;
  }
  
  .citations a:hover {
    text-decoration: underline;
  }
</style>
```

### Step 4: Add Streaming (Optional, Advanced)

For animated token-by-token display:

```javascript
export async function callPerplexityStream(messages, onToken) {
  // Returns ReadableStream instead of JSON
  // Call onToken(token) for each token received
  // More complex; see SvelteKit streaming docs
}
```

---

## Definition of Done

Phase 3 is complete when:

- [ ] Send prompt → receive real Perplexity response (not mock)
- [ ] Response appears in chat with full text
- [ ] Response appears animated/streamed (visible progress)
- [ ] Citations display below response as clickable links
- [ ] Each citation link opens source in new tab
- [ ] [Send] button disabled while API processes
- [ ] "Thinking..." visible while waiting
- [ ] Network errors displayed gracefully
- [ ] API key not exposed in console/network tab
- [ ] Timeout after 30 seconds with retry option
- [ ] `npm run dev` works without errors
- [ ] Mobile layout still functional
- [ ] No console errors or warnings

---

## Testing Checklist

Before marking Phase 3 complete:

- [ ] Test with real Perplexity API key
- [ ] Send 5+ different prompts; verify responses
- [ ] Check that citations appear and are clickable
- [ ] Simulate network failure; verify error message
- [ ] Test with invalid API key; verify error message
- [ ] Close DevTools; verify API key not in network requests
- [ ] Test on mobile; verify layout + functionality
- [ ] Refresh page; verify chat persists in localStorage
- [ ] Check localStorage size doesn't exceed browser limits

---

## Common Issues & Solutions

### "API key not found" Error
**Cause**: `.env.local` not created or missing key  
**Fix**: Create `.env.local` with `VITE_PERPLEXITY_API_KEY=pplx-...`  
**Then**: Restart dev server: `npm run dev`

### 401 Unauthorized
**Cause**: Invalid API key or typo  
**Fix**: Double-check key from https://www.perplexity.ai/settings  
**Verify**: No extra spaces or special characters

### Response is empty or "undefined"
**Cause**: API response structure changed or parsing error  
**Fix**: Log full response: `console.log('API response:', data)`  
**Check**: Perplexity API docs for response schema

### Citations not showing
**Cause**: `data.citations` might be `undefined` or different key  
**Fix**: Check Perplexity API docs for citation field name  
**Debug**: `console.log('Citations:', data.citations)`

### Streaming doesn't work
**Advanced**: Token-by-token animation is optional for Phase 3  
**Can defer** to Phase 7 if time is short  
**For now**: Full response display is acceptable

---

## Resources

- **Perplexity API Docs**: https://docs.perplexity.ai/
- **SvelteKit Fetch**: https://kit.svelte.dev/docs/server-side-rendering
- **Error Handling**: MDN Web Docs on `fetch()`

---

## Commits

As you work, commit frequently:

```bash
git add .
git commit -m "Phase 3: Add Perplexity API integration"
git commit -m "Phase 3: Add citation display below responses"
git commit -m "Phase 3: Add error handling and loading states"
git commit -m "Phase 3: Add streaming response display"
git push origin svelte-refactor
```

---

## Checkpoint Submission

When Phase 3 is complete, submit:

```markdown
# Phase 3 Checkpoint: Real AI Integration

## What Was Built
- ✓ Perplexity API service (`perplexity.js`)
- ✓ Real API calls integrated in chat
- ✓ Streaming response display (token-by-token)
- ✓ Citation extraction and display
- ✓ Error handling (network, quota, invalid key)
- ✓ Loading states ("Thinking..." spinner)
- ✓ API key security (not exposed)

## Proof of Functionality
- [x] Local dev runs without errors
- [x] Send prompt → receive real Perplexity response
- [x] Citations appear as clickable links
- [x] Response animation works smoothly
- [x] Errors handled gracefully
- [x] API key not visible in console
- [x] Mobile layout functional

## Blockers or Questions
[List any issues or questions]

## Ready for Phase 4
Yes
```

---

## Proceed to Phase 4 When

- [ ] All deliverables complete
- [ ] Checkpoint submitted
- [ ] Project Lead reviews locally
- [ ] Project Lead confirms: "Ready for Phase 4"

**No guessing**. Wait for explicit approval before starting Phase 4.

---

**Questions Before Starting?**

- Unclear on deliverables?
- Not sure how to implement streaming?
- Questions about Perplexity API?

**Ask now.** Don't code yet. Better to clarify than rework.

---

**Last Updated**: Dec 18, 2025  
**Current Status**: Ready for implementation  
**Approval Gate**: Project Lead sign-off required for Phase 4
