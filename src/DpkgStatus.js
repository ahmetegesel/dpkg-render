import fs from 'fs';

import FileCacheStorage from './FileCacheStorage';
import { parseDependencies, parseDescription, parseName } from './parsers';

/**
 * A Dictionary object that holds basic information about packages that are installed on the OS.
 *
 * Keys of this dictionary represent the name of the packages and the values are the basic
 * information about these packages.
 *
 * @typedef {{[packageName]: { name: string, description: string, dependencies: Array<string>}}} Packages
 * */

/**
 * Loads the installed packages on the OS by reading "/var/lib/dpkg/status" file.
 *
 * All the information about the installed packages on the OS is stored
 * in "/var/lib/dpkg/status" file. This function is responsible for reading
 * this particular file and returning packages along with their information.
 * Returning object basically consists of the package dictionary and index
 * of the packages.
 *
 * @helper
 * @function
 * @return {{packages, packageNames}} Package dictionary (packages), and package index (packageNames).
 */
export function loadPackages(path) {
  const packageNames = [];

  const statusFile = fs.readFileSync(path, 'UTF-8');

  if (!statusFile) {
    throw new Error('status file does not exist.');
  }

  const dependedIndex = {};

  const packages = statusFile
    .split('\n\n')
    .reduce((acc, packageBlock) => {
      if (!packageBlock) {
        return acc;
      }

      const parsedPackage = {
        name: parseName(packageBlock),
        description: parseDescription(packageBlock),
        dependencies: parseDependencies(packageBlock),
      };
      acc[parsedPackage.name] = parsedPackage;

      // indexing package names
      packageNames.push(parsedPackage.name);

      // indexing packages that depends on this package
      parsedPackage.dependencies.forEach((dep) => {
        dependedIndex[dep] = (dependedIndex[dep] || []).concat(parsedPackage.name);
      });

      return acc;
    }, {});

  return {
    packages,
    packageNames: packageNames.sort(),
    dependedIndex,
  };
}

/**
 * Marking installed packages by assigning their isInstalled field to true.
 *
 * @helper
 * @function
 * @param {Array<string>} dependencies Dependencies.
 * @param {Packages} packages  Whole package dictionary to look for installed packages within given dependencies
 *
 * @return {Array<{name: string, isInstalled: boolean}>} Mapped object containing name of the package and its install status
 */
export function markInstalledDependencies(dependencies, packages) {
  if (!packages) throw new Error('Parameter packages must be given.');

  return dependencies ? dependencies.map((dependency) => (
    {
      name: dependency,
      isInstalled: !!packages[dependency],
    }
  )) : [];
}

/**
 * Stores the index and information of packages that are installed on the OS.
 *
 * This class is responsible for storing the index and the information of the
 * packages that are installed on the OS. The information consists of the name of the package,
 * the description of the package, the packages that this package depends on,
 * and the packages that depend on this package.
 *
 * @class
 */
export default class DpkgStatus {
  #cacheStorage;

  #packages;

  #packageNames;

  #dependedIndex;

  constructor() {
    const path = process.env.APP_DPKG_FILE_PATH;

    this.#cacheStorage = new FileCacheStorage({
      path,
      getter: () => loadPackages(path),
    });
  }

  /**
   * Synchronizes packages and packageNames.
   *
   * If dpkg/status file is not updated after last time it is loaded,
   * then it returns the cached result, otherwise it reloads the packages.
   *
   * @function
   * */
  sync() {
    const { packages, packageNames, dependedIndex } = this.#cacheStorage.get();

    this.#packages = packages;
    this.#packageNames = packageNames;
    this.#dependedIndex = dependedIndex;
  }

  /**
   * Gets the package with given name.
   *
   * @function
   * @param {string} name  Name of the package.
   * @return {{
   *  name: string,
   *  description: string,
   *  dependencies: Array<{ name: string, isInstalled: boolean}>,
   *  dependedOnBy: Array<{ name: string, isInstalled: boolean}>}} Basic info about the package.
   */
  getPackage(name) {
    if (!name) throw new Error('Parameter name must be given.');

    this.sync();

    if (!this.#packages[name]) throw new Error('No package found with given name.');

    return {
      ...this.#packages[name],
      dependencies: markInstalledDependencies(this.#packages[name].dependencies, this.#packages),
      dependedOnBy: markInstalledDependencies(this.#dependedIndex[name], this.#packages),
    };
  }

  /**
   * Gets the names of the packages installed on the OS.
   *
   * @function
   * @return {Array<string>} Basic info about the installed package in the OS.
   */
  getPackageNames() {
    this.sync();

    return this.#packageNames;
  }
}
