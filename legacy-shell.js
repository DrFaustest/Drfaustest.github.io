const currentScript = document.currentScript;
const status = currentScript?.dataset.status || 'Archived experiment';
const root = currentScript?.dataset.root || '/';

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet';
stylesheet.href = `${root}legacy-shell.css`;
document.head.append(stylesheet);

const shell = document.createElement('aside');
shell.className = 'legacy-shell';
shell.dataset.status = status;
shell.setAttribute('aria-label', 'Project status');

const badge = document.createElement('span');
badge.textContent = status;
const link = document.createElement('a');
link.href = `${root}projects.html`;
link.textContent = 'Back to project inventory';
shell.append(badge, link);
document.body.append(shell);
