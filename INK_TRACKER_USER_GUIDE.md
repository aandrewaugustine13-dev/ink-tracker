# Ink Tracker - How to Use

Ink Tracker is a storyboard and comic layout tool that helps you turn scripts into panels, generate or import art, and export pages or full issues.

## Quick Start (5 minutes)

1. Open the Archive (folder icon) to create or select a project.
2. In the sidebar, choose Issue or Chapter mode and add an issue/chapter if needed.
3. Add a page, then click ADD FRAME to create panels.
4. Pick an image provider and set your API key.
5. Choose an art style (or set a custom style prompt).
6. Add characters in the CAST list or in the Character Bank.
7. Enter panel prompts and click Generate (or use AUTO-INK for the whole page).

## Projects and Story Structure

### Project Hub (Archive)
- Open the Archive from the sidebar to switch projects or create a new one.
- Each project tracks its own image provider, API key, art style, and cast.
- Use the delete icon to remove a project.

### Issues/Chapters and Pages
- Toggle Issue or Chapter mode in the sidebar.
- Add new issues/chapters and pages from the sidebar list.
- Click a page to load its panels on the canvas.

## Script Import

1. Click Import Script in the sidebar.
2. Paste text or upload a .txt/.md file.
3. Click Parse Script to validate the format.
4. If the parse looks good, import to generate pages, panels, and a character list.
5. After import, use the SCRIPT button to open a side panel with the original script.

### Supported formatting (examples)
```
# MY GRAPHIC NOVEL
## Issue #1: "The Beginning"

### PAGE ONE (5 Panels)
**Panel 1**
Wide establishing shot of the city at dusk.

> CAPTION: Two hours earlier.

**Panel 2 (Split Panel)**
Detective Jack lights a cigarette.

> JACK: This city never sleeps.
> JACK (thought): Neither do I.
```

Notes:
- Pages can be labeled as PAGE ONE, PAGE 1, or ### PAGE ONE.
- Panels can be labeled as Panel 1 or **Panel 1** (with optional modifiers).
- Dialogue supports blockquotes, bold speaker names, and screenplay-style indentation.
- Captions, SFX, and screen text are detected and imported as text elements.

## Canvas Basics

### Add and arrange frames
- Click ADD FRAME to create a panel.
- Drag a panel using the move handle to reposition it on the canvas.
- Resize a panel with the bottom-right corner handle.
- Use TEMPLATES to apply common layouts (2x2, 3x3, manga, splash, etc.).

### Navigation and gutters
- Use NAV MODE to pan and zoom the canvas.
- Toggle gutters to switch between a dark grid and a light comic layout.

## Panel Editing

### Prompts and characters
- Write a prompt in the panel description box.
- Select characters for the panel to include their appearance in the prompt.

### Aspect ratio
- Use the aspect ratio menu in the panel header to switch between Wide, Standard, Square, Tall, or Portrait.

### Reference panels (visual consistency)
- Link a panel to another panel with an existing image.
- Adjust the consistency slider to control how closely the new image matches the reference.

### Copy and paste settings
- Copy a panel's aspect ratio and character list.
- Paste those settings into another panel.

### Image generation and uploads
- Click Generate on a panel to create a single image.
- Click AUTO-INK to generate images for all panels on the page that have prompts.
- Use the panel toolbar to regenerate, upload, or clear an image.
- Uploads must be image files under 10MB.

## Text Bubbles and Captions

When a panel has an image, hover to add:
- Dialogue bubbles
- Thought bubbles
- Caption boxes
- Phone/text messages

Editing tips:
- Click inside a bubble to edit text.
- Drag the bubble to move it.
- When focused, drag the tail handle to reposition the tail.
- Use the mini toolbar to change font size, rotation, tail style, or delete.

## Read-Through (Presentation Mode)

- Click PRESENT to view panels as a slideshow.
- Use arrow keys or Space to advance.
- Press Escape to exit.

## Export

Use the EXPORT menu in the header:
- ZIP Page Images: exports all panel images from the current page.
- CBZ Issue: exports all panels across the issue as a .cbz file.
- PDF Page: exports each panel from the page as a PDF document.
- PDF Issue: exports all issue panels as a single PDF.

Only panels with images are exported.

## Keyboard Shortcuts

- Undo: Ctrl/Cmd+Z
- Redo: Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y
- Select next/previous panel: Arrow keys
- Delete selected panel: Delete
- Exit selection or read-through: Escape

## Data and Storage

- Projects are saved in browser localStorage.
- Images are cached in IndexedDB.
- API keys are stored locally in your browser.
- Export regularly to avoid data loss.
