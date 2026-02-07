<p align="center">
  <img src="https://img.shields.io/badge/version-1.7-orange" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

# 🖋️ Ink Tracker

**AI-powered storyboarding for comics, graphic novels, and visual storytelling.**

Stop describing panels in scripts that artists can't visualize. Generate rough storyboards in minutes, iterate on layouts, and hand off something your collaborators can actually see.

### [→ Try it now](https://ink-tracker-tau.vercel.app)

---

## The Problem

You've written a 22-page script. Panel descriptions, dialogue, camera angles—it’s all there. You send it to your artist and they come back with questions:

> "What does 'medium shot' mean here?"  
> "Is this a vertical or horizontal panel?"  
> "What does Maya actually look like?"

Comic scripts are blueprints written in words for a visual medium. That gap between what you see in your head and what ends up on the page? That’s where projects stall, miscommunications happen, and creative intent gets lost.

## The Solution

Ink Tracker bridges that gap. Write your panel descriptions, select your characters, pick an art style, and generate visual storyboards with AI. Not final art—rough layouts that communicate composition, mood, and pacing.

**For writers:** See your script before an artist touches it. Catch pacing issues. Realize that splash page doesn’t work on page 3.

**For solo creators:** Storyboard your entire issue in an afternoon. Export to PDF or CBZ. Use AI art as placeholders or finish the panels yourself.

**For teams:** Give your artist reference images instead of paragraphs. Show your letterer where the dialogue goes. Get everyone on the same page—literally.

---

## Features

### 🎨 25+ Art Styles
From Sin City noir to Kirby cosmic to Lisa Frank fever dreams. Each style is a tuned prompt that produces consistent results. Or write your own custom style.

**Noir & Crime** — Classic Film Noir, Sin City, Gritty Crime, Spirit (Eisner)  
**Superhero** — Bronze Age, Silver Age, Kirby Cosmic, Alex Ross, Frank Miller  
**Horror** — EC Horror, Vertigo, Mignola/Hellboy, Hellraiser, Spawn  
**Indie & European** — Underground Comix, Clear-Line, Moebius, Modern Alt  
**Americana & Whimsy** — Norman Rockwell, Kinkade, Lisa Frank  
**Sci-Fi** — Dune, Cyberpunk Noir, Retro Pulp  

### 👥 Character Codex
Define your cast once with detailed appearance descriptions. Select characters per panel and their details are automatically included in generation prompts. No more inconsistent faces.

### 🔗 Panel Linking
Generate a panel, then link subsequent panels to it for visual consistency. Adjust the strength slider to control how closely new images match the reference. Same character, same lighting, same angle—or let it drift for creative variation.

### 📝 Script Import
Paste your script and Ink Tracker parses it into pages, panels, and dialogue. Supports standard comic script formatting. Import a 22-page script and get 22 pages of structured panels ready to generate.

### 💬 Text Elements
Add dialogue bubbles, thought clouds, captions, and phone screens directly on panel images. Drag to position, adjust tail direction, change font size. Basic lettering without leaving the app.

### 📤 Export Options
- **ZIP** — All panel images from a page  
- **CBZ** — Full issue as a comic book archive (opens in any comic reader)  
- **PDF** — Single page or full issue, print-ready

### 🎬 Presentation Mode
Walk through your issue panel by panel in fullscreen. Arrow keys, spacebar, or click to navigate. Use it to check pacing, review visual flow, or present your storyboards to collaborators.

### 🎛️ Multiple AI Providers
Bring your own API key from:  
- Google Gemini  
- Leonardo.ai  
- FAL (Flux models)  
- Grok (xAI)  
- SeaArt

Switch providers per project. Use the fast/cheap one for rough layouts, the good one for hero shots.

---

## Quick Start

### Use it now (no install)
**[→ ink-tracker-tau.vercel.app](https://ink-tracker-tau.vercel.app)**

1. Open the Archive (folder icon) → Create a project  
2. Add an Issue/Chapter → Add a Page  
3. Set your image provider and API key in the sidebar  
4. Pick an art style  
5. Click **ADD FRAME** → Write a prompt → Hit **Generate**  
6. Once you have panels generated, click **PRESENT** in the toolbar to enter presentation mode — a fullscreen slideshow walkthrough of your panels with arrow key/spacebar navigation.

### Run locally

```bash
git clone https://github.com/aandrewaugustine13-dev/ink-tracker.git
cd ink-tracker
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Arrow keys` | Select next/previous panel |
| `Delete` | Remove selected panel |
| `Escape` | Exit selection or presentation mode |
| `Space` | Advance slide (in presentation mode) |

**In Presentation Mode:** Arrow keys and Space to advance, Escape to exit.

---

## Canvas Controls

| Action | How |
|--------|-----|
| Add panel | Click **ADD FRAME** |
| Move panel | Drag the move handle (top-left) |
| Resize panel | Drag bottom-right corner |
| Pan canvas | **NAV MODE** or hold Space + drag |
| Apply layout | **TEMPLATES** → select preset |
| Toggle view | **GUTTERS** switches dark/light mode |

---

## Project Structure

```
ink-tracker/
├── src/
│   ├── components/     # React components
│   ├── services/       # API integrations (Gemini, Leonardo, etc.)
│   ├── state/          # State management
│   ├── types/          # TypeScript definitions
│   └── utils/          # Helpers
├── api/                # Vercel serverless functions
├── public/             # Static assets
└── dist/               # Build output
```

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Drag & Drop:** dnd-kit
- **Storage:** localStorage (projects) + IndexedDB (images)
- **Hosting:** Vercel
- **AI:** Multi-provider (Gemini, Leonardo, FAL, Grok, SeaArt)

---

## Roadmap

- [ ] Collaborative editing (multiplayer)
- [ ] Version history / branching
- [ ] Direct artist handoff integration
- [ ] Mobile layout support
- [ ] Community style library
- [ ] Panel-to-panel animation preview

---

## Why I Built This

I’m working on a 35-issue graphic novel. Writing scripts is one thing—visualizing 700+ pages of panels is another. I needed a way to see my story before committing to final art, to catch pacing problems early, and to communicate with collaborators without writing novels about what each panel should look like.

Existing tools were either too simple (mood boards), too complex (full illustration software), or too expensive (production storyboarding tools). So I built this.

If you’re making comics, graphic novels, webtoons, or any kind of sequential visual story—this is for you.

---

## Contributing

PRs welcome. If you’re adding a feature, open an issue first so we can discuss.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
npm run dev
# Make changes, test locally
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a PR
```

---

## License

MIT — do whatever you want with it.

---

## Links

- **Live App:** [ink-tracker-tau.vercel.app](https://ink-tracker-tau.vercel.app)
- **Issues:** [GitHub Issues](https://github.com/aandrewaugustine13-dev/ink-tracker/issues)

---

<p align="center">
  <i>Built for comic creators who are tired of describing pictures with words.</i>
</p>
