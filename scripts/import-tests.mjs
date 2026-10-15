import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const apiUrl = process.env.WRIGHTTEST_API_URL ?? 'http://backend:3000';
const projectName = process.env.WRIGHTTEST_PROJECT ?? 'Misa';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const targetBaseUrl = (process.env.TEST_BASE_URL ?? 'https://misa.baxic.ru').replace(/\/$/, '');
const targetApiUrl = (process.env.TEST_API_URL ?? targetBaseUrl).replace(/\/$/, '');
const scheduleCron = process.env.TEST_SCHEDULE_CRON ?? '0 * * * *';
const environmentName = process.env.TEST_ENVIRONMENT ?? 'Misa Production';
const testsDirectory = process.env.TESTS_DIR ?? '/misa-tests';
const testEmail = process.env.TEST_EMAIL ?? process.env.MISA_TEST_EMAIL;
const testPassword = process.env.TEST_PASSWORD ?? process.env.MISA_TEST_PASSWORD;

if (!email || !password || !testEmail || !testPassword) {
  throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, TEST_EMAIL and TEST_PASSWORD are required');
}

async function request(urlPath, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (options.body === undefined) {
    delete headers['content-type'];
  }

  const response = await fetch(`${apiUrl}${urlPath}`, { ...options, headers });
  const body = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${urlPath}: ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
}

async function findSpecs(directory) {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => !entry.name.startsWith('..'));
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

const environments = await request(`/projects/${project.id}/environments`, { headers });
const environmentVariables = {
  BASE_URL: targetBaseUrl,
  API_URL: targetApiUrl,
  API_IMAGES_URL: `${targetApiUrl}/api/images`,
  LOGIN_URL: `${targetBaseUrl}/login?lang=ru`,
  LOGIN_PAGE_URL: `${targetBaseUrl}/login`,
  LOGOUT_URL: `${targetBaseUrl}/login?lang=ru`,
  REGISTRATION_URL: `${targetBaseUrl}/registration?lang=ru`,
  FORGOT_PASSWORD_URL: `${targetBaseUrl}/forgot-password?lang=ru`,
  CHAT_URL: `${targetBaseUrl}/chat?lang=ru`,
  GALLERY_URL: `${targetBaseUrl}/gallery`,
  ADMIN_URL: `${targetBaseUrl}/admin`,
  TEST_EMAIL: testEmail,
  TEST_PASSWORD: testPassword,
};
let environment = environments.find((item) => item.name === environmentName);

if (environment) {
  environment = await request(`/environments/${environment.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ variables: environmentVariables }),
  });
} else {
  environment = await request(`/projects/${project.id}/environments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: environmentName, variables: environmentVariables }),
  });
  console.log(`Created WrightTest environment: ${environmentName}`);
}

const existing = await request(`/projects/${project.id}/tests`, { headers });
const testsByName = new Map(existing.map((test) => [test.name, test]));
const schedules = await request(`/projects/${project.id}/schedules`, { headers });
const schedulesByName = new Map(schedules.map((schedule) => [schedule.name, schedule]));
const specs = await findSpecs(testsDirectory);
const desiredScheduleNames = new Set(specs.map((file) => {
  const name = path.relative(testsDirectory, file).replaceAll('\\', '/');
  return `Hourly: ${name}`.slice(0, 100);
}));

for (const schedule of schedules) {
  if (schedule.name.startsWith('Hourly: ') && !desiredScheduleNames.has(schedule.name)) {
    await request(`/schedules/${schedule.id}`, { method: 'DELETE', headers });
    console.log(`Deleted stale schedule: ${schedule.name}`);
  }
}

for (const importedTest of existing) {
  if (/^\.\.\d/.test(importedTest.name)) {
    await request(`/tests/${importedTest.id}`, { method: 'DELETE', headers });
    console.log(`Deleted stale ConfigMap test: ${importedTest.name}`);
  }
}

for (const file of specs) {
  const name = path.relative(testsDirectory, file).replaceAll('\\', '/');
  let importedTest = testsByName.get(name);
  const code = await readFile(file, 'utf8');

  if (importedTest) {
    const temporaryName = `__refresh__${Date.now()}-${name}`.slice(0, 100);
    const refreshed = await request(`/projects/${project.id}/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: temporaryName, code }),
    });
    try {
      const freshTest = refreshed.test;
      importedTest = await request(`/tests/${importedTest.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name,
          url: freshTest.url,
          device: freshTest.device,
          steps: freshTest.steps,
          testData: freshTest.testData,
        }),
      });
      console.log(`Updated test: ${name}`);
    } finally {
      await request(`/tests/${refreshed.test.id}`, { method: 'DELETE', headers });
    }
  } else {
    const imported = await request(`/projects/${project.id}/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, code }),
    });
    importedTest = imported.test;
    console.log(`Imported test: ${name}`);
  }

  await request(`/tests/${importedTest.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ environmentId: environment.id }),
  });

  const scheduleName = `Hourly: ${name}`.slice(0, 100);
  const schedulePayload = {
    name: scheduleName,
    cron: scheduleCron,
    testId: importedTest.id,
    environmentId: environment.id,
    enabled: true,
  };
  const existingSchedule = schedulesByName.get(scheduleName);

  if (existingSchedule) {
    await request(`/schedules/${existingSchedule.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(schedulePayload),
    });
    console.log(`Updated schedule: ${scheduleName}`);
  } else {
    await request(`/projects/${project.id}/schedules`, {
      method: 'POST',
      headers,
      body: JSON.stringify(schedulePayload),
    });
    console.log(`Created schedule: ${scheduleName}`);
  }
}

console.log(`Import complete: ${specs.length} test file(s) found`);
