import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['.git', 'node_modules', '.workingTree']);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const files = walk(root);
const relativeFiles = new Set(files.map(file => path.relative(root, file).split(path.sep).join('/')));
const htmlFiles = files.filter(file => file.endsWith('.html'));

function localReferences(html) {
  return [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map(match => match[1]).filter((reference) => {
    return reference && !reference.startsWith('#') && !reference.startsWith('//') && !/^[a-z][a-z\d+.-]*:/i.test(reference);
  });
}

test('all local HTML links and assets resolve with deployment-safe case', () => {
  const failures = [];
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    for (const reference of localReferences(html)) {
      let clean = reference.split(/[?#]/, 1)[0];
      try { clean = decodeURIComponent(clean); } catch { /* report the literal path below */ }
      let target = clean.startsWith('/') ? path.join(root, clean.slice(1)) : path.resolve(path.dirname(htmlFile), clean);
      if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      const relativeTarget = path.relative(root, target).split(path.sep).join('/');
      if (relativeTarget.startsWith('../') || !relativeFiles.has(relativeTarget)) {
        failures.push(`${path.relative(root, htmlFile)} -> ${reference}`);
      }
    }
  }
  expect(failures).toEqual([]);
});

test('public portfolio routes have basic document and keyboard-navigation structure', () => {
  const publicRoutes = [
    'index.html', 'projects.html', 'research.html', 'about.html', 'contact.html',
    'Projects/DataStructuresVisualizer/index.html',
    'Projects/DataStructuresVisualizer/linear-structures.html',
    'Projects/DataStructuresVisualizer/tree-structures.html',
    'Projects/DataStructuresVisualizer/hash-tables.html',
    'Projects/DataStructuresVisualizer/graph-structures.html',
    'Projects/DataStructuresVisualizer/sorting-algorithms.html',
    'Projects/HeapVis/index.html', 'Projects/Sudoku/index.html'
  ];
  for (const route of publicRoutes) {
    const html = fs.readFileSync(path.join(root, route), 'utf8');
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toMatch(/<html[^>]+lang="en"/i);
    expect(html).toMatch(/<meta[^>]+name="viewport"/i);
    expect(html).toMatch(/<title>[^<]+<\/title>/i);
    expect(html).toMatch(/class="skip-link"/i);
    expect(html).toMatch(/<main[^>]+id="main"|<main id="main"/i);
  }
});

test('HTML contains no editor artifacts, placeholder projects, or stale one-page anchors', () => {
  const failures = [];
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    if (/<\/content>|<parameter\s+name="filePath"/i.test(html)) failures.push(`${path.relative(root, htmlFile)}: editor artifact`);
    if (/index\.html#(?:profile|projects|contact|research|education|repositories)/i.test(html)) failures.push(`${path.relative(root, htmlFile)}: stale anchor`);
  }
  expect(failures).toEqual([]);
});
