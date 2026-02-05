// Comprehensive debug test for the comic parser
import { parseScript } from './src/services/scriptParser';

// Test with various formats
const testCases = [
    {
        name: "Simple PAGE 1 format",
        script: `PAGE 1

Panel 1
A dark alley at night.

JOHN: Hello there.

Panel 2
Close up on face.

PAGE 2

Panel 1
Wide shot.
`
    },
    {
        name: "PAGE ONE format",
        script: `PAGE ONE

Panel 1
A dark alley at night.

JOHN: Hello there.
`
    },
    {
        name: "### PAGE format",
        script: `### PAGE 1

Panel 1
A dark alley at night.

JOHN: Hello there.
`
    },
    {
        name: "**PAGE** format",
        script: `**PAGE 1**

**Panel 1**
A dark alley at night.

JOHN: Hello there.
`
    },
    {
        name: "With CAPTION",
        script: `PAGE 1

Panel 1
A dark alley at night.

CAPTION: The city never sleeps.

JOHN: Where are we going?
`
    }
];

console.log('=== Comprehensive Parser Debug ===\n');

for (const testCase of testCases) {
    console.log(`\n--- Test: ${testCase.name} ---`);
    console.log('Input:');
    console.log(testCase.script.substring(0, 100) + '...');
    
    const result = parseScript(testCase.script);
    
    console.log('\nResult:');
    console.log('  Success:', result.success);
    console.log('  Pages:', result.pages.length);
    console.log('  Errors:', result.errors);
    
    if (result.pages.length > 0) {
        console.log('  Page details:');
        for (const page of result.pages) {
            console.log(`    Page ${page.pageNumber}: ${page.panels.length} panels`);
        }
    }
}

// Now let's manually trace through the first test case
console.log('\n\n=== Manual Line-by-Line Debug ===\n');

const debugScript = testCases[0].script;
const lines = debugScript.split('\n');

const PAGE_PATTERNS = [
    /^#{1,3}\s*PAGE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)(?:\s*\([^)]*\))?/i,
    /^\*\*PAGE\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)\*\*/i,
    /^(?:PAGE|PG)\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY|TWENTY[- ]?ONE|TWENTY[- ]?TWO|TWENTY[- ]?THREE|TWENTY[- ]?FOUR|TWENTY[- ]?FIVE|TWENTY[- ]?SIX|TWENTY[- ]?SEVEN|TWENTY[- ]?EIGHT|\d+)(?:\s*[:\-\.])?/i,
];

const PANEL_PATTERNS = [
    /^\*\*Panel\s+(\d+)(?:\s*\(([^)]+)\))?\*\*\s*(.*)/i,
    /^\*\*Panel\s+(\d+)\*\*(?:\s*\(([^)]+)\))?\s*(.*)/i,
    /^Panel\s+(\d+)(?:\s*[\[\(]([^\]\)]+)[\]\)])?\s*(.*)/i,
    /^(?:PANEL|P|FRAME|FR|BLOCK)\s*(\d+)\s*(?:\[([^\]]+)]|\(([^)]+)\))?(?:\s*[:\-\.])?\s*(.*)/i,
];

// Check for problematic patterns
const ISSUE_HEADER = /^#\s+(.+)$/;
const pagesPattern = /^\d+\s+Pages?\s*$/i;

console.log('Checking each line for early exits:\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
        console.log(`Line ${i}: [EMPTY]`);
        continue;
    }
    
    // Check each condition that could cause early exit
    if (line === '---' || line === '***') {
        console.log(`Line ${i}: "${line}" -> SKIP (separator)`);
        continue;
    }
    
    if (ISSUE_HEADER.test(line)) {
        console.log(`Line ${i}: "${line}" -> ISSUE_HEADER match`);
        continue;
    }
    
    if (pagesPattern.test(line)) {
        console.log(`Line ${i}: "${line}" -> PAGES PATTERN match (like "5 Pages")`);
        continue;
    }
    
    // Check page patterns
    let isPage = false;
    for (let p = 0; p < PAGE_PATTERNS.length; p++) {
        if (PAGE_PATTERNS[p].test(line)) {
            console.log(`Line ${i}: "${line}" -> PAGE_PATTERN[${p}] ✓`);
            isPage = true;
            break;
        }
    }
    if (isPage) continue;
    
    // Check panel patterns
    let isPanel = false;
    for (let p = 0; p < PANEL_PATTERNS.length; p++) {
        if (PANEL_PATTERNS[p].test(line)) {
            console.log(`Line ${i}: "${line}" -> PANEL_PATTERN[${p}] ✓`);
            isPanel = true;
            break;
        }
    }
    if (isPanel) continue;
    
    console.log(`Line ${i}: "${line}" -> (content)`);
}
