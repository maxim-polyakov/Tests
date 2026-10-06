import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const apiUrl = process.env.WRIGHTTEST_API_URL ?? 'http://backend:3000';
const projectName = process.env.WRIGHTTEST_PROJECT ?? 'Imported Tests';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
}

async function request(urlPath, options = {}) {
  const response = await fetch(`${apiUrl}${urlPath}`, options);
  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${urlPath}: ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
}

async function findSpecs(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findSpecs(entryPath) : [entryPath];
  }));

  return files.flat().filter((file) => file.endsWith('.spec.ts'));
}

const login = await request('/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const headers = {
  authorization: `Bearer ${login.token}`,
  'content-type': 'application/json',
};

const projects = await request('/projects', { headers });
let project = projects.find((item) => item.name === projectName);

if (!project) {
  project = await request('/projects', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: projectName }),
  });
  console.log(`Created WrightTest project: ${projectName}`);
}

const existing = await request(`/projects/${project.id}/tests`, { headers });
const existingNames = new Set(existing.map((test) => test.name));
const specs = await findSpecs('/tests');

for (const file of specs) {
  const name = path.relative('/tests', file).replaceAll('\\', '/');

  if (existingNames.has(name)) {
    console.log(`Skipped existing test: ${name}`);
    continue;
  }

  const code = await readFile(file, 'utf8');
  await request(`/projects/${project.id}/import`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name, code }),
  });
  console.log(`Imported test: ${name}`);
}

console.log(`Import complete: ${specs.length} test file(s) found`);
