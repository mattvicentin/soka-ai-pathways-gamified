# Quick Start Guide

## 🎮 Play the Game NOW (3 steps)

### 1. Start Local Server

```bash
cd /Users/mattvicentin/Desktop/soka-ai-pathways-gamified-main
python3 -m http.server 8000
```

### 2. Open Browser

Visit: **http://localhost:8000/game/**

### 3. Play!

- Wait for loading screen
- Click through the narrative
- Make choices
- Explore different pathways

---

## 🎯 Controls

- **Click anywhere** during text → Skip typewriter
- **Click choices** → Navigate to next scene
- **SPACE or ENTER** → Skip typewriter
- **📚 Resources** → View academic resources
- **↻ Restart** → Go back to beginning
- **🔊** → Mute/unmute (no audio yet, but button works)

---

## 🌈 Try These Paths

### Quick Test Path (3 nodes)
1. Start at D1 (auto-loads)
2. Click "Prohibitive — Ban AI"
3. See background turn dark blue
4. Continue through P2A, P3A, P4

### Full Path Test (5+ nodes)
1. Start at D1
2. Choose "Collaborative"
3. Navigate through entire pathway
4. Explore path-switching options
5. Reach reflection node (R1)

---

## ✅ What to Look For

- [ ] Typewriter text effect (smooth typing)
- [ ] Background color changes (blue → dark blue, etc.)
- [ ] Character sprite changes emotion
- [ ] Choices slide in from bottom
- [ ] Resources button appears
- [ ] URL updates with trail
- [ ] Smooth transitions between scenes

---

## 🐛 If Something's Wrong

### Game won't load?
- Make sure server is running
- Check you're visiting `localhost:8000/game/` (not `/game`)
- Open browser console (F12) for errors

### Text not appearing?
- Wait a few seconds for loading
- Check console for errors
- Try refreshing (Cmd+R / Ctrl+R)

### Choices not clickable?
- Wait for typewriter to finish
- Make sure you're clicking the blue choice buttons
- Try refreshing

---

## 📱 Mobile Testing

### On iPhone/iPad (Safari)
1. Get your computer's local IP: `ifconfig | grep inet`
2. Visit: `http://YOUR_IP:8000/game/` on mobile
3. Add to home screen for full-screen app experience

### On Android (Chrome)
Same as above, use Chrome instead

---

## 🎨 Want Better Graphics?

The game works with placeholders now, but you can add:

1. **Sprites**: Drop PNG files in `assets/sprites/`
2. **Music**: Drop MP3 files in `assets/audio/`
3. **Backgrounds**: Add to `assets/backgrounds/`

See README files in each folder for details.

---

## 🚀 Deploy to Web

### GitHub Pages
```bash
git add game/
git commit -m "Add game version POC"
git push origin main
```

Game will be live at: `yoursite.github.io/yourrepo/game/`

### Other Hosts
Just upload the `/game` folder to any static host:
- Netlify (drag & drop)
- Vercel (git deploy)
- AWS S3 (static hosting)

---

## 📊 Share Your Progress

After testing, take screenshots of:
- [ ] Loading screen
- [ ] First scene (D1)
- [ ] A choice menu
- [ ] Different pathway (changed background)
- [ ] Resources modal
- [ ] Mobile view

---

## 🎉 Success!

If you can play through at least one complete pathway, **the POC is working!**

Next steps:
1. Show stakeholders
2. Get feedback
3. Decide on art assets
4. Plan v2 features

---

**Need help?** Check:
- `README.md` - Full documentation
- `TESTING.md` - Detailed testing guide
- `BUILD_SUMMARY.md` - What was built

**Have fun exploring! 🌟**

