export const PAGE_PATTERNS = [
    /^#{1,3}\s*PAGE\s+(\w+)/i,
    /^\*\*PAGE\s+(\w+)\*\*/i,
    /^(?:PAGE|PG)\s+(\w+)(?:\s*$|\s*\()/i,  // Matches: PAGE 14, PAGE FOURTEEN, PAGE 14 (note), PG 14 (etc.)
];
