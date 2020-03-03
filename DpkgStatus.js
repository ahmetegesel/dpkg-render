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

  const parsePackageName = (packageString) => (
    packageString.split(' ').shift()
  );

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
  const packages = {};
  let packageNames = [];

  const loadPackages = () => {
    const file = fs.readFileSync('/var/lib/dpkg/status', 'UTF-8');

    file
      .split('\n\n')
      .forEach((block) => {
        const packageRaw = block.trim();

        if (packageRaw) {
          const parsedPackage = parsePackage(packageRaw);
          packages[parsedPackage.name] = parsedPackage;
          packageNames.push(parsedPackage.name);
          delete parsedPackage.name;
        }
      });

    packageNames = packageNames.sort();
  }

  this.getPackage = (name) => {
    return packages[name]
  }

  this.getPackages = () => {
    return packages;
  }

  this.getPackageNames = () => {
    return packageNames;
  }

  loadPackages();
}
