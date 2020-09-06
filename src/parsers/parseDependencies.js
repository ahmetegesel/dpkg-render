/**
 * Parses given `packageContent` and returns the dependencies of the package.
 *
 * @function
 * @param {string} packageContent  Content string containing all the information about the package.
 *
 * @return {Array<string>} Dependencies of the package.
 */
export default function parseDependencies(packageContent) {
  // Gets the Depends part
  const [, depends] = packageContent.match(/\nDepends:\s(.+)\n/) || [];

  if (!depends) {
    return [];
  }

  // Collects all packages along with their other info like version and such
  const dependencies = depends.split(/\s?(?:[(][^)]*[)]|[|]|,)[,\s|]?\s?/g) || [];

  return [...new Set(dependencies)];
}
