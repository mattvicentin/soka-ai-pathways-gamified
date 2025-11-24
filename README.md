# AI Pathways Explorer

An interactive, choose-your-own-path experience exploring **five pedagogical approaches to AI in the classroom**.

Originally designed for **Soka University of America**'s 2025 Faculty Workshop, now **customizable for any institution** through the built-in game customization interface.

---

## Overview

This interactive narrative helps faculty explore the tensions, trade-offs, and possibilities of different AI policies through realistic classroom scenarios. Each pathway offers distinct perspectives on integrity, creativity, equity, trust, and Soka's mission to foster wisdom, courage, and compassion.

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
- **Reflection form** to capture faculty insights

## 🎮 Game Version (NEW!)

**Try the visual novel-style game version!** We've created a proof-of-concept gamified experience:

- **Visual novel interface** with dialogue boxes and typewriter effects
- **Character sprites** that react to different pathways
- **Dynamic backgrounds** that change based on your choices
- **Same great content** - all 23 nodes from the main app
- **[🎮 Play the Game Version](https://mattvicentin.github.io/soka-ai-pathways-gamified/game/)** or click the "Game Version (Beta)" button on the main site

Perfect for a more immersive, game-like exploration of AI pedagogy approaches. See [`game/README.md`](./game/README.md) for details.

---

## Features
- Single‑page app with hash routing (`/#node=...`), no backend
- Content is **data‑driven** via `nodes.json`
- Scene pages show **narrative**, **resources**, and **choices**
- Works on **GitHub Pages**; zero build steps
- Fully responsive design with Tailwind CSS
- **NEW:** Visual novel game version available

## Local Preview
Just open `index.html` in your browser (or use a simple static server).

```bash
# optional
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Live Site

**🌐 [https://mattvicentin.github.io/soka-ai-pathways-gamified/](https://mattvicentin.github.io/soka-ai-pathways-gamified/)**

Start at the dilemma (`/#node=D1`) and follow your pedagogical instincts through realistic classroom scenarios.

**🎮 [Play the Game Version](https://mattvicentin.github.io/soka-ai-pathways-gamified/game/)**

## Project Structure

```
soka-ai-pathways-site/
├── index.html              # Main HTML with Tailwind CSS
├── app.js                  # JavaScript for navigation and rendering
├── nodes.json              # All narrative content and resources
├── README.md               # This file
└── [pathway].md            # Source markdown files with full narratives
```

## Content Sources

This site incorporates content from:
- `Prohibitive_Pathway_with_Resources.md`
- `Balanced_Literacy_Pathway_with_Resources.md`
- `Ai_Embracing_Pathway_with_Resources.md`
- `Collaborative_Pathway_with_Resources.md`
- `Structured_Path_Graph_Soka_AI_Pathways.md`

All pathways include citations to:
- EDUCAUSE Review & Reports (2024-2025)
- UNESCO Guidance on GenAI in Education (2023)
- OECD AI & Future of Learning (2024)
- Harvard Graduate School of Education
- Inside Higher Ed & HEPI Reports
- NASEM Ethics of AI in Education (2023)
- Soka University Mission & Campus Faculty Supports

## Deploy to GitHub Pages

This site is already deployed! To update:
1. Make changes to `nodes.json`, `app.js`, or `index.html`
2. Commit & push to `main`
3. GitHub Pages automatically rebuilds (1-2 minutes)
4. Changes appear at the live URL

## How to Use This Explorer

### For Faculty
1. **Navigate the scenarios** — Start at D1 and choose a pedagogical stance
2. **Read the narratives** — Experience realistic classroom dilemmas
3. **Explore resources** — Click through curated academic articles and reports
4. **Switch paths** — Try different approaches to see trade-offs
5. **Reflect** — End at R1 to connect outcomes to Soka's mission

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
Edit `nodes.json` directly to:
- Update narratives
- Add/modify resources
- Change decision labels
- Adjust node connections

### Adding Nodes
1. Follow naming convention: `P1`, `B2A`, `E3A`, etc.
2. Include: `id`, `path`, `pathLabel`, `title`, `narrative`, `resources`, `choices`
3. Link from existing nodes via `choices[].to`
4. Test navigation flow

## Content Structure (`nodes.json`)
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
- **Mission alignment** — Meta-reflection ties outcomes to Soka's values

### Learning Outcomes
Faculty who complete the explorer will:
- Understand tensions between integrity, creativity, equity, and trust
- Explore trade-offs of prohibitive, balanced, embracing, and collaborative approaches
- Encounter 47 curated resources on AI pedagogy
- Reflect on how AI choices embody institutional mission
- Practice flexible, value-driven decision-making

## Technical Details
- **No build process** — Pure HTML/JS/JSON
- **No backend** — Fully static, runs on any web server
- **No dependencies** — Only Tailwind CSS via CDN
- **Instant updates** — Edit JSON, refresh browser
- **Portable** — Download and run locally anytime

## Credits

**Developed for:** Soka University of America  
**Workshop:** 2025 Faculty Workshop on AI in Education  
**License:** MIT

---

**Questions or suggestions?** Open an issue or connect via the Faculty Forum.
