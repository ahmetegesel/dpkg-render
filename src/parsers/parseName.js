/**
 * Parses given `packageContent` and returns the name of the package.
 *
 * @param {string} packageContent  Content string containing all the information about the package.
 *
 * @return {string} Package name
 */
export default function parseName(packageContent) {
  const [, nameMatch] = packageContent.match(/Package:\s(.+)\n/) || [];

  if (!nameMatch) {
    throw new Error('No Package Name Found');
  }

  return nameMatch;
}
