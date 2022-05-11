# clean-dest

[![GitHub](https://github.com/SeanSobey/clean-dest/workflows/Node%20CI/badge.svg)](https://github.com/SeanSobey/clean-dest/actions)

A CLI to clean a destination directory given a source directory.  This deletes files in the output folder
that don't have a corresponding file in the source folder (any more).  This helps deal with file
renames and deletions when your build tool (e.g. babel or tsc) doesn't automatically delete output
files whose input file was removed.

By default it keeps files in the output folder with the same name as files in the input folder, but 
you can configure this so that additional files are preserved by mapping a source file extension/suffix
to output file extensions/suffixes.

Designed initially with typescript in mind, but can be used with any file types.


## Install

```
$ npm install clean-dest
```

## Usage

### Folder structure

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

### Custom FileMap function


### CLI command

```
clean-dest -s ./src -d ./dist --file-map ./scripts/clean-dest
```

## CLI

### `src-root`

[Glob](https://www.npmjs.com/package/globby) pattern(s) for source files.

### `dest-root`

Destination root directory.

### `base-pattern`

[Glob](https://www.npmjs.com/package/globby) pattern(s) to delete, default is "dest-root"/**/*.  All files that
match this pattern will be deleted unless they are matched to a source file or ignored using the `ignore`
option.

### `file-map`

This identifies files in `dest-root` that should be kept based on the files present in `src-root` based
on a mapping from input file extensions to output file extensions.

The argument can either be a JS module to load for the mapping, or a mapping provided in a special format.  If
the argument matches the regular pattern `/^.[a-z]/i` it will be parsed as a mapping string, otherwise it
is treated as a module to import.

#### using a string

It can be written as a series of file suffix mappings separated with semicolons.  Each mapping has input file
extensions and output file extensions around a colon (`:`).  Multiple file extensions can be separated with
commas.  If a mapping has no colon then the input and output extensions are considered the same.

The output filename(s) are calculated by replacing a suffix found on the left by all the suffix(es) on the
right.

Examples:

- `.js,.ts:.js,.js.map,.d.ts`: For any `.js` or `.ts` file found in `src-root`, preserve matching files
  with suffixes `.js`, `.js.map`, `.d.ts` in `dest-root`
- `.js:.js,.js.map;.ts:.js,.js.map,.d.ts`: For `.js` files in `src-root`, preserve `.js` and `.js.map` files in the
  `dest-root`.  For `.ts` files, also preserve `.d.ts` files.
- `.js;.ts:.js,.js.map,.d.ts`: For `.js` files in `src-root`, preserve `.js` files in the
  `dest-root`.  For `.ts` files, preserve `.js`, `.js.map`, and `.d.ts` files.

#### using a js module

The argument can be a path to a js module that exports information about which files to keep in the output folder.
The path will be loaded using `require` by default, so if it is a local module it should use a relative path.

If the module exports a string or array of strings they will be parsed and processed as if they were
provided on the command line as a set of patterns.

If the module exports an object, the object's keys are considered a filename suffix to match.  The object's values
can be (1) strings or arrays of strings identifying replacement suffixes to use in the output folder, or 
(2) a function which takes a file path in the output folder but with the original file extension, and returns
an array of potential output files.

For example:

```js
// ./scripts/clean-dest.js
module.exports = exports = {
    // Rename the file extensions from the 'ts' from the src folder to what we expect in the dest folder
    '.ts': (destFilePath) => [
        destFilePath.replace(/.ts$/, '.d.ts'),
        destFilePath.replace(/.ts$/, '.js'),
        destFilePath.replace(/.ts$/, '.js.map'),
    ]
};
```

### `ignore`


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
