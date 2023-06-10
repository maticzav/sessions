import type { Config } from 'jest'

const config: Config = {
  verbose: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '/tests/.*\\.test\\.tsx?$',
  testPathIgnorePatterns: ['/node_modules/', '/__fixtures__/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

export default config
