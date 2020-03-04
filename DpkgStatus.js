const fs = require('fs')


const parsePackage = (text) => {
  return {
    name: parseName(text),
    description: parseDescription(text),
    dependencies: parseDependencies(text)
  }
};

const parseName = (text) => {
  // Returns matches of the pattern Package:[white space][any text][newline]
  // e.g.: Package: some package \n Description: some description
  // This would return only some package along with the whole line, till Description
  // First element of the array is the whole match, and second element is the grouping part
  // which is the part we are looking for: some package
  const matches = text.match(/Package:\s(.+)\n/);

  if (matches && matches[1]) {
    return matches[1];
  }

  throw new Error(`No Package Name Found`);
};

const parseDescription = (text) => {
  const matches = text.match(/Description:\s(.+\n(\s.+\n)*)/);

  if (matches && matches[1]) {
    return matches[1];
  }

  throw new Error(`No Description Found`);
}

const parseDependencies = (text) => {
  const matches = text.match(/\nDepends:\s(.+)\n/);

  if (!matches || !matches[1]) {
    // No dependencies found for the package. Return an empty array.
    return [];
  }

  const dependencyText = matches[1];

  const parsePackageName = (packageString) => (
    // Ignoring version section E.g.: "package-name (version)"
    packageString.split(' ').shift()
  );

  return dependencyText
    .split(', ')
    .map(string => {
      const packages = string.split(' | ');

      if (!packages || packages.length < 1) {
        throw new Error(`Dependency format is invalid -> ${dependencyText}`);
      }

      return packages.map(parsePackageName);
    })
    .reduce((prev, next) => [...prev, ...next]);
};

const markInstalledDependencies = (dependencies, packages) => {
  return dependencies ? dependencies.map(dependency => (
    {
      name: dependency,
      isInstalled: !!packages[dependency]
    }
  )) : [];
}

const DpkgStatus = function () {
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

          // DEBUG
          parsedPackage.raw = packageRaw;
        }
      });

    packageNames = packageNames.sort();
  };

  this.getPackage = (name) => {
    return {
      ...packages[name],
      dependencies: markInstalledDependencies(packages[name].dependencies, packages)
    }
  }

  this.getPackageNames = () => {
    return packageNames;
  }

  loadPackages();
};


module.exports = DpkgStatus
