import { describe, it, expect } from 'vitest';
import { parseScript } from '../services/scriptParser';

/**
 * Regression tests for the PAGE pattern fix.
 * 
 * Issue: Panel descriptions starting with "Page" were being mistakenly matched
 * as PAGE markers, causing panels to be lost during parsing.
 * 
 * Root cause: The regex /^(?:PAGE|PG)\s+(\w+)/i was too broad
 * Fix: Changed to /^(?:PAGE|PG)\s+(\w+)(?:\s*$|\s*\()/i
 */
describe('PAGE pattern regression tests', () => {
  it('does not match panel descriptions starting with "Page"', () => {
    const script = `PAGE 14
Panel 1
Page fourteen content goes here

Panel 2
More content for the second panel`;
    
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(1);
    
    const page14 = result.pages[0];
    expect(page14.pageNumber).toBe(14);
    expect(page14.panels.length).toBe(2);
    
    // Verify Panel 1 is present with correct description
    const panel1 = page14.panels.find(p => p.panelNumber === 1);
    expect(panel1).toBeTruthy();
    expect(panel1!.description).toBe('Page fourteen content goes here');
    
    // Verify Panel 2 is present
    const panel2 = page14.panels.find(p => p.panelNumber === 2);
    expect(panel2).toBeTruthy();
    expect(panel2!.description).toBe('More content for the second panel');
  });

  it('correctly parses multiple pages with "Page" in descriptions', () => {
    const script = `PAGE 1
Panel 1
Page one begins the story

PAGE 14
Panel 1
Page fourteen is the middle

Panel 2
Page content continues

PAGE 20
Panel 1
Page twenty is the last page`;
    
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(3);
    
    // Verify all pages are present
    expect(result.pages.map(p => p.pageNumber)).toEqual([1, 14, 20]);
    
    // Verify Page 14 has both panels
    const page14 = result.pages.find(p => p.pageNumber === 14);
    expect(page14!.panels.length).toBe(2);
  });

  it('allows scripts to start with any page number', () => {
    const script = `PAGE 14
Panel 1
Starting at page fourteen

PAGE 15
Panel 1
Next page`;
    
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(2);
    expect(result.pages.map(p => p.pageNumber)).toEqual([14, 15]);
  });

  it('still matches valid PAGE markers with parenthetical notes', () => {
    const script = `PAGE 14 (5 Panels)
Panel 1
Content here

PAGE 15 (Important scene)
Panel 1
More content`;
    
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(2);
    expect(result.pages.map(p => p.pageNumber)).toEqual([14, 15]);
  });

  it('handles edge case with "Page" at various positions', () => {
    const script = `PAGE 1
Panel 1
This is page one of the story

Panel 2
The page continues with action
Page breaks are important

PAGE 2
Panel 1
Another page begins`;
    
    const result = parseScript(script);
    expect(result.success).toBe(true);
    expect(result.pages.length).toBe(2);
    
    const page1 = result.pages[0];
    expect(page1.panels.length).toBe(2);
    
    // Verify Panel 2 includes all its description
    const panel2 = page1.panels.find(p => p.panelNumber === 2);
    expect(panel2!.description).toContain('page continues');
    expect(panel2!.description).toContain('Page breaks');
  });
});
