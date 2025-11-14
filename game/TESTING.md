# Testing the Game POC

## Quick Start Testing

### 1. Start a Local Server

```bash
# From the project root (soka-ai-pathways-gamified-main)
python3 -m http.server 8000
```

Then visit: **http://localhost:8000/game/**

### 2. What to Test

#### ✅ Initial Load
- [ ] Loading screen appears with progress bar
- [ ] Game loads without console errors (press F12 to check)
- [ ] "AI Pathways Explorer" title displays
- [ ] Background fades in

#### ✅ First Scene (D1)
- [ ] Pathway badge shows "Shared Start"
- [ ] Title appears: "Designing a Mission-Aligned Seminar"
- [ ] Text types out character by character
- [ ] Click anywhere to skip typewriter effect
- [ ] Text shows fully after clicking
- [ ] 5 choice buttons appear

#### ✅ Navigation
- [ ] Click "Prohibitive — Ban AI" choice
- [ ] Screen fades out/in
- [ ] Background color changes to dark blue
- [ ] New narrative appears (P1)
- [ ] Character sprite changes emotion
- [ ] Badge updates to "Prohibitive"

#### ✅ Choice System
- [ ] All 5 pathways are accessible from D1
- [ ] Each choice leads to correct next node
- [ ] URL hash updates (check browser address bar)
- [ ] Browser back button works

#### ✅ Resources
- [ ] "📚 Resources" button appears when node has resources
- [ ] Click opens modal with resource list
- [ ] Resource links are clickable
- [ ] "Close" button works
- [ ] Choices reappear after closing modal

#### ✅ Controls
- [ ] "↻ Restart" button resets to D1
- [ ] "🔊" audio toggle works (even without audio files)
- [ ] Keyboard: SPACE skips typewriter
- [ ] Keyboard: ENTER skips typewriter

#### ✅ Responsive Design
- [ ] Resize browser window - game scales properly
- [ ] Test on mobile device (or Chrome DevTools mobile view)
- [ ] Touch controls work on mobile
- [ ] Text remains readable at different sizes

#### ✅ Full Pathway Test
Complete one full pathway to ensure all nodes work:

1. Start at D1
2. Choose "Prohibitive — Ban AI"
3. Navigate through P1 → P2A → P3A → P4
4. Reach end node
5. Verify all resources load
6. Check URL contains proper trail

## Testing Different Pathways

Test at least one complete path for each:

- [ ] **Ignore Path:** D1 → I1 → I2
- [ ] **Prohibitive Path:** D1 → P1 → P2A → P3A → P4
- [ ] **Balanced Path:** D1 → B1 → B2A → B3A → B4
- [ ] **Embracing Path:** D1 → E1 → E2A → E3A → E4
- [ ] **Collaborative Path:** D1 → C1 → C2A → C3A → C4
- [ ] **Reflection Node:** Any path → R1

## Console Errors to Ignore

These are expected for the POC:

- `Audio file not found` - Audio is optional for POC
- `Failed to load resource: assets/audio/...` - Normal without audio files
- Any CORS errors when opening directly (use local server instead)

## Known POC Limitations

These are intentional and documented:

- ✅ Sprites are colored rectangles (not pixel art)
- ✅ Backgrounds are CSS gradients (not images)
- ✅ No actual audio files loaded
- ✅ No character animations
- ✅ Resources modal is functional but basic

## Performance Check

- [ ] Game loads in under 3 seconds
- [ ] Typewriter effect is smooth (no stuttering)
- [ ] Scene transitions are smooth
- [ ] No memory leaks (game works after 50+ node visits)

## Browser Compatibility

Test in multiple browsers:

- [ ] **Chrome/Edge** (Chromium)
- [ ] **Firefox**
- [ ] **Safari** (macOS/iOS)
- [ ] **Mobile Safari** (iPhone)
- [ ] **Mobile Chrome** (Android)

## Common Issues & Fixes

### Game won't load
- Make sure you're using a local server (not opening file:// directly)
- Check browser console for errors (F12)
- Verify `nodes.json` and `config.json` exist in parent directory

### Typewriter effect doesn't skip
- Click inside the dialogue box area (lower portion of screen)
- Try SPACE or ENTER keys

### Choices don't appear
- Wait for typewriter effect to finish
- Check console for JavaScript errors

### Background doesn't change colors
- This is intentional for "shared" path
- Try going to P1 (Prohibitive) to see dark blue

### URL doesn't update
- This is likely a browser history issue
- Refresh the page and try again

## Success Criteria

The POC is working correctly if:

1. ✅ All 23 nodes are accessible
2. ✅ Typewriter effect works and is skippable
3. ✅ All choices navigate correctly
4. ✅ Background colors change per pathway
5. ✅ Resources modal displays correctly
6. ✅ Restart button works
7. ✅ URL navigation works (shareable links)
8. ✅ No critical console errors
9. ✅ Mobile responsive
10. ✅ Main site link to game works

## Reporting Issues

If you find bugs:

1. Open browser console (F12)
2. Screenshot the error
3. Note which node you were on
4. Note steps to reproduce
5. Check if issue persists after hard refresh (Cmd+Shift+R / Ctrl+F5)

## Next Steps After Testing

Once testing is complete and POC works:

1. Add actual pixel art sprites
2. Create background images
3. Source free audio files
4. Deploy to GitHub Pages
5. Share with stakeholders
6. Gather feedback for v2

---

**Testing completed? Mark this POC as ready for demo! 🎉**

