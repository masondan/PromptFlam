# PromptFlam: Migrated to Perplexity API

**Date**: December 15, 2025  
**Change**: Full pivot from OpenAI GPT-4 Mini → Perplexity API  
**Status**: All documentation updated and ready for Phase 1

---

## Summary of Changes

### Why Perplexity?

For a **journalism tool targeting developing countries**, Perplexity API is superior:

1. **Real-time sources**: Current news/events (not April 2024 cutoff)
2. **Built-in citations**: Journalists need attributed sources (non-negotiable)
3. **Cost**: ~$0.005-0.015 per request = $1-2/month (cheaper than OpenAI)
4. **Speed**: Typically 2-3 seconds (faster than OpenAI for real-time queries)
5. **No knowledge cutoff limitations**: Fresh data every request

### Files Modified

All documentation files updated for consistency:

#### 1. **PLANNING_SUMMARY.md**
- ✓ Updated decision table: Perplexity vs alternatives
- ✓ Updated cost breakdown: $12-24/year (vs $24-30 with OpenAI)
- ✓ Updated "Getting API Key" reference to Perplexity
- ✓ Updated docs links to Perplexity API documentation

#### 2. **ROADMAP.md**
- ✓ Updated "Key Decisions" section: Perplexity API noted
- ✓ Phase 1: Updated environment variable setup (VITE_PERPLEXITY_API_KEY)
- ✓ Phase 3: Completely rewritten for Perplexity integration
  - Added "Citation extraction and display" deliverable
  - Updated API service file: `perplexity.js` (not openai.js)
  - Updated Definition of Done to include citations
- ✓ Updated cost breakdown table
- ✓ Updated risks section (Perplexity quota instead of OpenAI)

#### 3. **DEVELOPMENT.md**
- ✓ Updated Step 8: Environment file now uses `VITE_PERPLEXITY_API_KEY`
- ✓ Complete rewrite of "Getting Perplexity API Key" section
  - New account signup flow
  - New API key creation steps
  - New budget limit process
  - New test API call example (using Perplexity endpoints)
- ✓ Updated Perplexity service code example (`perplexity.js`)
  - Added `search_recency_filter: 'month'` for fresh data
  - Returns both `content` and `citations` object
- ✓ Updated troubleshooting section: Perplexity-specific errors

#### 4. **PROJECT_CHECKLIST.md**
- ✓ Updated Pre-Dev: Perplexity API key setup
- ✓ Phase 1: Service file renamed to `perplexity.js`
- ✓ Phase 3: Extensive updates for citation handling
  - Added citation extraction checklist items
  - Added citation display checklist items
  - Updated "Definition of Done" to include citations
- ✓ Updated risk mitigations: Perplexity-specific

#### 5. **agents.md**
- ✓ Updated Current Status: Perplexity API noted
- ✓ Updated Development Workflow: Perplexity key setup
- ✓ Updated project structure: `perplexity.js` (not openai.js)
- ✓ Updated Technology Stack table
- ✓ Updated Cost Breakdown: Perplexity pricing

---

## Key Technical Changes

### API Endpoint & Authentication
```
OLD: https://api.openai.com/v1/chat/completions
NEW: https://api.perplexity.ai/openai/
```

### Environment Variable
```
OLD: VITE_OPENAI_API_KEY=sk-proj-...
NEW: VITE_PERPLEXITY_API_KEY=pplx-...
```

### Service Function Response
```javascript
// OLD (OpenAI):
return data.choices[0].message.content;

// NEW (Perplexity):
return {
  content: data.choices[0].message.content,
  citations: data.citations || []
};
```

### Model Selection
```
OLD: model: 'gpt-4-mini'
NEW: model: 'sonar'
```

### New Parameters
```javascript
search_recency_filter: 'month'  // Keep results within last month
```

---

## Phase 3 Implementation Notes (for developers)

When building Phase 3 (Real AI Integration), remember:

1. **Citation Display**: Perplexity returns citations as an array. Display them below the response as clickable links.
   ```
   Example: [Source 1] (link) | [Source 2] (link)
   ```

2. **Streaming**: Perplexity supports streaming like OpenAI. Use same `EventStream` pattern.

3. **Error Handling**: Perplexity API is reliable but add retry logic for network issues.

4. **Performance**: Perplexity may take 2-3 seconds (vs OpenAI's 1-2 sec). Ensure loading state is clear.

5. **User Communication**: Show citations prominently—this is a key feature for journalists.

---

## Cost Impact

| Metric | OpenAI | Perplexity |
|--------|--------|-----------|
| Cost per request | ~$0.015-0.30 | ~$0.005-0.015 |
| Monthly (100 users) | $0.50-2 | $0.50-2 |
| Annual | $24-30 | $12-24 |
| Knowledge cutoff | April 2024 (fixed) | Real-time |
| Built-in citations | No | Yes |

**Result**: Same monthly cost, better features for journalists.

---

## Next Steps

1. **Phase 1 (Week 1-2)**: Create SvelteKit foundation, set up Perplexity keys
2. **Phase 2 (Week 2-3)**: Build chat UI with mock responses
3. **Phase 3 (Week 3-4)**: Integrate Perplexity API with citation display
4. **Phase 4+**: Rest of roadmap unchanged

All documentation is now consistent and ready for development.

---

**Status**: ✓ Complete. Ready to begin Phase 1.
