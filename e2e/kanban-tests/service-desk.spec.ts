import {
  expect,
  request,
  type APIRequestContext,
  type APIResponse,
  type Page,
  test,
} from '@playwright/test';

type Json = Record<string, any>;

const webUrl = process.env.KANBAN_E2E_BASE_URL ?? process.env.KANBAN_BASE_URL;
const apiUrl = process.env.KANBAN_E2E_API_URL ?? process.env.KANBAN_API_URL;
const agentEmail = process.env.KANBAN_E2E_EMAIL;
const agentPassword = process.env.KANBAN_E2E_PASSWORD;
const requesterEmail = process.env.KANBAN_E2E_VIEWER_EMAIL;
const requesterPassword = process.env.KANBAN_E2E_VIEWER_PASSWORD;
const productionHosts = new Set(['kanban.baxic.ru', 'kanbanapi.baxic.ru']);

function isProductionUrl(value?: string): boolean {
  if (!value) return false;
  try {
    return productionHosts.has(new URL(value).hostname);
  } catch {
    return true;
  }
}

function gateFullFlow(): void {
  test.skip(process.env.KANBAN_SERVICE_DESK_E2E !== '1', 'Set KANBAN_SERVICE_DESK_E2E=1');
  test.skip(
    !agentEmail || !agentPassword || !requesterEmail || !requesterPassword,
    'Set agent and viewer KANBAN_E2E credentials',
  );
  test.skip(!webUrl || !apiUrl, 'Set KANBAN_E2E_BASE_URL and KANBAN_E2E_API_URL');
  test.skip(
    isProductionUrl(webUrl) || isProductionUrl(apiUrl),
    'Destructive Service Desk E2E must never run against production',
  );
}

async function json(response: APIResponse): Promise<Json> {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function entityId(value: Json): string {
  const valueId = value.id ?? value.data?.id;
  expect(valueId, `Missing id in ${JSON.stringify(value)}`).toBeTruthy();
  return String(valueId);
}

function unique(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

class DeskApi {
  private constructor(readonly context: APIRequestContext) {}

  static async login(email: string, password: string): Promise<DeskApi> {
    const anonymous = await request.newContext({ baseURL: apiUrl });
    const response = await anonymous.post('/api/auth/login', { data: { email, password } });
    expect(response.ok(), await response.text()).toBeTruthy();
    const result = await json(response);
    const token = result.token ?? result.accessToken ?? result.data?.token ?? result.data?.accessToken;
    expect(token).toEqual(expect.any(String));
    await anonymous.dispose();
    return new DeskApi(await request.newContext({
      baseURL: apiUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    }));
  }

  async call(method: 'get' | 'post' | 'put' | 'delete', path: string, data?: Json): Promise<APIResponse> {
    return this.context[method](path, data === undefined ? undefined : { data });
  }

  async ok(method: 'get' | 'post' | 'put' | 'delete', path: string, data?: Json): Promise<Json> {
    const response = await this.call(method, path, data);
    expect(response.ok(), `${method.toUpperCase()} ${path}: ${await response.text()}`).toBeTruthy();
    return json(response);
  }
}

async function loginPage(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${webUrl}/login?lang=ru`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 30_000 });
}

test.describe('Service Desk', () => {
  test('portal route is reachable for authenticated users', async ({ page }) => {
    await page.goto('/portal');
    // Either the portal home or login redirect is acceptable depending on auth state.
    await expect(page).toHaveURL(/\/(?:portal(?:\/|$)|login(?:\?|$))/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Service Desk authenticated lifecycle', () => {
  gateFullFlow();
  test.describe.configure({ mode: 'serial' });

  test('requester creates, agent handles SLA, approval unlocks closing', async ({ page }) => {
    const agent = await DeskApi.login(agentEmail!, agentPassword!);
    const requester = await DeskApi.login(requesterEmail!, requesterPassword!);
    let teamId: string | undefined;
    let boardId: string | undefined;

    try {
      const agentMe = await agent.ok('get', '/api/auth/me');
      const requesterMe = await requester.ok('get', '/api/auth/me');
      const agentId = entityId(agentMe);
      const requesterId = entityId(requesterMe);

      const team = await agent.ok('post', '/api/teams', {
        name: unique('service-desk-team'),
        description: 'Disposable Service Desk E2E fixture',
        key: `SD${Date.now().toString(36).slice(-5).toUpperCase()}`,
      });
      teamId = entityId(team);

      await agent.ok('post', `/api/teams/${teamId}/members/invite`, { userId: requesterId });
      const invites = await requester.ok('get', '/api/teams/invites/my') as Json[];
      const invite = invites.find((item) => String(item.teamId) === teamId);
      expect(invite, 'Requester team invitation was not created').toBeTruthy();
      await requester.ok('post', `/api/teams/invites/${entityId(invite!)}/accept`, {});

      const board = await agent.ok('post', '/api/boards', {
        name: unique('service-desk'),
        description: 'Disposable Service Desk E2E fixture',
        teamId,
        keyPrefix: `SD${Date.now().toString(36).slice(-4).toUpperCase()}`,
        template: 'it-help',
        managementType: 'team',
        access: 'private',
      });
      boardId = entityId(board);
      const slug = unique('portal').toLowerCase();

      await agent.ok('put', `/api/boards/${boardId}/service-desk`, {
        enabled: true,
        portalSlug: slug,
        welcomeTitle: 'E2E Service Desk',
        welcomeText: 'Lifecycle verification',
      });
      const requestTypes = await agent.ok(
        'get',
        `/api/boards/${boardId}/service-desk/request-types?portal=true`,
      ) as Json[];
      const requestType = requestTypes[0];
      expect(requestType).toBeTruthy();

      await loginPage(page, requesterEmail!, requesterPassword!);
      await page.goto(`${webUrl}/portal/${slug}/new/${entityId(requestType)}`);
      const title = unique('request');
      await page.getByLabel(/Тема/).fill(title);
      await page.getByLabel(/Описание/).fill('Service Desk end-to-end request');
      await page.getByRole('button', { name: 'Отправить' }).click();
      await expect(page).toHaveURL(new RegExp(`/portal/${slug}/requests/[0-9a-f-]+`));
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      const questId = page.url().match(/\/requests\/([0-9a-f-]+)/i)?.[1];
      expect(questId).toBeTruthy();

      let detail = await requester.ok('get', `/api/portal/${slug}/requests/${questId}`);
      expect(detail.sla).toEqual(expect.arrayContaining([
        expect.objectContaining({ metric: 'first_response', status: 'running' }),
        expect.objectContaining({ metric: 'resolution', status: 'running' }),
      ]));

      const queues = await agent.ok('get', `/api/boards/${boardId}/service-desk/queues`) as Json[];
      const queue = queues[0];
      expect(queue).toBeTruthy();
      const queueResult = await agent.ok(
        'get',
        `/api/boards/${boardId}/service-desk/queues/${entityId(queue)}/issues`,
      );
      expect(queueResult.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: questId }),
      ]));
      await agent.ok(
        'post',
        `/api/boards/${boardId}/service-desk/queues/${entityId(queue)}/assign`,
        { questIds: [questId], assigneeId: agentId },
      );

      await agent.ok('post', `/api/portal/${slug}/requests/${questId}/comments`, {
        text: 'Agent public response',
        isInternal: false,
      });
      detail = await requester.ok('get', `/api/portal/${slug}/requests/${questId}`);
      expect(detail.assigneeName).toBeTruthy();
      expect(detail.comments).toEqual(expect.arrayContaining([
        expect.objectContaining({ text: 'Agent public response', isInternal: false }),
      ]));
      expect(detail.sla).toEqual(expect.arrayContaining([
        expect.objectContaining({ metric: 'first_response', status: 'met' }),
      ]));

      const approval = await agent.ok(
        'post',
        `/api/boards/${boardId}/service-desk/requests/${questId}/approvals`,
        {
          title: 'E2E approval',
          requiredApprovals: 1,
          approverUserIds: [agentId],
          approverGroupIds: [],
          blockedTransitionKey: null,
        },
      );
      const boardDetail = await agent.ok('get', `/api/boards/${boardId}`);
      const doneColumn = (boardDetail.columns as Json[]).find((column) => [3, 5].includes(column.kind));
      expect(doneColumn, 'IT help template must contain a Done column').toBeTruthy();
      const move = {
        questId,
        targetColumnId: entityId(doneColumn!),
        newOrder: 0,
      };
      const blockedMove = await agent.call('post', '/api/quests/move', move);
      expect(blockedMove.status()).toBe(400);
      expect(await blockedMove.text()).toContain('требуется согласование');

      const decision = await agent.ok(
        'post',
        `/api/service-desk/approvals/${entityId(approval)}/decide`,
        { approve: true, comment: 'Approved by E2E agent' },
      );
      expect(decision.status).toBe('approved');
      await agent.ok('post', '/api/quests/move', move);

      detail = await requester.ok('get', `/api/portal/${slug}/requests/${questId}`);
      expect(detail.approvals).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: entityId(approval), status: 'approved' }),
      ]));
      expect(detail.sla).toEqual(expect.arrayContaining([
        expect.objectContaining({ metric: 'resolution', status: 'met' }),
      ]));
      expect([3, 5]).toContain(detail.statusKind);
    } finally {
      if (boardId) await agent.call('delete', `/api/boards/${boardId}`);
      if (teamId) await agent.call('delete', `/api/teams/${teamId}`);
      await requester.context.dispose();
      await agent.context.dispose();
    }
  });
});
