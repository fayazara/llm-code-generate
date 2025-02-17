import { promises as fs } from 'fs';
import path from 'path';

const SKIP_EXTENSIONS = [
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.webp',
  '.bmp',
  '.tiff',
  '.ttf',
  '.woff',
  '.woff2',
  '.eot',
  '.otf',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
];

const ignorePatterns = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'Gemfile',
  'Gemfile.lock',
  'requirements.txt',
  'requirements.lock',
  'Gemfile',
  'Gemfile.lock',
  'requirements.txt',
  'requirements.lock',
  'Gemfile',
  'Gemfile.lock',
  'requirements.txt',
  'requirements.lock',
];

async function getDirectoryTree(dir, indent = '', ignorePatterns = []) {
  let result = '';
  const items = await fs.readdir(dir);

  for (const item of items) {
    // Skip dot files
    if (item.startsWith('.')) continue;

    const fullPath = path.join(dir, item);
    const relativePath = path.relative(process.cwd(), fullPath);
    const stats = await fs.stat(fullPath);

    // Check if this path should be ignored
    const shouldIgnore = ignorePatterns.some((pattern) =>
      relativePath.includes(pattern)
    );

    if (stats.isDirectory()) {
      // Always show the directory name
      result += `${indent}📁 ${item}/`;

      // Only add newline and process children if not ignored
      if (shouldIgnore) {
        result += ' (contents excluded)\n';
      } else {
        result += '\n';
        result += await getDirectoryTree(
          fullPath,
          indent + '  ',
          ignorePatterns
        );
      }
    } else {
      // Skip files that match ignore patterns or have skip extensions
      if (
        !shouldIgnore &&
        !SKIP_EXTENSIONS.includes(path.extname(item).toLowerCase())
      ) {
        result += `${indent}📄 ${item}\n`;
      }
    }
  }

  return result;
}

async function processDirectory(dir, ignorePatterns = []) {
  let markdown = '';
  const projectName = path.basename(process.cwd());

  // Add project name
  markdown += `# Project name: ${projectName}\n\n`;

  // Add folder structure
  markdown += '## Folder Structure\n\n```\n';
  markdown += await getDirectoryTree(dir, '', ignorePatterns);
  markdown += '```\n\n';

  // Process all files
  async function processFiles(currentDir) {
    const items = await fs.readdir(currentDir);

    for (const item of items) {
      // Skip dot files
      if (item.startsWith('.')) continue;

      const fullPath = path.join(currentDir, item);
      const stats = await fs.stat(fullPath);
      const fileExtension = path.extname(item).toLowerCase();
      const fileType = fileExtension.replace('.', '');
      // Check if path should be ignored
      const relativePath = path.relative(dir, fullPath);
      if (ignorePatterns.some((pattern) => relativePath.includes(pattern))) {
        continue;
      }

      if (stats.isDirectory()) {
        await processFiles(fullPath);
      } else {
        if (SKIP_EXTENSIONS.includes(fileExtension)) {
          continue;
        }

        try {
          const content = await fs.readFile(fullPath, 'utf8');
          markdown += `---\n### filename: ${relativePath}\n\`\`\`${fileType}\n${content}\n\`\`\`\n`;
        } catch (error) {
          markdown += `---\n### filename: ${relativePath}\n*Error reading file: ${error.message}*\n`;
        }
      }
    }
  }

  await processFiles(dir);
  return markdown;
}

async function main() {
  const projectDir = process.cwd();
  try {
    const markdown = await processDirectory(projectDir, ignorePatterns);
    await fs.writeFile('project-documentation.md', markdown);
    console.log(
      'Documentation generated successfully: project-documentation.md'
    );
  } catch (error) {
    console.error('Error generating documentation:', error);
  }
}

main();
