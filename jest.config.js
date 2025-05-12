/** @type {import('ts-jest').JestConfigWithTsJest} **/
/** @type {import('jest').Config} **/

module.exports = {
  // Reference site: https://jestjs.io/docs/configuration
  testEnvironment: "node",
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
  transform: {
    '^.+\.tsx?$': [ "ts-jest",{} ],
  },
  collectCoverage: true,
  coverageDirectory: "./test-results/coverage",
  collectCoverageFrom: [
    '**/src/**/*.{ts,tsx}',
    '**/src/**/*.{js,jsx}',
    '**/public/**/*.{js,jsx}',
    '!**/node_modules/**'
  ],
  coverageReporters: ["html", "xml", "cobertura"],
  reporters: [
    "default",
    [
      // Reference site: https://github.com/jest-community/jest-junit/blob/master/README.md
      "jest-junit", {
        suiteName: "Jest Tests",
        outputDirectory: "./test-results/unit",
        outputName: `junit-${(new Date()).toISOString().replaceAll(':','')}.xml`,
        classNameTemplate: "{classname}-{title}",
        titleTemplate: "{classname}-{title}",
        ancestorSeparator: " › ",
        usePathForSuiteName: "true"
      }
    ]
  ]
};