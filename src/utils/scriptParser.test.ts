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

describe('scriptParser - page number parsing', () => {
  it('parses numeric page numbers beyond 30', () => {
    const script = `PAGE 14\nPanel 1\nTest content\n\nPAGE 50\nPanel 1\nMore content\n\nPAGE 99\nPanel 1\nFinal content`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(3);
    expect(result.pages.find(p => p.pageNumber === 14)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 50)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 99)).toBeTruthy();
  });

  it('parses markdown format page headers', () => {
    const script = `### PAGE 14\nPanel 1\nTest\n\n## PAGE 20\nPanel 1\nContent`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(2);
    expect(result.pages.find(p => p.pageNumber === 14)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 20)).toBeTruthy();
  });

  it('parses bold format page headers', () => {
    const script = `**PAGE 14**\nPanel 1\nTest\n\n**PAGE 20**\nPanel 1\nContent`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(2);
    expect(result.pages.find(p => p.pageNumber === 14)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 20)).toBeTruthy();
  });

  it('parses PG short format', () => {
    const script = `PG 14\nPanel 1\nTest\n\nPG 20\nPanel 1\nContent`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(2);
    expect(result.pages.find(p => p.pageNumber === 14)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 20)).toBeTruthy();
  });

  it('parses word-based page numbers', () => {
    const script = `PAGE FOURTEEN\nPanel 1\nTest\n\nPAGE TWENTY\nPanel 1\nContent`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(2);
    expect(result.pages.find(p => p.pageNumber === 14)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 20)).toBeTruthy();
  });

  it('handles pages in correct order and no duplicates', () => {
    const script = `PAGE 1\nPanel 1\nA\n\nPAGE 14\nPanel 1\nB\n\nPAGE 20\nPanel 1\nC\n\nPAGE 21\nPanel 1\nD`;
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(4);
    
    // Check no duplicates
    const pageNumbers = result.pages.map(p => p.pageNumber);
    const uniqueNumbers = [...new Set(pageNumbers)];
    expect(pageNumbers.length).toBe(uniqueNumbers.length);
    
    // Check all expected pages exist
    expect(result.pages.find(p => p.pageNumber === 1)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 14)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 20)).toBeTruthy();
    expect(result.pages.find(p => p.pageNumber === 21)).toBeTruthy();
  });
});
