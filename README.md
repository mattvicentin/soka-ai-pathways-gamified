# AI Pathways Explorer

An interactive, choose-your-own-path experience exploring **five pedagogical approaches to AI in the classroom**.

Originally designed for **Soka University of America**'s 2025 Faculty Workshop, now **customizable for any institution** through the built-in game customization interface.

---

## Overview

This interactive narrative helps faculty explore the tensions, trade-offs, and possibilities of different AI policies through realistic classroom scenarios. Each pathway offers distinct perspectives on integrity, creativity, equity, trust, and your institution's mission. The content has been generalized for universal use and can be customized for any institution through the built-in customization interface.

### Five Pathways

1. **⚪ Ignore / Minimal Intervention** — Deferring AI policy decisions
2. **🔴 Prohibitive** — Upholding integrity through AI restrictions
3. **🟨 Balanced / Literacy** — Teaching ethical and reflective AI use
4. **🟩 AI-Embracing** — Redesigning for creativity and metacognition
5. **🔵 Collaborative** — Co-learning through dialogue and experimentation

The explorer includes:
- **23 interactive nodes** across 5 pathways with realistic classroom dilemmas
- **54 curated academic resources** (EDUCAUSE, UNESCO, Harvard GSE, OECD, Inside Higher Ed, and more)
- **Path-switching options** to explore different pedagogical pivots
- **Meta-reflection endpoint** connecting outcomes to institutional mission
- **Reflection form** with EmailJS integration to capture and send faculty insights
- **Institution customization** - personalize the experience for your institution
- **Character selection** - choose from multiple character options
- **Credits scene** - transition scene after completing the experience

## 🎮 Main Experience

**The game version is now the main experience!** This visual novel-style interface provides:

- **Visual novel interface** with dialogue boxes and typewriter effects
- **Character selection** - choose from multiple characters
- **Character sprites** that react to different pathways
- **Dynamic backgrounds** that change based on your choices
- **Background music and sound effects** for immersive experience
- **Same great content** - all 23 nodes from the original app
- **[🎮 Play Now](https://mattvicentin.github.io/soka-ai-pathways-gamified/)** - The game version is the default experience

A simplified web version is also available via the "Web Version" button for users who prefer a text-only interface.

---

## Features
- **Visual novel game interface** (main experience) built with Phaser.js
- **Character selection** - choose from multiple character options at game start
- **Character sprites** that change emotion based on pathway choices
- **Dynamic backgrounds** that adapt to your choices
- **Immersive audio** - background music and sound effects with volume controls
- **Typewriter effect** - animated text display with blinking cursor
- **Resources modal** - access curated academic resources during gameplay
- **Customization interface** - personalize institution name, mission, values, and email recipients
- **Meta-reflection form** - capture and email faculty insights via EmailJS
- **Credits scene** - transition scene after completing the experience
- **Simplified web version** available for text-only preference
- Single‑page app with hash routing (`/#node=...`), no backend
- Content is **data‑driven** via `data/nodes-base.json`
- Works on **GitHub Pages**; zero build steps

## Local Preview

Run a local server (Python 3):

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000` (game version - main experience)

Or for the simplified web version: `http://localhost:8000/simple/`

## Live Site

**🌐 [https://mattvicentin.github.io/soka-ai-pathways-gamified/](https://mattvicentin.github.io/soka-ai-pathways-gamified/)**

Start at the dilemma (`/#node=D1`) and follow your pedagogical instincts through realistic classroom scenarios. The game version is now the default experience.

**📄 [Simplified Web Version](https://mattvicentin.github.io/soka-ai-pathways-gamified/simple/)**

## Project Structure

```
soka-ai-pathways-gamified/
├── index.html              # Game entry point (main experience)
├── game.js                 # Phaser game initialization
├── scenes/                 # Phaser game scenes
│   ├── BootScene.js        # Asset loading and initialization
│   ├── CharacterSelectionScene.js  # Character selection interface
│   ├── GameScene.js        # Main game scene with backgrounds and sprites
│   ├── UIScene.js          # Dialogue box, choices, and UI elements
│   └── CreditsScene.js     # End credits transition scene
├── managers/               # Game managers
│   ├── NodeManager.js      # Loads and processes nodes with placeholders
│   └── AudioManager.js     # Background music and sound effects
├── assets/                 # Game assets
│   ├── sprites/            # Character and UI sprites
│   ├── backgrounds/        # Background images
│   └── audio/              # Music and sound effects
├── data/
│   └── nodes-base.json     # All narrative content and resources
├── config/
│   └── config.json         # Institution configuration (generated via customization)
├── simple/                 # Simplified web version
│   ├── index.html          # Simplified version entry point
│   ├── app.js              # JavaScript for navigation and rendering
│   └── nodes.json          # Processed nodes for simplified version
├── styles/
│   └── game.css            # Game-specific styles
└── README.md               # This file
```

## Content Sources

The narrative content is stored in `data/nodes-base.json` and has been generalized for universal use. Original content was developed from pathway documentation including:
- Prohibitive Pathway with Resources
- Balanced/Literacy Pathway with Resources
- AI-Embracing Pathway with Resources
- Collaborative Pathway with Resources

All pathways include citations to:
- EDUCAUSE Review & Reports (2024-2025)
- UNESCO Guidance on GenAI in Education (2023)
- OECD AI & Future of Learning (2024)
- Harvard Graduate School of Education
- Inside Higher Ed & HEPI Reports
- NASEM Ethics of AI in Education (2023)
- Various institutional mission statements and faculty supports

## Deploy to GitHub Pages

This site is already deployed! To update:
1. Make changes to `data/nodes-base.json`, game files, or `index.html`
2. Commit & push to `main` (or `universal-script` branch for universal version)
3. GitHub Pages automatically rebuilds (1-2 minutes)
4. Changes appear at the live URL

**Note:** The `universal-script` branch contains the generalized version with all Soka-specific references removed. This branch is recommended for institutions wanting to customize the experience.

## How to Use This Explorer

### For Faculty
1. **Customize (optional)** — Enter your institution details when prompted
2. **Select a character** — Choose from available character options
3. **Navigate the scenarios** — Start at D1 and choose a pedagogical stance
4. **Read the narratives** — Experience realistic classroom dilemmas with typewriter effect
5. **Explore resources** — Click the Resources button to access curated academic articles
6. **Switch paths** — Try different approaches to see trade-offs
7. **Reflect** — End at R1 to submit meta-reflection connecting outcomes to your institution's mission

### For Facilitators
- Share the link before or during workshops
- Use "Copy link to this step" to share specific scenarios
- Discuss decision points and resource implications
- Compare paths taken by different faculty groups

## URL Conventions
- **Start:** `/#node=D1`
- **Any node:** `/#node=B2A&trail=D1>B1>B2A`
- **Meta-reflection:** `/#node=R1`
- Trail parameter tracks your decision history
- "Copy link to this step" button captures current state

## Editing Content

### Quick Updates
Edit `data/nodes-base.json` directly to:
- Update narratives
- Add/modify resources
- Change decision labels
- Adjust node connections

**Note:** The file uses placeholders like `{{institution}}`, `{{institution_short}}`, `{{value1}}`, etc. These are automatically replaced with values from the customization interface or default config.

### Adding Nodes
1. Follow naming convention: `P1`, `B2A`, `E3A`, etc.
2. Include: `id`, `path`, `pathLabel`, `title`, `narrative`, `resources`, `choices`
3. Link from existing nodes via `choices[].to`
4. Test navigation flow

## Content Structure (`data/nodes-base.json`)
```json
{
  "P1": {
    "id": "P1",
    "path": "prohibitive",
    "pathLabel": "Prohibitive",
    "title": "Setting the Boundary",
    "narrative": "…",
    "resources": [{"label":"…","url":"…","why":"…"}],
    "choices": [{"label":"…","to":"…"}]
  }
}
```

## Pedagogical Design

This explorer is designed around **value-creating education** principles:

### Core Design Choices
- **Narrative immersion** — First-person scenarios build empathy and realism
- **Branching paths** — Decisions have consequences, mirroring real classroom complexity
- **Path switching** — Faculty can pivot approaches, modeling pedagogical flexibility
- **Resource integration** — Academic citations ground choices in scholarship
- **Mission alignment** — Meta-reflection ties outcomes to institutional values
- **Universal design** — Content generalized for any institution with customization support

### Learning Outcomes
Faculty who complete the explorer will:
- Understand tensions between integrity, creativity, equity, and trust
- Explore trade-offs of prohibitive, balanced, embracing, and collaborative approaches
- Encounter 47 curated resources on AI pedagogy
- Reflect on how AI choices embody institutional mission
- Practice flexible, value-driven decision-making

## Technical Details
- **Game engine** — Phaser.js 3.80+ (via CDN)
- **No build process** — Pure HTML/JS/JSON
- **No backend** — Fully static, runs on any web server
- **Email integration** — EmailJS for sending reflection submissions
- **Instant updates** — Edit JSON, refresh browser
- **Portable** — Download and run locally anytime
- **Mobile responsive** — Touch controls and responsive design

## Customization

The game includes a built-in customization interface that allows you to:
- Set your institution's name, short name, and possessive form
- Configure mission page URL and link label
- Set email recipients for meta-reflection submissions
- All customization is optional - you can skip and use default values

The content has been generalized to work for any institution. Soka-specific references have been removed and replaced with placeholders that are populated from the customization interface.

## Branches

- **`main`** — Main branch (may contain Soka-specific content)
- **`universal-script`** — Universal version with all Soka-specific references removed (recommended for other institutions)

## Credits

**Originally developed for:** Soka University of America  
**Workshop:** 2025 Faculty Workshop on AI in Education  
**Now available for:** Any institution  
**Developers:** Ian Read & Matheus Vicentin  
**License:** MIT

---

**Questions or suggestions?** Open an issue or connect via the Faculty Forum.
