# Google Sheets Template Setup Guide
## Create Shareable Template for AI Pathways Customization

**Time Required:** 10-15 minutes  
**Result:** One-click template link for any institution to customize

---

## Quick Setup Instructions

### Step 1: Create New Google Sheet (1 min)

1. Go to https://sheets.google.com
2. Click **Blank** to create new spreadsheet
3. Name it: **"AI Pathways Explorer - Customization Template"**

### Step 2: Import the 4 CSVs (4 min)

**For Each CSV File:**

1. Create a new sheet tab (click **+** at bottom)
2. Name it exactly: `Branding`, `Values`, `Resource Library`, or `Nodes`
3. In that sheet: **File → Import → Upload**
4. Select the CSV file from `customization-kit/`
5. **Import location:** "Replace current sheet"
6. **Separator type:** Comma
7. Click **Import data**

**Repeat for all 4:**
- Import `01-Branding.csv` → "Branding" tab
- Import `02-Values.csv` → "Values" tab  
- Import `03-Resource-Library.csv` → "Resource Library" tab
- Import `04-Nodes.csv` → "Nodes" tab

### Step 3: Add Instructions Tab (3 min)

1. Create first tab (drag to position 1)
2. Name it: **"📖 Instructions"**
3. Copy this content:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎓 AI PATHWAYS EXPLORER - CUSTOMIZATION TEMPLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUICK START:

1. MAKE A COPY
   File → Make a copy → Name it "[Your Institution] AI Pathways"

2. EDIT 4 TABS
   Only edit cells in the "Value" column (Column B):
   
   📋 Branding Tab (14 fields)
      - Institution name, colors, URLs
      - Use hex codes for colors (e.g., #003366)
   
   💎 Values Tab (5 fields)
      - Your mission motto and core values
   
   🔗 Resource Library Tab (8 fields)
      - Toggle Yes/No for centers you have
      - Provide URLs only if you check "Yes"
   
   📝 Nodes Tab (23 rows - OPTIONAL)
      - Most people leave this unchanged
      - Only edit if you want custom narratives

3. DOWNLOAD
   File → Download → Microsoft Excel (.xlsx)
   Save as: AI-Explorer-Customization.xlsx

4. GENERATE YOUR SITE
   Follow instructions at:
   https://github.com/writeian/soka-ai-pathways

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT NOTES:

✅ Only edit "Value" column (Column B)
✅ Don't delete rows or change "Field" column
✅ Hex colors must be 6 characters: #RRGGBB
✅ URLs must start with https:// or http://
✅ If you check "Yes" for a center, you MUST provide its URL

Questions? See the full guide:
https://github.com/writeian/soka-ai-pathways/blob/main/docs/Admin-Customization-System-Guide.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Add Data Validation (4 min)

**In "Resource Library" tab:**

1. Select cell B1 (Has Research Center value)
2. **Data → Data validation**
3. Criteria: **List of items**: `Yes,No`
4. Click **Save**
5. Repeat for B4 (Has Writing Center)

**In "Branding" tab (Primary Color):**

1. Select cell B6 (Primary Color value)
2. Add **Note/Comment**: "Use hex format: #RRGGBB. Try https://colorhexa.com/"
3. Repeat for B7 (Accent Color)

### Step 5: Format for Readability (2 min)

**All tabs:**
- Bold Row 1 (headers)
- Freeze Row 1: **View → Freeze → 1 row**
- Auto-resize columns: Select all → **Format → Resize columns → Fit to data**

**Branding/Values/Resource Library:**
- Make "Instructions" column (C) italic and gray
- Widen "Value" column for easy editing

**Nodes tab:**
- This is wide - that's OK!
- Add note: "Most users leave this tab unchanged"

### Step 6: Protect Structure (2 min)

**Protect "Field" and "Instructions" columns from editing:**

1. Select Column A (Field column)
2. **Data → Protect sheets and ranges**
3. Set permissions: "Show a warning"
4. Description: "Don't edit - these are field names"
5. Click **Set permissions**

Repeat for Column C (Instructions)

### Step 7: Share as Template

**Create template link:**

1. Click **Share** button (top right)
2. Change to: **Anyone with the link → Viewer**
3. Click **Copy link**
4. Share this link in:
   - GitHub README
   - LinkedIn post
   - Customization kit documentation

**Template link will look like:**
```
https://docs.google.com/spreadsheets/d/1abc.../edit?usp=sharing
```

**When users click it:**
- They see the template (read-only)
- **File → Make a copy** gives them their own editable version

---

## Alternative: Template Preview Mode

For even better UX, create a **template preview link**:

1. In your Google Sheet
2. Change sharing to "Anyone with link can **view**"
3. Copy the link
4. Add `/template/preview` before the final part:

**Format:**
```
https://docs.google.com/spreadsheets/d/[ID]/template/preview
```

**Users see:**
- Big blue "Use Template" button
- Creates copy automatically
- Even easier!

---

## What Users Will See

When they click "Use Template" or "Make a copy":

**Tab 1: 📖 Instructions**
- Clear, formatted guide
- No editing needed

**Tab 2: Branding**
```
┌─────────────────────────────┬──────────────────┬──────────────────┐
│ Field                       │ Value            │ Instructions     │
├─────────────────────────────┼──────────────────┼──────────────────┤
│ Institution Name            │ Soka University..│ Full name...     │ ← They edit this
│ Institution Short Name      │ SUA              │ Abbreviation...  │ ← And this
│ Institution Possessive      │ Soka's           │ Possessive...    │ ← And this
│ ...                         │ ...              │ ...              │
└─────────────────────────────┴──────────────────┴──────────────────┘
```

Very clear what to do!

---

## Testing Your Template

Before sharing:

1. Click your template link
2. "Make a copy"
3. Edit a few fields (try MIT as test)
4. Download as Excel
5. Run through generator workflow
6. Verify it works

If it does → Share the template link!

---

## Distribution

**In your LinkedIn post:**
```
🎓 AI Pathways Explorer - Now Customizable!

Customize for your institution in 3 steps:
1. Use the template: [Google Sheets link]
2. Edit 14 fields (name, colors, values)
3. Generate your site: [GitHub repo link]

Takes 20 minutes. No coding required.
```

**In GitHub README.md:**
```markdown
## Quick Start

1. **Customize:** [Use the Google Sheets template](https://docs.google.com/...)
2. **Generate:** Follow [customization guide](./docs/...)
3. **Deploy:** Push to GitHub Pages
```

---

## Pro Tips

### Enhance the Template:

**Add to Branding tab:**
- Conditional formatting: Red highlight if hex code invalid
- Example colors with preview cells
- Link to color picker tool

**Add to Resource Library:**
- Auto-generate possessive from institution name?
- Data validation dropdowns

**Add to Nodes tab:**
- Filter views for each pathway
- Color-code by pathway
- Hide columns most users don't need

---

## Next Steps

1. Create the Google Sheet (10 min following steps above)
2. Test it yourself (make a copy, edit, download)
3. Get the template link
4. Update customization-kit/README.md with the link
5. Share on LinkedIn!

**Ready to create it now, or want me to prepare anything else first?**

