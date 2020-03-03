const fs = require('fs')

const parsePackage = (text, index) => {
  try {
    return {
      name: parseName(text),
      description: parseDescription(text),
      dependencies: parseDependencies(text),
      dependentPackages: []
    }
  } catch (error) {
    throw new Error(`Failed to parse entry ${index}: ${error.message}`);
  }
};

const parseName = (text) => {
  const matches = text.match(/Package:\s(.+)\n/);
  if (matches && matches[1]) {
    return matches[1];
  }
  throw new Error(`Key "Package" not found`);
};

const parseDescription = (text) => {
  const matches = text.match(/Description:\s(.+\n(\s.+\n)*)/);
  if (matches && matches[1]) {
    return matches[1];
  }
  throw new Error(`Key "Description" not found`);
}

const parseDependencies = (text) => {
  const matches = text.match(/\nDepends:\s(.+)\n/);
  if (!matches || !matches[1]) {
    // No dependencies for this package
    return [];
  }
  const dependenciesLine = matches[1];

  // 'libc6 (>= 2.2.5)' -> 'libc6'
  const parsePackageName = (packageString) => (
    packageString.split(' ').shift()
  );

  /*
   * E.g.
   * 'libc6 (>= 2.2.5), dpkg (>= 1.15.4) | install-info' ->
   * [{ main: 'libc6', alternatives: [] }, { main: 'dpkg', alternatives: ['install-info'] }]
   */
  const dependencies = dependenciesLine
    .split(', ')
    .map(string => {
      const packages = string.split(' | ');
      if (!packages || packages.length < 1) {
        throw new Error(`Invalid dependency format (${dependenciesLine})`);
      }
      const dependency = {
        main: parsePackageName(packages.shift()),
        alternatives: packages.map(parsePackageName)
      };
      return dependency;
    });

  // Filter out duplicates comparing by dependency.main
  return dependencies
    .filter((dependency, index) =>
      dependencies.findIndex(otherDependency => otherDependency.main === dependency.main) === index
    );
};


module.exports = function () {
  this.packages = {};

  this.getPackage = (name) => {
    return this.packages[name]
  }

  this.provide = () => {
    const file = fs.readFileSync('/var/lib/dpkg/status', 'UTF-8');
    const packageNames = [];

    file
      .split('\n\n')
      .forEach((block) => {
        const packageRaw = block.trim();

        if (packageRaw) {
          const parsedPackage = parsePackage(packageRaw);
          this.packages[parsedPackage.name] = parsedPackage;
          packageNames.push(parsedPackage.name);
          delete parsedPackage.name;
        }
      });

    return packageNames.sort();
  }
}
