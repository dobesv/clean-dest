# clean-dest

[![GitHub](https://github.com/SeanSobey/clean-dest/workflows/Node%20CI/badge.svg)](https://github.com/SeanSobey/clean-dest/actions)

A CLI to clean a destination directory given a source directory.

Designed initially with typescript in mind, but can be used with any file types.

## Install

```
$ npm install clean-dest
```

## Usage

```
│
└───scripts
│   │   clean-dest.js
│
└───src
│   │   file1.ts
│   │   file2.ts
│
└───dist
│   │   file1.js
│   │   file1.js.map
│   │   file1.d.ts
│   │   file2.js
│   │   file2.js.map
│   │   file2.d.ts
```

./scripts/clean-dest.js
```js
module.exports = exports = {
    // Rename the file extensions from the 'ts' from the src folder to what we expect in the dest folder
    '.ts': (destFilePath) => [
        destFilePath.replace(/.ts$/, '.d.ts'),
        destFilePath.replace(/.ts$/, '.js'),
        destFilePath.replace(/.ts$/, '.js.map'),
    ]
};
```

```
clean-dest -s ./src -d ./dist --file-map ./scripts/clean-dest
```

## CLI

### `src-root`

[Glob](https://www.npmjs.com/package/globby) pattern(s) for source files.

### `dest-root`

Destination root directory.

### `base-pattern`

An optional starting pattern to delete, default is "dest-root"/**/*.

### `file-map`

Path to a js file whose only export is an extension to clean, or a [ext]: fn object to map source path to destination path(s).

### `permanent`

Optional permanent delete using [del](https://github.com/sindresorhus/del), otherwise uses [trash](https://github.com/sindresorhus/trash).

### `dry-run`

Optional test run to not actually delete matched files.

### `verbose`

Optional output logging.

## API

See the [API docs](https://github.com/SeanSobey/clean-dest/blob/master/API.md).

## Watch Mode

Use [nodemon](https://nodemon.io/):

```
nodemon --watch ./src -e ts --exec clean-dest -s ./src -d ./dist
```
