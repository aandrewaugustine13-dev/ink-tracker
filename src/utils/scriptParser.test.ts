import { describe, it, expect } from 'vitest';
import { parseScript } from '../services/scriptParser';

describe('scriptParser (integration smoke tests)', () => {
  it('parses PAGE and PANEL and inline dialogue', () => {
    const script = `PAGE 1\nPanel 1\nALICE: Hello there`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBeGreaterThanOrEqual(1);
    const page = result.pages.find(p => p.pageNumber === 1);
    expect(page).toBeTruthy();
    expect(page!.panels.length).toBeGreaterThanOrEqual(1);
    const panel = page!.panels.find(p => p.panelNumber === 1);
    expect(panel).toBeTruthy();
    const dialogue = panel!.bubbles.find(b => b.type === 'dialogue' && b.character === 'ALICE');
    expect(dialogue).toBeTruthy();
    expect(dialogue!.text).toContain('Hello');
  });

  it('parses PAGE ONE (word) and Panel number', () => {
    const script = `PAGE ONE\nPanel 2\nBOB: Hi`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    const page = result.pages.find(p => p.pageNumber === 1);
    expect(page).toBeTruthy();
    const panel = page!.panels.find(p => p.panelNumber === 2);
    expect(panel).toBeTruthy();
    const dialogue = panel!.bubbles.find(b => b.character === 'BOB');
    expect(dialogue).toBeTruthy();
    expect(dialogue!.text).toContain('Hi');
  });

  it('parses standalone character name with indented continuation', () => {
    const script = `PAGE 3\nPanel 1\nALICE\n  This is a continued line`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    const page = result.pages.find(p => p.pageNumber === 3);
    expect(page).toBeTruthy();
    const panel = page!.panels.find(p => p.panelNumber === 1);
    expect(panel).toBeTruthy();
    const dialogue = panel!.bubbles.find(b => b.type === 'dialogue' && b.character === 'ALICE');
    expect(dialogue).toBeTruthy();
    expect(dialogue!.text).toContain('continued line');
  });
});
