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

  const packages = statusFile
    .split('\n\n')
    .reduce((acc, packageBlock) => {
      const packageContent = packageBlock.trim();

      if (!packageContent) {
        return acc;
      }

      const parsedPackage = {
        name: parseName(packageContent),
        description: parseDescription(packageContent),
        dependencies: parseDependencies(packageContent),
      };
      acc[parsedPackage.name] = parsedPackage;
      packageNames.push(parsedPackage.name);

      return acc;
    }, {});

  return {
    packages,
    packageNames: packageNames.sort(),
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
 * the description of the package, and the packages that are dependent to each package.
 *
 * @class
 */
export default class DpkgStatus {
  #cacheStorage;

  #packages;

  #packageNames;

  constructor() {
    this.#cacheStorage = new FileCacheStorage({
      path: process.env.APP_DPKG_FILE_PATH,
      getter: () => loadPackages(process.env.APP_DPKG_FILE_PATH),
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
    const { packages, packageNames } = this.#cacheStorage.get();

    this.#packages = packages;
    this.#packageNames = packageNames;
  }

  /**
   * Gets the package with given name.
   *
   * @function
   * @param {string} name  Name of the package.
   * @return {{name: string, description: string, dependencies: Array<{ name: string, isInstalled: boolean}>}} Basic info about the package.
   */
  getPackage(name) {
    if (!name) throw new Error('Parameter name must be given.');

    this.sync();

    if (!this.#packages[name]) throw new Error('No package found with given name.');

    return {
      ...this.#packages[name],
      dependencies: markInstalledDependencies(this.#packages[name].dependencies, this.#packages),
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
