const fs = require('fs');

/**
 * Marking installed by assigning their isExist field true.
 *
 * @param {string[]} dependencies Dependency names.
 * @param {{}} packages  Whole package dictionary to look for installed packages within given dependencies
 *
 * @return {{}} Mapped object containing name of the package and its install status
 */
function markInstalledDependencies(dependencies, packages) {
  if (!packages)
    throw new Error('Parameter packages must be given.');

  return dependencies ? dependencies.map(dependency => (
    {
      name: dependency,
      isInstalled: !!packages[dependency]
    }
  )) : [];
}

class DpkgStatusParser {

  /**
   * Parses given content containing information about a package.
   *
   * @param {string} packageContent  Content string containing all the information about the package.
   *
   * @return {{}} Parsed object containing only required fields related to the package.
   */
  parsePackage(packageContent) {
    if (!packageContent)
      throw new Error('Parameter packageContent must be given.');

    return {
      name: this.parseName(packageContent),
      description: this.parseDescription(packageContent),
      dependencies: this.parseDependencies(packageContent)
    }
  }

  /**
   * Parses the name of the package finding it from the given packageContent.
   *
   * @param {string} packageContent  Content string containing all the information about the package.
   *
   * @return {string} Only the name of the package
   */
  parseName(packageContent) {
    /* Returns matches of the pattern: Package:[white space][any text][newline]
    * e.g.: Package: some package\nDescription: some description
    * This would return only "some package" along with the whole line, till Description
    * First element of the array is the whole match, and second element is the grouping part
    * which is the part we are looking for: some package
    * */
    const matches = packageContent.match(/Package:\s(.+)\n/);

    if (matches && matches[1]) {
      return matches[1];
    }

    throw new Error(`No Package Name Found`);
  }

  /**
   * Parses the description of the package finding it from the given packageContent.
   *
   * @param {string} packageContent  Content string containing all the information about the package.
   *
   * @return {string} Only the description of the package.
   */
  parseDescription(packageContent) {
    const matches = packageContent.match(/Description:\s(.+\n(\s.+\n)*)/);

    if (matches && matches[1]) {
      return matches[1];
    }

    throw new Error(`No Description Found`);
  }

  /**
   * Parses the dependencies of the package finding it from the given packageContent.
   *
   * @param {string} packageContent  Content string containing all the information about the package.
   *
   * @return {[]} Dependencies of the package.
   */
  parseDependencies(packageContent) {
    const matches = packageContent.match(/\nDepends:\s(.+)\n/);

    if (!matches || !matches[1]) {
      return []; // No dependencies found for the package. Return an empty array.
    }

    const individualDependencyDelimiter = ', ';
    const alternateDependencyDelimiter = ' | ';

    const parseDependencyName = (dependencyName) => (
      dependencyName.split(' ').shift() // Ignoring version section E.g.: "package-name (version)"
    );

    const dependencyContent = matches[1];

    return dependencyContent
      .split(individualDependencyDelimiter)
      .map(dependency => {
        const alternateDependencies = dependency.split(alternateDependencyDelimiter);

        if (!alternateDependencies || alternateDependencies.length < 1) {
          throw new Error(`Dependency format is invalid -> ${dependencyContent}`);
        }

        return alternateDependencies.map(parseDependencyName);
      })
      .reduce((prev, next) => [...prev, ...next]);
  }
}

/**
 * Loads the installed packages in the OS reading "/var/lib/dpkg/status" file.
 *
 * All the information about the installed packages in the OS is stored
 * in "/var/lib/dpkg/status" file. This function is responsible for reading
 * this particular file and returning packages along with their information.
 * Returning object basically consists of the package dictionary and index
 * of the packages.
 * *
 * @return {{packages, packageNames}} Package dictionary (packages), and package index (packageNames).
 */
function loadPackages() {
  const packages = {};
  let packageNames = [];
  const parser = new DpkgStatusParser();

  const statusFile = fs.readFileSync('/var/lib/dpkg/status', 'UTF-8');

  if (!statusFile)
    throw new Error("status file does not exist.");

  statusFile
    .split('\n\n')
    .forEach((block) => {
      const packageContent = block.trim();

      if (packageContent) {
        const parsedPackage = parser.parsePackage(packageContent);
        packages[parsedPackage.name] = parsedPackage;
        packageNames.push(parsedPackage.name);
        delete parsedPackage.name;
      }
    });

  return {
    packages,
    packageNames
  };
}

/**
 * Stores the index and information of installed packages in the OS.
 *
 * This class is responsible for storing the index and the information of the installed
 * packages in the OS. The information consists of the name of the package,
 * the description of the package, and the packages that are dependent to each package.
 *
 */
class DpkgStatus {

  constructor() {
    const loadedPackages = loadPackages();

    this._packages = loadedPackages.packages;
    this._packageNames = loadedPackages.packageNames.sort();// Sort package names A-Z
  }

  /**
   * Gets the installed package of given name.
   *
   * Since all the packages are retrieved in constructor and stored in _packages property,
   * this particular function is only responsible for returning the package object lies in
   * the package dictionary object with the given name.
   *
   * @param {string} name  Name of the package installed in the OS.
   *
   * @return {{}} Basic info about the installed package in the OS.
   */
  getPackage(name) {
    if (!name)
      throw new Error('Parameter name must be given.');

    if (!this._packages[name])
      throw new Error('No package found with given name.');

    return {
      ...this._packages[name],
      dependencies: markInstalledDependencies(this._packages[name].dependencies, this._packages)
    }
  }

  /**
   * Gets the names of the installed packages in the OS.
   *
   * Since all the packages are retrieved in constructor and stored in _packages property,
   * this particular function is only responsible for returning the package object lies in
   * the package dictionary object with the given name.   *
   *
   * @return {Array<string>} Basic info about the installed package in the OS.
   */
  getPackageNames() {
    return this._packageNames;
  }
}


module.exports = {
  DpkgStatus,
  DpkgStatusParser,
  markInstalledDependencies,
  loadPackages
};
