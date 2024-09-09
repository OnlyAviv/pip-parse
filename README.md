# pip-parse

`pip-parse` is a JavaScript library for parsing and interpreting text content typically found in Python package management files, such as `requirements.txt`. It provides utilities for handling command-line flags and package requirements, supporting both strict and lenient parsing modes.

## Features

- **Line Splitting**: Handles lines ending with a backslash to support multi-line values.
- **Command-Line Flag Parsing**: Recognizes and processes various command-line flags with associated arguments.
- **Requirement Parsing**: Parses package requirements, URLs, and paths with optional version constraints.
- **Lenient Parsing**: Configurable mode to allow more flexible parsing with less strict validation.

## Installation

To use `pip-parse`, you can include it in your project via `require` or `import` statement if you’re working in a Node.js environment.

```bash
npm install pip-parse
```

## Usage

### `parseFile(content, loose = false)`

Parses the provided content into an array of parsed data.

#### Parameters

- `content` (string): The content of text to parse.
- `loose` (boolean, optional): Whether to allow lenient parsing. Defaults to `false`. If `false`, the function will throw errors for unsupported flags, invalid URLs, or malformed requirements.

#### Returns

- An array of `ParsedData` objects representing the parsed content.

#### Example

```javascript
const { parseFile } = require('pip-parse');

const content = `
-i https://example.com/simple
mypackage==1.0.0
`;

const parsedData = parseFile(content);
console.log(parsedData);
```

### `parseLine(line, loose = false)`

Parses a single line of text to determine if it represents a command-line flag or a requirement.

#### Parameters

- `line` (string): The line of text to parse.
- `loose` (boolean, optional): Whether to allow lenient parsing. Defaults to `false`.

#### Returns

- An object representing the parsed data, or `undefined` if the line is a comment.

#### Example

```javascript
const { parseLine } = require('pip-parse');

const line = '-i https://example.com/simple';
const parsedLine = parseLine(line);
console.log(parsedLine);
```

## Data Types

### `CommandLineFlag`

- `type` (string): Always "CommandLineFlag"
- `flag` (string): The flag that was specified.
- `args` (string[]): Arguments associated with the flag.

### `Requirement`

- `type` (string): Always "Requirement"
- `markers` (string|undefined): Optional markers for the requirement.
- `subtype` (string): The type of requirement (e.g., "PackageURL", "URL", "Path", "Package").
- `package` (string|undefined): The package name, if applicable.
- `extras` (string|undefined): Optional extras associated with the package.
- `url` (string|undefined): The URL, if applicable.
- `path` (string|undefined): The path, if applicable.
- `versions` (string[]|undefined): List of version constraints, if applicable.

## Supported Options

The following command-line options are supported:

- `-i`, `--index-url`
- `--extra-index-url`
- `--no-index`
- `-c`, `--constraint`
- `-r`, `--requirement`
- `-e`, `--editable`
- `-f`, `--find-links`
- `--no-binary`
- `--only-binary`
- `--prefer-binary`
- `--require-hashes`
- `--pre`
- `--trusted-host`
- `--use-feature`

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.