# Admin Customization System Guide
## Making the AI Pathways Explorer Easy to Retheme

**Version:** 2.0  
**Updated:** October 2025  
**Audience:** Faculty or staff with little/no coding experience who want to adapt the explorer for their institution.

---

## 1. Guiding Principles

- **Keep production static.** The public site stays a simple HTML/JS bundle so GitHub Pages remains stable.
- **Empower non‑technical editors.** Branding, values, and narratives are edited in human‑friendly documents (Google Sheet / Excel workbook) instead of raw JSON.
- **Automate the “hard” step.** A single script turns the workbook + settings into the `nodes.json` and `config.json` the site already expects.
- **Allow safe narrative edits.** Admins can change text and resources through the workbook without touching code.
- **Optional, not mandatory.** Advanced users can still hand edit JSON if they prefer.

---

## 2. Simplified Architecture

```
/
├── index.html                 # unchanged – renders the explorer
├── app.js                     # now reads config + nodes generated below
├── config/config.json         # branding + mission values (generated)
├── data/custom-nodes.json     # optional overrides (generated)
├── data/nodes-base.json       # copy of current Soka content (read-only)
└── scripts/apply-config.mjs   # node script that builds final assets
```

### New Assets for Customizers

```
customization-kit/
├── AI-Explorer-Customization.xlsx   # workbook with friendly tabs
├── instructions.pdf                 # walk-through with screenshots
└── run-generator.command            # double-click script (macOS/Win)
```

---

## 3. What Admins Can Customize

| Category | Where Admin Edits | Resulting Output | Notes |
|----------|-------------------|------------------|-------|
| Institution Name, Short Name, Mission URL | **Workbook → “Branding” tab** | `config/config.json` | Used for titles, resource links |
| Primary & Accent Colors + optional pathway palette | **Workbook → “Branding” tab** | CSS variables in `config/config.json` | App.js injects them on load |
| Mission Values / Motto | **Workbook → “Values” tab** | `config/config.json` | Interpolated into select nodes |
| Narrative, resources, choices per node | **Workbook → “Nodes” tab** | `data/custom-nodes.json` | Supports full-text editing |
| Extra institution links (Writing Center, Research Center, etc.) | **Workbook → “Resources” tab** | `config/config.json` & `custom-nodes.json` | Optional: blanks fall back to defaults |

All edits happen in the spreadsheet. The generator handles JSON, escaping, and placeholder replacement.

---

## 4. Customization Workflow (for admins)

1. **Download the customization kit** (zip) from the repository releases page.
2. **Open `AI-Explorer-Customization.xlsx`.**
   - “Cover” tab explains each field with examples.
   - “Branding” tab collects institution name, colors, mission URL.
   - “Values” tab captures up to four mission pillars plus a motto.
   - “Nodes” tab lists every node (ID, title, narrative, resources, choices).
     - Friendly columns (Resource 1 Label/URL/Why, Choice 1 Label/To) prevent JSON mishaps.
   - “Resource Library” tab documents optional campus links.
3. **Edit the highlighted cells only** (others are formula-locked to avoid broken exports).
4. **Click the “Generate Site Files” button** (Excel macro or Sheet App Script) **OR** double-click the included `run-generator` script:
   - Prompts for the workbook (if not already in same folder).
   - Outputs `config.json` and `custom-nodes.json` into `customization-kit/output/`.
5. **Preview locally before deploying**:
   - Open `index.html` from the project root in a browser (double-click or run `python3 -m http.server` and visit `http://localhost:8000`).
   - Confirm colors, narratives, and links look correct.
6. **Upload the generated files**:
   - GitHub novices can drag/drop via the GitHub web UI into `config/` and `data/`.
   - Advanced users can run `npm run apply-config`.
7. **Deploy** – once committed to `main`, GitHub Pages updates automatically.

---

## 5. Implementation Details (for maintainers)

### 5.1 Base Data
- Copy current `nodes.json` to `data/nodes-base.json`.
- Annotate cells in the workbook with formulas that reference this base data so admins see the original text as a starting point.
- Leave `data/nodes-base.json` untouched; the generator merges admin edits over it.

### 5.2 Generator Script (`scripts/apply-config.mjs`)

Responsibilities:
1. Read workbook (use `xlsx` npm package) or CSV exports.
2. Build a `config` object (branding, values, extra resource links).
3. Create a `customNodes` map keyed by node ID:
   - If narrative/title cells are non-empty, override base node.
   - Rebuild resources/choices arrays from tabular rows.
4. Validate critical fields:
   - Ensure required cells (institution name, mission URL, each node title) are populated.
   - Verify hex colors match `#RRGGBB`.
   - Run a basic URL format check (`https://` and no spaces) and flag any issues.
   - Collect warnings and write a `output/validation-report.txt`.
5. Merge `config` and `customNodes` into final assets:
   - `config/config.json` (write pretty-printed).
   - `data/custom-nodes.json`.
6. Exit non-zero if validation finds blocking errors; otherwise print a success summary.

**Command examples**
```bash
npm install xlsx
node scripts/apply-config.mjs --workbook customization-kit/AI-Explorer-Customization.xlsx
```
or in package.json:
```json
{
  "scripts": {
    "apply-config": "node scripts/apply-config.mjs"
  }
}
```

> **No-Node fallback:** for institutions that can’t install Node.js, plan to ship a companion `generator.html` (see Future Enhancements) that runs the same logic entirely in the browser. The spreadsheet + script remain the primary path until that tool is ready.

### 5.3 Loading Config in `app.js`

1. Fetch `config/config.json` and `data/custom-nodes.json` in parallel.
2. Merge `customNodes` over `nodes-base.json` so unchanged entries default to Soka content.
3. Apply colors by setting CSS variables on `document.documentElement`.
4. Whenever the app renders a node, it uses the merged map (no template strings required).

### 5.4 Spreadsheet Automation

- **Excel version:** embed a macro (VBA) that calls `wscript.exe` or `node` to run `apply-config.mjs`.
- **Google Sheets version:** provide an Apps Script snippet that exports CSVs, then instruct users to download and run `npm run apply-config`.
- Each tab has data validation (color pickers, dropdowns for pathways, URL regex).

### 5.5 Narrative Editing Support

- Nodes tab includes guidance rows explaining max length, recommended tone, and where each field appears.
- Provide a “Preview Narrative” formula that concatenates values so admins can read the full paragraph in one cell before exporting.
- Resources/choices count is limited to 5 per node in the template; script ignores blank rows.

---

## 6. Minimal Security / Versioning Practices

- No live admin UI; all edits happen offline.
- Encourage admins to keep a copy of the workbook in their institution’s shared drive for version history.
- Include a “Reset to Soka Defaults” button in the workbook that re-imports `nodes-base.json` (macro simply reloads the original data sheet).

---

## 7. Rollout Checklist

- [ ] Add `data/nodes-base.json` to the repo.
- [ ] Update `app.js` to merge `config` + `custom-nodes`.
- [ ] Commit `scripts/apply-config.mjs` plus package.json dependencies.
- [ ] Design the Excel/Sheets template with locked cells & instructions.
- [ ] Create written guide (`instructions.pdf` or Markdown).
- [ ] Publish a zipped “Customization Kit” in the repo’s Releases (contains workbook, script, README).
- [ ] Document drag‑and‑drop upload steps for GitHub web UI in README.
- [ ] Run smoke test: edit a single node via workbook, regenerate, confirm live site changes after deploy.

---

## 8. Future Enhancements (Optional Later)

| Idea | Benefit | Suggested Implementation |
|------|---------|--------------------------|
| Web-based generator | Remove Node.js requirement; run entirely client-side | Build `generator.html` with File API + `xlsx` JS library |
| Workbook presets | Fast-start templates for liberal arts, community colleges, K-12 | Add hidden sheets with “Copy preset” buttons |
| Narrative style guardrails | Keeps tone consistent | Add optional AI prompt sheet that drafts narratives into the workbook |
| Theme presets | One-click color/value sets | Add dropdown in Branding tab linked to hidden library sheet |
| Multilingual columns | Prep translations alongside English | Add “Narrative (ES)” columns with optional toggle in app.js |
| Change summary report | Highlights deviations from Soka defaults | Generator compares base vs custom nodes and prints overview |

---

## 9. Summary

This plan prioritizes simplicity and reliability:
- Non-technical admins edit familiar spreadsheet cells.
- A single generator script outputs the files GitHub Pages already serves.
- No runtime admin interface is exposed publicly, reducing the risk of accidental breakage.
- Narrative edits are fully supported, while keeping the live site lightweight and easy to maintain.

---

## 10. Recommended Implementation Phases

| Phase | Timebox | Tasks |
|-------|---------|-------|
| **Phase 1 — Core System** | ~3 hours | Build workbook template, implement `apply-config.mjs` with validation, test by regenerating Soka defaults, draft instructions PDF/README. |
| **Phase 2 — Distribution** | ~1 hour | Package customization kit ZIP, publish in GitHub Releases, update main README with download link and quick-start checklist. |
| **Phase 3 — Nice-to-haves (optional)** | As needed | Prototype web-based generator, add presets/themes, enhance validation/reporting. |
