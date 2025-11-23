# Translation Guide for JOSOOR Website

## How Arabic Translations Are Generated

The Arabic translations in this website are **AI-generated** using large language models (LLMs). While I strive for accuracy, AI translations can sometimes be:
- Overly literal or unnatural
- Missing cultural nuances
- Grammatically correct but not idiomatic
- Using formal Arabic when colloquial might be better (or vice versa)

**This is why your review and editing is crucial!**

---

## Where to Find and Edit Arabic Translations

### 1. **Walkthrough Tutorial** (✅ Centralized - Easy to Edit)

**File:** `/data/walkthrough-translations.ts`

This file contains ALL the translations for the Noor walkthrough tutorial. Simply open it and edit the Arabic text:

```typescript
ar: {
  title: 'مرحباً بك في نور AI',  // ← Edit this
  description: '...',              // ← And this
  highlight: 'header' as const
}
```

The structure includes:
- **6 tutorial steps** with titles and descriptions
- **Button labels** (Previous, Next, Skip, Get Started, Step Counter)

---

### 2. **Other Pages** (⚠️ Decentralized - Requires Manual Search)

For other pages like Chat Over Coffee, Home, Origins, etc., translations are embedded directly in the component files:

**Common Pattern:**
```typescript
{language === 'en' ? 'English Text' : 'النص العربي'}
```

**Key Files to Check:**
- `/pages/ChatOverCoffeePage.tsx` - You mentioned rewriting this one
- `/pages/HomePage.tsx`
- `/pages/OriginsPage.tsx`
- `/pages/TwinXperiencePage.tsx`
- `/components/Navigation.tsx`
- `/components/Footer.tsx`
- And others...

**Recommended Approach:**
1. Use your code editor's search function (Ctrl+F / Cmd+F)
2. Search for Arabic text using patterns like: `language === 'ar'` or `'ar':`
3. Review and update each instance

---

## Translation Best Practices

### When Editing Arabic:

1. **Preserve HTML/Markdown formatting:**
   - Keep `\n\n` for line breaks
   - Keep emojis if present (🔮 📊 etc.)
   - Keep bullet points `•` or `\n•`

2. **Maintain tone consistency:**
   - Match the formality level of English
   - Use appropriate pronouns (أنت vs. حضرتك)
   - Keep brand names in English: JOSOOR, TwinLife, Noor

3. **RTL considerations:**
   - Numbers and English words will auto-flip
   - Punctuation might need adjustment
   - Test in actual browser to verify layout

4. **Technical terms:**
   - Decide: translate or keep English?
   - Be consistent across the site
   - Examples: "Digital Twin" → "التوأم الرقمي" or keep as is?

---

## How to Test Your Translations

1. **Change language using the toggle** in the navigation (top-right)
2. **Check for:**
   - Text overflow or cutoff
   - Alignment issues (should be RTL)
   - Natural reading flow
   - Proper rendering of Arabic text
3. **Test on different screen sizes** (mobile, tablet, desktop)

---

## Quick Reference: Finding Specific Translations

| Feature | Location | Type |
|---------|----------|------|
| Walkthrough Tutorial | `/data/walkthrough-translations.ts` | ✅ Centralized |
| Navigation Menu | `/components/Navigation.tsx` | Inline |
| Footer | `/components/Footer.tsx` | Inline |
| Home Page | `/pages/HomePage.tsx` | Inline |
| Chat Over Coffee | `/pages/ChatOverCoffeePage.tsx` | Inline |
| Origins (Founder's Letter) | `/pages/OriginsPage.tsx` | Inline |
| TwinLife (Noor Portal) | `/pages/TwinXperiencePage.tsx` | Inline |
| Login Page | `/pages/LoginPage.tsx` | Inline |

---

## Recommendation: Centralize All Translations

For easier maintenance, consider creating a central translations file (similar to `walkthrough-translations.ts`) for all website content:

```typescript
// /data/all-translations.ts
export const translations = {
  navigation: { en: {...}, ar: {...} },
  home: { en: {...}, ar: {...} },
  chatOverCoffee: { en: {...}, ar: {...} },
  // etc.
};
```

This would make it easier to:
- Review all translations in one place
- Ensure consistency
- Hand off to professional translators
- Implement i18n libraries if needed

---

## Need Help?

If you find specific translations that need improvement, just let me know which page/component and I can help refactor the code to make editing easier, or update specific translations based on your preferred Arabic text.
