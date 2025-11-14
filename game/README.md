# AI Pathways Explorer - Game Version (POC)

A visual novel-style game version of the AI Pathways Explorer built with Phaser.js.

## 🎮 What Is This?

This is a **proof-of-concept** gamified version of the AI Pathways Explorer. It transforms the existing narrative experience into an interactive visual novel with:

- 🎨 Visual novel-style presentation
- 💬 Dialogue boxes with typewriter effects
- 🎭 Character sprites that react to different pathways
- 🌈 Dynamic backgrounds based on pedagogical approach
- 🔊 Background music and sound effects (optional)
- 📱 Mobile-responsive design

## 🚀 Quick Start

### Option 1: Local Development

```bash
# From the game directory
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Option 2: Open Directly

Simply open `index.html` in a modern web browser.

## 📁 Project Structure

```
game/
├── index.html              # Entry point
├── game.js                 # Phaser configuration
├── scenes/
│   ├── BootScene.js        # Asset loading
│   ├── GameScene.js        # Main game logic & visuals
│   └── UIScene.js          # Dialogue box & choices
├── managers/
│   ├── NodeManager.js      # Loads nodes.json from main app
│   └── AudioManager.js     # Sound management
├── assets/
│   ├── sprites/            # Character images (currently placeholders)
│   ├── backgrounds/        # Not used (CSS gradients instead)
│   └── audio/              # Music & SFX (optional)
└── styles/
    └── game.css            # Game styling
```

## 🎨 Current State (POC)

### ✅ What Works

- All 23 narrative nodes from the main app
- Full choice system and branching paths
- Typewriter text effect (skippable)
- Dynamic background colors based on pathway
- Character sprite changes with emotions
- URL hash navigation (shareable links)
- Responsive design
- Restart functionality
- Resources modal

### 🚧 Placeholder Content

- **Sprites:** Simple colored rectangles (replace with pixel art)
- **Backgrounds:** CSS gradients (can add actual images)
- **Audio:** Not included (add MP3 files to assets/audio/)

## 🎨 Adding Custom Art

### Character Sprites

1. Create or download 64x96 pixel PNG sprites
2. Place in `assets/sprites/` folder:
   - `professor-neutral.png`
   - `professor-concerned.png`
   - `professor-thoughtful.png`
3. Update `BootScene.js` to load images instead of generating placeholders

See `assets/sprites/README.md` for details.

### Background Images

1. Create 1024x768 images for each pathway
2. Place in `assets/backgrounds/` folder
3. Update `GameScene.js` to load images instead of using gradients

### Audio

1. Add MP3 files to `assets/audio/`:
   - `contemplative.mp3` (calm music)
   - `serious.mp3` (tense music)
   - `hopeful.mp3` (uplifting music)
   - `click.mp3`, `text.mp3`, `transition.mp3` (SFX)
2. Uncomment audio loading in `BootScene.js`

See `assets/audio/README.md` for free resources.

## 🎮 Controls

- **Click anywhere** during text: Skip typewriter effect
- **Click choice buttons**: Navigate to next scene
- **📚 Resources button**: View academic resources for current scene
- **↻ Restart**: Return to beginning
- **🔊 Audio toggle**: Mute/unmute sound

## 🔧 Technical Details

### Dependencies

- **Phaser.js 3.80.1** (loaded via CDN)
- No build process required
- Pure ES6 modules

### Data Integration

The game reads directly from:
- `../nodes.json` - All narrative content
- `../config/config.json` - Institution branding/values

Changes to the main app's content automatically appear in the game version.

### Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## 🚢 Deployment

### GitHub Pages

The game works on GitHub Pages with no special configuration:

1. Ensure `/game` folder is in your repository
2. Push to `main` branch
3. Access at `yoursite.com/game/`

### Standalone Distribution

The entire `/game` folder can be:
- Zipped and shared
- Hosted on any static web server
- Embedded in other sites

## 🎯 Future Enhancements

Potential additions beyond POC:

- [ ] Professional pixel art sprites
- [ ] Background scene illustrations
- [ ] Full audio implementation
- [ ] Particle effects (sparkles, transitions)
- [ ] Achievement system
- [ ] Multiple save slots
- [ ] Character animation (idle, talking)
- [ ] Room exploration (Undertale-style movement)
- [ ] Mini-games or interactive elements

## 📝 Customization

The game inherits customization from the main app:
- Institution name/branding from `config.json`
- Pathway colors automatically applied
- All placeholder text replaced

To customize the game specifically:
- Edit colors in `game.css`
- Modify UI layout in `UIScene.js`
- Adjust dialogue box styling in `UIScene.createDialogueBox()`

## 🐛 Known Issues

- Audio files not included (optional for POC)
- Sprites are simple placeholders
- No actual pixel art assets
- Resources modal could be prettier

These are all intentional for the POC phase and can be enhanced later.

## 📚 Resources Used

- **Phaser.js** - Game framework (https://phaser.io)
- **Google Fonts** - Press Start 2P & Inter fonts
- **Existing nodes.json** - All narrative content from main app

## 🤝 Contributing

To improve the game version:

1. Add better sprites to `assets/sprites/`
2. Create background images for `assets/backgrounds/`
3. Source free audio for `assets/audio/`
4. Enhance visual effects in scene files
5. Add new features (animations, particles, etc.)

## 📄 License

Same as main project (MIT License).

---

**Built with ❤️ as a POC for gamifying educational narratives**

