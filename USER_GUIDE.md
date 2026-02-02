# Ink Tracker User Guide

**Ink Tracker** is a powerful comic book and graphic novel storyboarding application that combines AI-powered image generation with an intuitive canvas-based workflow. This guide will help you get started and master all the features.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Interface](#understanding-the-interface)
3. [Project Management](#project-management)
4. [Working with Issues/Chapters](#working-with-issueschapters)
5. [Creating and Managing Pages](#creating-and-managing-pages)
6. [Panel Cards (Frames)](#panel-cards-frames)
7. [Character Bank](#character-bank)
8. [AI Image Generation](#ai-image-generation)
9. [Script Import](#script-import)
10. [Text Overlays (Speech Bubbles, Captions)](#text-overlays-speech-bubbles-captions)
11. [Page Templates](#page-templates)
12. [Canvas Navigation](#canvas-navigation)
13. [Exporting Your Work](#exporting-your-work)
14. [Presentation Mode](#presentation-mode)
15. [Keyboard Shortcuts](#keyboard-shortcuts)
16. [Tips and Best Practices](#tips-and-best-practices)

---

## Getting Started

### First Launch

When you first open Ink Tracker, you'll see the main canvas with a sidebar on the left. The app automatically creates a default project for you to start working with.

### Basic Workflow

1. **Create or select a project** in the sidebar
2. **Add characters** to your cast
3. **Create issues/chapters** for your story
4. **Add pages** to each issue
5. **Add panel frames** to each page
6. **Write panel descriptions** and assign characters
7. **Generate AI images** for each panel
8. **Add speech bubbles and captions** as needed
9. **Export** your finished pages

---

## Understanding the Interface

### Sidebar (Left Panel)

The sidebar contains:

- **Story Section**: Current project info and script import button
- **Image Provider**: Select and configure your AI image generation service
- **Issues/Chapters**: List of all issues in the current project
- **Cast**: Your character roster
- **Art Style**: Choose the visual style for image generation

### Main Canvas (Center)

The main workspace where you create and arrange your comic panels. Features include:

- Freeform positioning of panels
- Drag-and-drop reordering
- Zoom and pan controls
- Grid/gutter view toggle

### Header Bar (Top)

Contains:

- Page title and navigation breadcrumb
- Undo/Redo buttons
- Zoom controls
- Export options
- Auto-Ink button (batch generate all panels)
- Page templates
- Script panel toggle
- Character Bank access
- Present mode
- Add Frame button

### Status Bar (Bottom)

Shows current status (ready, generating, exporting) and active project info.

---

## Project Management

### Opening the Project Hub

Click the **folder icon** next to "Story" in the sidebar to open the Archive (Project Hub).

### Creating a New Project

1. Open the Project Hub
2. Click **"Initialize Sequence"**
3. Enter a project title
4. The project is created with default settings

### Selecting a Project

Click on any project card in the Project Hub to make it active. The selected project will have an orange border.

### Editing Project Settings

1. Click the **edit icon** (pencil) on any project card
2. Configure:
   - **Image Provider**: Choose between Gemini, Leonardo, Grok, FAL, or SeaArt
   - **API Key**: Enter your API key for the selected provider

### Deleting a Project

Click the **trash icon** on the project card and confirm deletion.

---

## Working with Issues/Chapters

### Terminology

You can switch between "Issue" and "Chapter" labeling based on your preference:
- Click **"Mode: issue"** or **"Mode: chapter"** in the sidebar to toggle

### Creating an Issue/Chapter

1. Click the **+** button next to the Issues/Chapters header
2. A new issue is created with a default title

### Selecting an Issue

Click on any issue in the sidebar to expand it and see its pages.

### Deleting an Issue

Hover over an issue and click the **trash icon** that appears.

---

## Creating and Managing Pages

### Adding a New Page

1. Select an issue in the sidebar
2. Click **"+ Add Page"** at the bottom of the expanded issue

### Selecting a Page

Click on any page number (e.g., "PAGE 1") to load it onto the canvas.

### Page Information

Each page shows:
- Page number
- Number of frames/panels (e.g., "3F" means 3 frames)

---

## Panel Cards (Frames)

Panels are the core building blocks of your comic pages.

### Adding a New Panel

Click the **"ADD FRAME"** button in the top-right of the header.

### Panel Card Components

Each panel card includes:

1. **Header**: 
   - Drag handle (move icon) for repositioning
   - Panel number (e.g., "1/4")
   - Aspect ratio selector
   - Copy/Paste settings buttons
   - Delete button

2. **Image Area**:
   - Image preview or placeholder
   - Upload image button
   - Regenerate button (when image exists)
   - Text overlay toolbar (add bubbles/captions)
   - Sequence number badge

3. **Prompt Text Area**:
   - Describe the scene, action, and mood
   - This text is used for AI image generation

4. **Character Selector**:
   - Select which characters appear in this panel
   - Their appearances are automatically included in prompts

5. **Reference Panel Selector**:
   - Link to another panel for visual consistency
   - Adjust consistency strength (10%-100%)

6. **Generate Button**:
   - Click to generate an AI image for this specific panel

### Changing Aspect Ratio

1. Click the aspect ratio button (shows current ratio like "Wide")
2. Choose from:
   - **Wide (16:9)**: Panoramic shots
   - **Standard (4:3)**: Classic comic panels
   - **Square (1:1)**: Equal dimensions
   - **Tall (3:4)**: Vertical panels
   - **Portrait (9:16)**: Full-height vertical

### Moving Panels

1. Hover over a panel to see the move handle (arrow icon)
2. Click and drag to reposition on the canvas
3. Panels can be placed anywhere on the freeform canvas

### Resizing Panels

1. Hover over the bottom-right corner of a panel
2. Drag to resize

### Copying Panel Settings

1. Click the **copy icon** on a panel to copy its aspect ratio and character assignments
2. Click the **paste icon** on another panel to apply those settings

### Uploading Custom Images

1. Click **"Upload Image"** in an empty panel
2. Or hover over an existing image and click the upload icon
3. Select an image file (max 10MB)

---

## Character Bank

Characters are essential for maintaining visual consistency across your comic.

### Opening the Character Bank

Click the **"CHARACTERS"** button in the header.

### Adding a New Character

1. Click **"Add New Character"**
2. Fill in the character details:

**Basic Info:**
- **Name** (required): Character's name
- **Quick Description**: Brief role/summary

**Physical Appearance:**
- Age, Gender, Ethnicity
- Height, Build, Skin Tone
- Hair Color, Hair Style, Eye Color
- Facial Features
- Distinguishing Marks
- Typical Clothing
- Accessories
- Additional Notes

### Editing a Character

1. Click the **edit icon** (pencil) on the character card
2. Modify any fields
3. Click **"Save Character"**

### Viewing Character Details

Click the **chevron** (arrow) on a character card to expand/collapse their full appearance details.

### Deleting a Character

Click the **trash icon** on the character card and confirm deletion.

### How Characters Work with Image Generation

When you assign characters to a panel, their appearance details are automatically included in the image generation prompt. This helps maintain consistent character appearances across panels.

---

## AI Image Generation

Ink Tracker supports multiple AI image generation providers.

### Supported Providers

| Provider | Best For | API Key Source |
|----------|----------|----------------|
| **Gemini** | General purpose | ai.google.dev |
| **Leonardo** | High-quality art | leonardo.ai |
| **Grok** | Experimental | console.x.ai |
| **FAL** | Fast generation | fal.ai |
| **SeaArt** | Creative styles | seaart.ai/api |

### Setting Up an Image Provider

1. In the sidebar, under "Image Provider", click the provider you want to use
2. The selected provider is highlighted
3. Enter your API key in the input field below
4. Click **"SET"** to save the key

### Generating Images

**Single Panel:**
1. Write a description in the panel's prompt field
2. Optionally assign characters
3. Click the **"Generate"** button

**Batch Generation (Auto-Ink):**
1. Add prompts to all panels on the page
2. Click **"AUTO-INK"** in the header
3. All panels without images will be generated in sequence

### Art Styles

Choose from curated art style presets in the sidebar:

**Categories:**
- **Noir & Crime**: Classic Film Noir, Sin City, Gritty Crime, Will Eisner
- **Superhero**: Bronze Age (70s), Silver Age (60s), Kirby Cosmic, Alex Ross, Frank Miller
- **Horror & Dark Fantasy**: EC Horror, Vertigo, Mignola/Hellboy, Hellraiser, Spawn
- **Indie & European**: Underground Comix, Indie Minimalist, Clear-Line (Tintin), European BD
- **Americana & Whimsy**: Norman Rockwell, Kinkade Luminous, Lisa Frank
- **Sci-Fi & Experimental**: Dune Epic, Photorealistic, Pulp Adventure, Cyberpunk Noir
- **Custom**: Define your own style prompt

### Custom Art Style

1. Select **"Custom Style"** from the art style dropdown
2. Enter your custom style prompt in the text area that appears
3. Describe artists, techniques, color palettes, and mood

**Example custom prompt:**
```
watercolor fantasy illustration, soft edges, muted pastels, 
Studio Ghibli influence, ethereal lighting, hand-painted texture
```

### Panel-to-Panel Consistency

Use reference panels for visual consistency:

1. Generate an image for your first panel
2. On subsequent panels, click **"Link to previous panel..."**
3. Select the panel to use as reference
4. Adjust the **Consistency Strength** slider:
   - Lower (10-40%): More creative variation
   - Higher (70-100%): Strong visual consistency

---

## Script Import

Import existing comic scripts to quickly set up your storyboard.

### Opening Script Import

Click **"📜 Import Script"** in the sidebar.

### Supported Format

Scripts should follow this markdown-like format:

```markdown
# MY GRAPHIC NOVEL

## Issue #1: "The Beginning"

**Written by Your Name**

---

### PAGE ONE (5 Panels)

**Panel 1**
Wide establishing shot. City street at dusk.

> CAPTION: Two hours earlier.

**Panel 2**
Close on DETECTIVE JACK, lighting a cigarette.

> **JACK:** This city never sleeps.
> **JACK (thought):** Neither do I anymore.

**Panel 3 (Split Panel)**
Jack sees movement in the alley.

> SFX: BANG

**Panel 4**
He draws his weapon.

> **JACK (whisper):** Got you.
```

### Script Elements

- `# Title`: Main title
- `## Issue #X: "Subtitle"`: Issue header
- `### PAGE X`: Page marker
- `**Panel X**`: Panel marker (can include visual markers like "Split Panel")
- Regular text: Panel descriptions
- `> CAPTION:`: Caption boxes
- `> **CHARACTER:**`: Dialogue
- `> **CHARACTER (thought):**`: Thought bubbles
- `> SFX:`: Sound effects

### Visual Markers

Scripts can include panel type hints:
- `(Split Panel)`, `(Splash)`, `(Full Width)`, `(Large)`, `(Inset)`

### Importing

1. Paste or upload your script
2. Click **"Parse Script"**
3. Review the parsed results (pages, panels, characters)
4. Click **"Import X Pages → Storyboard"**

### Script Reference Panel

After importing, click **"SCRIPT"** in the header to show/hide the original script text for reference while working.

---

## Text Overlays (Speech Bubbles, Captions)

Add dialogue bubbles, thought clouds, and caption boxes to your panels.

### Adding Text Overlays

1. Hover over a panel with an image
2. Click one of the text toolbar buttons at the bottom-left:
   - **💬 Message Circle**: Dialogue bubble
   - **☁️ Cloud**: Thought bubble
   - **T Type**: Caption box
   - **📱 Smartphone**: Phone/text message

### Editing Text

1. Click on any text overlay
2. Edit the text directly (contenteditable)
3. Click outside to save

### Moving Text Overlays

1. Click and drag the text bubble to reposition it

### Adjusting the Tail

For speech/thought bubbles:
1. Click the bubble to select it
2. A orange handle appears for the tail
3. Drag the handle to point the tail at the speaker

### Text Controls

When a text overlay is selected, a control panel appears above it:

- **A- / A+**: Decrease/increase font size
- **ROT slider**: Rotate the text (-15° to +15°)
- **Tail style buttons**:
  - Triangle: Pointed speech tail
  - Circle: Thought bubble style (cloud dots)
  - Ø: No tail
- **Trash**: Delete the text overlay

---

## Page Templates

Quickly set up common panel layouts.

### Applying a Template

1. Click **"TEMPLATES"** in the header
2. Choose a layout:
   - **2×2 Grid**: Four equal panels
   - **3×3 Grid**: Nine equal panels
   - **2×3 Rows**: Six panels in 2 rows
   - **Manga (R→L)**: Right-to-left reading order
   - **Manga (L→R)**: Left-to-right manga style
   - **Single Splash**: One large panel
   - **Double Wide**: Two wide panels

Templates create new panels with pre-set positions.

---

## Canvas Navigation

### Zoom Controls

In the header toolbar:

- **NAV MODE button**: Toggle canvas navigation on/off
- **-/+**: Zoom out/in
- **Percentage**: Click to reset to 100%
- **Gutter button**: Toggle comic gutter view (light mode with grid lines)

### Navigation Mode

When Nav Mode is enabled:
- Click and drag to pan across the canvas
- Use mouse wheel to zoom
- The cursor changes to a grab hand

### Gutter View

Toggle the gutter view to see your panels against a light background with guide lines, simulating printed comic page gutters.

---

## Exporting Your Work

### Export Options

Click **"EXPORT"** in the header to see options:

**Images:**
- **ZIP Page Images**: Download all panel images from the current page as a ZIP
- **CBZ Issue**: Export the entire issue as a CBZ comic archive

**PDF:**
- **PDF Page**: Export current page panels as PDF
- **PDF Issue**: Export entire issue as PDF

### CBZ Format

CBZ is a standard comic book archive format compatible with most comic reader apps.

---

## Presentation Mode

Review your panels in a slideshow format.

### Starting Presentation

Click **"PRESENT"** in the header.

### Navigation

- **Arrow keys** or **clicking chevrons**: Move between panels
- **Spacebar**: Next panel
- **Dots at bottom**: Jump to specific panel
- **X button** or **Escape**: Exit presentation

The presentation shows each panel full-screen with its description.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Shift+Z` | Redo |
| `←` / `↑` | Previous panel |
| `→` / `↓` | Next panel |
| `Delete` | Delete selected panel |
| `Escape` | Deselect panel / Exit presentation |
| `Space` (in presentation) | Next panel |

---

## Tips and Best Practices

### Writing Effective Prompts

1. **Be specific**: Include details about lighting, angle, and composition
2. **Include action**: Describe what's happening, not just the scene
3. **Set the mood**: Words like "tense," "melancholy," or "chaotic" help guide generation
4. **Use art terminology**: "Close-up," "bird's eye view," "dramatic shadows"

**Example prompt:**
```
Close-up of Detective Maria, determined expression, rain streaming 
down her face. Neon signs reflect in her eyes. Noir lighting with 
strong rim light. She's reaching for her holstered gun.
```

### Character Consistency

1. **Fill out detailed appearance forms** for each character
2. **Use reference panels** to maintain consistency between shots
3. **Include distinguishing features** like scars, tattoos, or unique clothing
4. **Start with establishing shots** then link subsequent panels

### Organizing Your Project

1. **Use descriptive issue/chapter titles**
2. **Keep cast focused** - too many characters can complicate generation
3. **Work page by page** - complete and refine before moving on
4. **Save API keys** - they're stored per-project

### Performance Tips

1. **Large pages**: If you have many panels, consider splitting across pages
2. **Image storage**: Images are stored in browser IndexedDB; clear if needed
3. **Export regularly**: Don't rely solely on browser storage for important work

### Getting Better Results

1. **Experiment with art styles** - each gives different results
2. **Adjust consistency strength** based on scene needs
3. **Regenerate** panels that don't match your vision
4. **Upload custom images** when AI can't achieve what you want
5. **Combine styles**: Use custom prompts to mix style elements

---

## Troubleshooting

### "No API key configured"

You need to set up an API key for your chosen image provider:
1. Go to sidebar → Image Provider section
2. Enter your API key
3. Click "SET"

### Images not generating

- Check your API key is correct
- Ensure you have credits/quota with your provider
- Try a simpler prompt
- Check your internet connection

### Lost work

- Ink Tracker saves to browser storage automatically
- Don't clear browser data without exporting first
- Consider regular PDF exports as backups

### Slow performance

- Close other browser tabs
- Reduce number of panels per page
- Clear unused images from IndexedDB

---

## Support

Ink Tracker is a storyboarding tool designed for comic creators, writers, and artists. For the best experience:

1. Use a modern browser (Chrome, Firefox, Edge, Safari)
2. Ensure stable internet for AI generation
3. Keep API keys secure and don't share them

Happy creating! 🎨📚
