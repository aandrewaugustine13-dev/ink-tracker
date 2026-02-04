// Check if a line is all caps (potential shot or character)
function isAllCaps(line: string): boolean {
  // Remove punctuation and check if remaining text is all uppercase
  const textOnly = line.replace(/[^
\w\s]/g, '').trim();
  return textOnly.length > 0 && textOnly === textOnly.toUpperCase();
}