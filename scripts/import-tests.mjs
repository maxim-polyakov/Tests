import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const apiUrl = process.env.WRIGHTTEST_API_URL ?? 'http://backend:3000';
const projectName = process.env.WRIGHTTEST_PROJECT ?? 'Misa';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const targetBaseUrl = (process.env.TEST_BASE_URL ?? 'https://misa.baxic.ru').replace(/\/$/, '');
const targetApiUrl = (process.env.TEST_API_URL ?? targetBaseUrl).replace(/\/$/, '');
const scheduleCron = process.env.TEST_SCHEDULE_CRON ?? '0 * * * *';
const scheduleStepMinutes = Number.parseInt(process.env.TEST_SCHEDULE_STEP_MINUTES ?? '2', 10);
const environmentName = process.env.TEST_ENVIRONMENT ?? 'Misa Production';
const testsDirectory = process.env.TESTS_DIR ?? '/misa-tests';
const testEmail = process.env.TEST_EMAIL ?? process.env.MISA_TEST_EMAIL;
const testPassword = process.env.TEST_PASSWORD ?? process.env.MISA_TEST_PASSWORD;
const loginPath = process.env.TEST_LOGIN_PATH ?? '/login';
const registrationPath = process.env.TEST_REGISTRATION_PATH ?? '/registration';
const forgotPasswordPath = process.env.TEST_FORGOT_PASSWORD_PATH ?? '/forgot-password';
const shopPath = process.env.TEST_SHOP_PATH ?? '/shop';
const previewImagePath = process.env.TEST_PREVIEW_IMAGE_PATH ?? '/baxic-logo-card.jpg';

if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
}

if (!Number.isInteger(scheduleStepMinutes) || scheduleStepMinutes < 1) {
  throw new Error('TEST_SCHEDULE_STEP_MINUTES must be a positive integer');
}

function staggeredCron(index) {
  const fields = scheduleCron.trim().split(/\s+/);
  const startMinute = Number.parseInt(fields[0], 10);

  if (fields.length !== 5 || !Number.isInteger(startMinute) || String(startMinute) !== fields[0]) {
    throw new Error('TEST_SCHEDULE_CRON must use a fixed numeric minute in a five-field cron expression');
  }

  const minute = startMinute + (index * scheduleStepMinutes);
  if (minute > 59) {
    throw new Error(`Sequential schedule exceeds the hour at test index ${index}`);
  }

  return [String(minute), ...fields.slice(1)].join(' ');
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
  API_PRODUCTS_URL: `${targetApiUrl}/product?page=0&size=10`,
  LOGIN_URL: `${targetBaseUrl}${loginPath}?lang=ru`,
  LOGIN_EN_URL: `${targetBaseUrl}${loginPath}?lang=en`,
  LOGIN_DE_URL: `${targetBaseUrl}${loginPath}?lang=de`,
  LOGIN_PAGE_URL: `${targetBaseUrl}${loginPath}?lang=ru`,
  LOGOUT_URL: `${targetBaseUrl}${loginPath}?lang=ru`,
  REGISTRATION_URL: `${targetBaseUrl}${registrationPath}?lang=ru`,
  FORGOT_PASSWORD_URL: `${targetBaseUrl}${forgotPasswordPath}?lang=ru`,
  SHOP_URL: `${targetBaseUrl}${shopPath}?lang=ru`,
  CHAT_URL: `${targetBaseUrl}/chat?lang=ru`,
  CHAT_EN_URL: `${targetBaseUrl}/chat?lang=en`,
  CHAT_AR_URL: `${targetBaseUrl}/chat?lang=ar`,
  GALLERY_URL: `${targetBaseUrl}/gallery?lang=ru`,
  ADMIN_URL: `${targetBaseUrl}/admin?lang=ru`,
  HOME_URL: `${targetBaseUrl}/?lang=ru`,
  HOME_EN_URL: `${targetBaseUrl}/?lang=en`,
  HOME_DE_URL: `${targetBaseUrl}/?lang=de`,
  API_HEALTH_URL: `${targetApiUrl}/api/health`,
  PREVIEW_URL: `${targetApiUrl}/api/og/preview?lang=ru`,
  PREVIEW_IMAGE_URL: `${targetBaseUrl}${previewImagePath}`,
  ...(testEmail ? { TEST_EMAIL: testEmail } : {}),
  ...(testPassword ? { TEST_PASSWORD: testPassword } : {}),
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
const specs = (await findSpecs(testsDirectory)).sort((left, right) => left.localeCompare(right));
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

for (const [index, file] of specs.entries()) {
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
    cron: staggeredCron(index),
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
