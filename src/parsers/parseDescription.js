/**
 * Parses given `packageContent` and returns the description of the package.
 *
 * @param {string} packageContent  Content string containing all the information about the package.
 *
 * @return {string} Package description.
 */
export default function parseDescription(packageContent) {
  const [, descriptionMatch] = packageContent.match(/Description:\s(.+\n(\s.+\n)*)/) || [];

  if (!descriptionMatch) {
    throw new Error('No Description Found');
  }

  return descriptionMatch;
}
