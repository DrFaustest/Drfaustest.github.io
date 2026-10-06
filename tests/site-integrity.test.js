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
    'index.html', 'projects.html', 'research.html', 'about.html', 'resume.html', 'contact.html',
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

test('primary portfolio emphasizes research and selected work instead of the learning lab', () => {
  const primaryRoutes = ['index.html', 'projects.html', 'research.html', 'about.html', 'resume.html', 'contact.html'];

  for (const route of primaryRoutes) {
    const html = fs.readFileSync(path.join(root, route), 'utf8');
    const nav = html.match(/<nav class="site-nav"[\s\S]*?<\/nav>/i)?.[0] ?? '';
    expect(nav).not.toMatch(/Learning Lab|DataStructuresVisualizer/i);
  }

  const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  expect(home).toMatch(/M\.S\. final semester/i);
  expect(home).toMatch(/Ph\.D\. first semester/i);
  expect(home).toMatch(/First-author manuscript submitted/i);

  const work = fs.readFileSync(path.join(root, 'projects.html'), 'utf8');
  expect(work).toMatch(/Auditable knowledge tracing/i);
  expect(work).toMatch(/Evidence-to-action framework/i);
  expect(work).toMatch(/Credential renewal tracking/i);
  expect(work).not.toMatch(/data-project-filter|Data Structures Learning Lab/i);

  const contact = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  expect(contact).not.toMatch(/No résumé attachment/i);
});

test('primary routes include complete social preview metadata', () => {
  const primaryRoutes = ['index.html', 'projects.html', 'research.html', 'about.html', 'resume.html', 'contact.html'];

  for (const route of primaryRoutes) {
    const html = fs.readFileSync(path.join(root, route), 'utf8');
    expect(html).toMatch(/property="og:title"/i);
    expect(html).toMatch(/property="og:description"/i);
    expect(html).toMatch(/property="og:image" content="https:\/\/drfaustest\.github\.io\/media\/img\/og-portfolio\.png"/i);
    expect(html).toMatch(/name="twitter:card" content="summary_large_image"/i);
  }
});
