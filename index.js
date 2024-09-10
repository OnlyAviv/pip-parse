const splitLines = require('split-with-continuation');

/**
 * 
 * @param {string} content - The content of text to parse.
 * @param {boolean} [loose=false] - Whether to allow lenient parsing. If `false`, the function 
 *   will throw errors for unsupported flags, invalid URLs, or malformed requirements.
 * @returns {ParsedData[]} An array of the object representing the parsed data.
 */
function parseFile(content, loose = false) {
    return splitLines(content)
        .map(line => line && parseLine(line, loose))
        .filter(Boolean);
}

const SUPPORTED_OPTIONS = new Map([
    ['-i', 1], ['--index-url', 1], ['--extra-index-url', 1], ['--no-index', 0],
    ['-c', 1], ['--constraint', 1], ['-r', 1], ['--requirement', 1],
    ['-e', 1], ['--editable', 1], ['-f', 1], ['--find-links', 1],
    ['--no-binary', 1], ['--only-binary', 1], ['--prefer-binary', 0],
    ['--require-hashes', 0], ['--pre', 0], ['--trusted-host', 1],
    ['--use-feature', 1]
]);

const PACKAGE_REGEX = /(?<name>[a-zA-Z_\-.]+)(?:\s*\[(?<extras>[^\]]*)\])?/;
const REQUIREMENT_REGEX = /^(?<name>[a-zA-Z_\-.]+)(?:\s*\[(?<extras>[^\]]*)\])?(?:\s*(?<version>(?:==|~=|!=|<=?|>=?)[^;]*))?/;

/**
 * @typedef {Object} CommandLineFlag
 * @property {string} type - Always "CommandLineFlag".
 * @property {string} flag - The flag that was specified.
 * @property {string[]} args - Arguments associated with the flag.
 * 
 * @typedef {Object} Requirement
 * @property {string} type - Always "Requirement".
 * @property {string|undefined} markers - Optional markers for the requirement.
 * @property {string} subtype - The type of requirement, such as "PackageURL", "URL", "Path", or "Package".
 * @property {string|undefined} package - The package name, if applicable.
 * @property {string|undefined} extras - Optional extras associated with the package.
 * @property {string|undefined} url - The URL, if applicable.
 * @property {string|undefined} path - The path, if applicable.
 * @property {string[]|undefined} versions - List of version constraints, if applicable.
 * 
 * @typedef {CommandLineFlag|Requirement} ParsedData
 */

/**
 * Parses a single line of text to determine if it represents a command-line flag or a requirement.
 * 
 * Lines starting with a dash (`-`) are interpreted as command-line flags. Lines starting with 
 * a non-dash character are treated as requirements, which can include package names, URLs, 
 * or paths, with optional version constraints and additional information.
 * 
 * @param {string} line - The line of text to parse.
 * @param {boolean} [loose=false] - Whether to allow lenient parsing. If `false`, the function 
 *   will throw errors for unsupported flags, invalid URLs, or malformed requirements.
 * @returns {ParsedData|undefined} - An object representing the parsed data, or `undefined` if 
 *   the line is a comment. The object structure depends on the type of line parsed:
 * 
 *   For command-line flags:
 *   - `type` (string): Always "CommandLineFlag"
 *   - `flag` (string): The flag specified
 *   - `args` (string[]): Arguments associated with the flag
 * 
 *   For requirements:
 *   - `type` (string): Always "Requirement"
 *   - `markers` (string|undefined): Optional markers for the requirement
 *   - `subtype` (string): The type of requirement, such as "PackageURL", "URL", "Path", or "Package"
 *   - `package` (string|undefined): The package name, if applicable
 *   - `extras` (string|undefined): Optional extras associated with the package
 *   - `url` (string|undefined): The URL, if applicable
 *   - `path` (string|undefined): The path, if applicable
 *   - `versions` (string[]|undefined): List of version constraints, if applicable
 * 
 * @throws {Error} Throws an error if the line contains an unsupported flag, invalid URL, 
 *   or malformed requirement when `loose` is `false`.
 */
function parseLine(line, loose = false) {
    if (line.startsWith('#')) return; // Skip comments

    if (line.startsWith('-')) {
        const [flag, ...args] = line.split(' ');
        const numValues = SUPPORTED_OPTIONS.get(flag);

        if (!loose) {
            if (numValues === undefined) throw new Error(`Unsupported Flag: ${flag}`);
            if (numValues !== args.length) throw new Error(`Invalid Flag Options: ${args.join(', ')}`);
        }

        return { type: "CommandLineFlag", flag, args };
    } else {
        const [pkg, ...markers] = line.split(';').map(v => v.trim());
        if (!loose && markers.length > 1) throw new Error("Too many markers");

        const result = { type: 'Requirement', markers: markers[0] || undefined };
        const [name, url] = pkg.split('@').map(v => v.trim());

        if (url) {
            if (!loose && !URL.canParse(url)) throw new Error("Invalid URL");

            const match = PACKAGE_REGEX.exec(pkg);
            if (!match && !loose) throw new Error("Invalid requirement");

            return {
                ...result,
                subtype: 'PackageURL',
                package: match?.groups.name,
                extras: match?.groups.extras,
                url
            };
        }

        if (URL.canParse(name)) {
            return { ...result, subtype: 'URL', url: name };
        }

        if (name.endsWith('.whl') && (name[0] === '.' || name[0] === '/')) {
            return { ...result, subtype: 'Path', path: name };
        }

        const match = REQUIREMENT_REGEX.exec(pkg);
        if (!match && !loose) throw new Error("Invalid requirement");

        return {
            ...result,
            subtype: 'Package',
            package: match?.groups.name,
            extras: match?.groups.extras,
            versions: match?.groups.version?.split(',').map(v => v.trim())
        };
    }
}

module.exports = {
    parseFile,
    parseLine,
    /**
     * Supported command-line options.
     * @type {string[]}
     */
    SUPPORTED_OPTIONS: Array.from(SUPPORTED_OPTIONS.keys())
};
