# Script Parser PAGE Pattern Fix

## Problem Statement
The last page number fix (PR #37) did not fully resolve the issue. Panels were being lost when parsing scripts, particularly when panel descriptions started with the word "Page".

## Root Cause Analysis

### Issue 1: Panel Descriptions Starting with "Page"
When a panel description began with "Page" (e.g., "Page fourteen content"), the parser incorrectly matched it as a PAGE marker due to the overly broad regex pattern:
```typescript
/^(?:PAGE|PG)\s+(\w+)/i
```

This pattern would match:
- ✅ `PAGE 14` (correct)
- ✅ `PAGE FOURTEEN` (correct)  
- ❌ `Page fourteen content` (incorrect - should be part of panel description)

When this happened:
1. Panel marker detected: "Panel 1" → sets currentPanelNumber = 1, currentPanelDescription = ""
2. Next line "Page fourteen content" → incorrectly matched as PAGE marker
3. Parser calls saveCurrentPage(), which calls saveCurrentPanel()
4. Panel 1 has no description yet, so it's not saved (empty descriptions are skipped)
5. Parser starts a new page, losing Panel 1

### Issue 2: Scripts Not Starting with PAGE 1
Scripts that started with PAGE 2 or any other page number would fail validation because no pages would be successfully parsed and saved.

## Solution

Updated the PAGE pattern regex to be more restrictive:

```typescript
// Before
/^(?:PAGE|PG)\s+(\w+)/i

// After
/^(?:PAGE|PG)\s+(\w+)(?:\s*$|\s*\()/i
```

The updated pattern requires that after the page number, there must be:
- End of line (`\s*$`), OR
- Optional whitespace followed by opening parenthesis (`\s*\(`)

This allows:
- ✅ `PAGE 14`
- ✅ `PAGE FOURTEEN`
- ✅ `PAGE 14 (5 Panels)`
- ✅ `PG 14`

But rejects:
- ❌ `Page fourteen content` (has more text after the number)
- ❌ `Page one of the story` (has more text after the number)

## Files Modified

1. **src/services/scriptParser.ts** - Main parser implementation
   - Updated PAGE_PATTERNS regex on line 98

2. **src/utils/scriptParser.ts** - Utility export for consistency
   - Updated PAGE_PATTERNS regex on line 3

3. **src/utils/scriptParser.test.ts** - Existing test suite
   - Added 3 new tests for last page edge cases

4. **src/utils/scriptParser.regression.test.ts** - New regression test suite
   - Added 5 comprehensive regression tests
   - Documents the issue and expected behavior

## Test Results

All script parser tests pass:
- ✅ 13 existing tests in scriptParser.test.ts
- ✅ 5 new regression tests in scriptParser.regression.test.ts
- ✅ Total: 18 tests passing

## Verification

Tested with comprehensive scripts including:
- Scripts starting with various page numbers (1, 2, 14, 20)
- Panel descriptions beginning with "Page"
- Multiple panels per page
- Page markers with parenthetical notes
- Last pages with various formats

## Security

- ✅ No security vulnerabilities detected by CodeQL

## Backward Compatibility

- ✅ All existing script formats continue to work
- ✅ No breaking changes to the API
- ✅ Maintains support for all documented PAGE formats

## Impact

This fix resolves the "last page number" issue by ensuring:
1. Panel descriptions starting with "Page" are correctly parsed as descriptions
2. Scripts can start with any page number, not just PAGE 1
3. All panels are preserved during parsing
4. The last page is always included in parsed results
