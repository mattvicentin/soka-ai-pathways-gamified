# AI Pathways Explorer - Quick Start Guide
## Customize for Your Institution in 20 Minutes

---

## 📖 What Is This?

The **AI Pathways Explorer** is an interactive, choose-your-own-path tool that helps faculty navigate the complex decisions around AI in the classroom. Through realistic scenarios, faculty experience five different pedagogical approaches—from ignoring AI entirely to fully embracing it—and reflect on how their choices align with institutional values.

Originally created for Soka University of America's 2025 Faculty Workshop, it's now **fully customizable** for any institution.

---

## 🎯 Goals

This tool helps faculty:
- **Explore trade-offs** between integrity, creativity, equity, and trust
- **Experience realistic dilemmas** through first-person narratives  
- **Access curated resources** - 54 academic articles from EDUCAUSE, UNESCO, Harvard, etc.
- **Reflect on mission alignment** - Connect AI decisions to institutional values
- **Make informed choices** - Understand consequences before implementing policies

Perfect for:
- Faculty development workshops
- Teaching and learning centers
- Department meetings on AI policy
- Individual faculty reflection

---

## ⚙️ How It Works

**For Faculty Using the Tool:**
1. Start with a dilemma: How should I handle AI in my course?
2. Choose a pedagogical approach (Ignore, Prohibit, Balance, Embrace, Collaborate)
3. Progress through 4-5 realistic classroom scenarios
4. Access academic resources at each step
5. Switch pathways if approach isn't working
6. End with meta-reflection on institutional values

**For You (Customizing It):**
1. Edit a Google Sheets template (14 fields: name, colors, values)
2. Download and run a generator script
3. Deploy to your GitHub Pages
4. Share with your faculty!

**Result:** A professional, branded tool that looks like it was built specifically for your institution.

---

## 🎯 What You'll Get

After customization, your institution will have:
- ✅ Fully-branded site with your colors and logo styling
- ✅ Your institution name throughout all narratives
- ✅ Your mission and values integrated into reflections
- ✅ Links to your writing center, research centers, policies
- ✅ 23 interactive decision points
- ✅ 54 curated academic resources
- ✅ Professional design (mobile-responsive)
- ✅ Faculty reflection tracking (optional)
- ✅ Free to use, modify, and share (MIT License)

---

## 📋 What You Need

**Before starting, install these (one-time setup):**

1. **Node.js** - [Download free](https://nodejs.org/) (choose LTS version)
   - Mac/Linux: Use installer
   - Windows: Use installer, check "Add to PATH"
   - Verify: Open terminal, type `node --version`

2. **Git** - Usually pre-installed on Mac
   - Windows: [Download here](https://git-scm.com/)
   - Verify: Type `git --version` in terminal

3. **Text editor** - Any will work (VS Code, Sublime, Notepad++)

---

## 🚀 Three Simple Steps

### **STEP 1: Customize Your Workbook** (10 min)

**🎯 Use the Google Sheets Template (Easiest):**

1. **Click:** https://docs.google.com/spreadsheets/d/16q3f9psLpRvti4WyzKw0Ffc4bynYFDaBQqhY-ggEQZ0/template/preview
2. Click **"Use Template"** button
3. A copy is created for you automatically!

**Edit only the "Value" column (Column B) in these tabs:**

**📋 Branding Tab** - Edit all 14 fields:
- Institution Name: `Your University Name`
- Short Name: `YUN`
- Possessive: `Your University's`
- Colors: Your brand hex codes (e.g., `#003366`)
- Mission URL: Link to your mission page

**💎 Values Tab** - Edit 5 fields:
- Mission Motto: Your institution's motto
- Values 1-4: Your core values

**🔗 Resource Library Tab** - Edit 8 fields:
- Toggle Yes/No for centers you have
- Add URLs for centers (required if Yes)

**📝 Nodes Tab** - Usually SKIP this!
- Only edit if you want custom narratives
- Soka content works for most institutions

**When done:** File → Download → Microsoft Excel (.xlsx)
- Save as: `AI-Explorer-Customization.xlsx`

---

### **STEP 2: Generate Your Site** (5 min)

**Clone the repository:**
```bash
git clone https://github.com/writeian/soka-ai-pathways.git
cd soka-ai-pathways
```

**Add your workbook:**
- Copy your downloaded `AI-Explorer-Customization.xlsx`
- Place in the `customization-kit/` folder

**Generate (ONE command):**
```bash
bash customization-kit/generate.sh
```

**What happens:**
- ✓ Installs dependencies
- ✓ Reads your workbook
- ✓ Validates all fields
- ✓ Creates config files
- ✓ Shows validation report

**Check for errors:**
- Open `customization-kit/output/validation-report.txt`
- Fix any issues (missing URLs, invalid colors)
- Run again if needed

---

### **STEP 3: Test & Deploy** (5 min)

**Test locally first:**
```bash
bash customization-kit/test-local.sh
```
- Opens http://localhost:8000
- See your branded site!
- Check colors, institution name, values

**If it looks good, deploy:**
```bash
bash customization-kit/deploy.sh
```
- Commits changes
- Pushes to GitHub
- Live in 1-2 minutes!

**Share your URL:**
```
https://your-github-username.github.io/soka-ai-pathways/
```

---

## ❓ Common Issues & Fixes

### "npm: command not found"
**Fix:** Install Node.js from https://nodejs.org/
- Restart terminal after install

### "bash: command not found" (Windows)
**Fix:** Use Git Bash (comes with Git) instead of Command Prompt
- Or manually run commands (see README.md)

### "Invalid hex color"
**Fix:** Colors must be exactly 6 characters: `#RRGGBB`
- Example: `#0048B7` ✅
- Not: `#04B` ❌ or `blue` ❌

### "Required field is empty"
**Fix:** If you checked "Yes" for Research/Writing Center, you must provide:
- Name (e.g., "Yale Writing Center")
- URL (e.g., "https://writing.yale.edu/")

### Colors don't update
**Fix:** Hard refresh browser
- Mac: Cmd + Shift + R
- Windows: Ctrl + Shift + F5

### Site still shows Soka content
**Fix:** Make sure you:
1. Ran `bash customization-kit/deploy.sh` (not just generate.sh)
2. Waited 2 minutes for GitHub Pages to rebuild
3. Hard refreshed browser

---

## 📖 Need More Help?

**Full documentation:**
- [Customization Kit README](./README.md)
- [Admin System Guide](../docs/Admin-Customization-System-Guide.md)
- [Google Sheets Setup](../docs/Google-Sheets-Template-Setup.md)

**Still stuck?**
- Open an issue: https://github.com/writeian/soka-ai-pathways/issues
- Check FAQ in main README

---

## 🎓 What Each File Does

| File | Purpose |
|------|---------|
| `01-Branding.csv` | Colors, names, URLs (alternative to Google Sheets) |
| `02-Values.csv` | Mission and values (alternative) |
| `03-Resource-Library.csv` | Centers and policies (alternative) |
| `04-Nodes.csv` | Optional narrative edits (alternative) |
| `README.md` | Detailed guide with all options |
| `QUICK-START.md` | This file - fast track guide |
| `generate.sh` | One-command generator (Mac/Linux) |
| `test-local.sh` | Local preview helper |
| `deploy.sh` | Deploy to GitHub helper |

**TIP:** Most users will use the Google Sheets template and never touch the CSV files!

---

## ⏱️ Timeline

| Task | Time |
|------|------|
| Use template & edit | 10-15 min |
| Clone repo & generate | 3 min |
| Test locally | 2 min |
| Deploy | 2 min |
| **TOTAL** | **~20 minutes** |

---

## 🎉 Success Checklist

After deployment, verify:
- [ ] Site loads at your GitHub Pages URL
- [ ] Your institution name appears in narratives
- [ ] Your colors show on buttons and headings
- [ ] Resource links use your institution's URLs
- [ ] Welcome screen shows your site name
- [ ] Page title (browser tab) shows your name

**All checked?** Share with your faculty! 🚀

---

**Questions?** Open an issue or check the full documentation.

**Built by:** Soka University of America  
**License:** MIT - Free to use and adapt  
**Original:** https://writeian.github.io/soka-ai-pathways/

