const APP_TOKEN = 'Jvf8bJnEvac8s8s14dsc0uTYn8g';
const TABLE_ID = 'tbll04hTtubeCfnv';
const BASE = 'https://open.feishu.cn/open-apis';
const RECORDS_URL = `${BASE}/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`;

// Module-level token cache (works within a warm serverless instance)
let cachedToken = '';
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });
  const data = await res.json();
  if (!data.tenant_access_token) {
    throw new Error('获取飞书 Token 失败: ' + JSON.stringify(data));
  }
  cachedToken = data.tenant_access_token;
  const expireSeconds: number = typeof data.expire === 'number' ? data.expire : 7200;
  tokenExpiry = Date.now() + (expireSeconds - 60) * 1000;
  return cachedToken;
}

async function authHeaders() {
  const token = await getToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// Feishu text fields are arrays of segments: [{type:"text", text:"..."}]
function readText(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return (val as { text?: string }[]).map(s => s.text ?? '').join('');
  return '';
}

// Feishu URL fields: {link: "...", text: "..."}
function readUrl(val: unknown): { link: string; text: string } {
  if (val && typeof val === 'object') {
    const v = val as { link?: string; text?: string };
    return { link: v.link ?? '', text: v.text ?? '' };
  }
  return { link: '', text: '' };
}

export interface FeishuProject {
  id: string;
  name: string;
  gitUrl: string;
  gitText: string;
  purpose: string;
  platform: string;
  domain: string;
  domainText: string;
  deployTime: number | null;
  status: string;
}

type FeishuRecord = { record_id: string; fields: Record<string, unknown> };

function recordToProject(record: FeishuRecord): FeishuProject {
  const f = record.fields;
  const git = readUrl(f['Git地址']);
  const domain = readUrl(f['访问域名']);
  return {
    id: record.record_id,
    name: readText(f['项目名称']),
    gitUrl: git.link,
    gitText: git.text || git.link,
    purpose: readText(f['用途说明']),
    platform: typeof f['部署平台'] === 'string' ? f['部署平台'] : '',
    domain: domain.link,
    domainText: domain.text || domain.link,
    deployTime: typeof f['部署时间'] === 'number' ? f['部署时间'] : null,
    status: typeof f['状态'] === 'string' ? f['状态'] : '运行中',
  };
}

function projectToFields(data: Partial<FeishuProject>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (data.name !== undefined) fields['项目名称'] = [{ type: 'text', text: data.name }];
  if (data.gitUrl) fields['Git地址'] = { link: data.gitUrl, text: data.gitText || data.gitUrl };
  if (data.purpose !== undefined) fields['用途说明'] = [{ type: 'text', text: data.purpose }];
  if (data.platform !== undefined) fields['部署平台'] = data.platform;
  if (data.domain) fields['访问域名'] = { link: data.domain, text: data.domainText || data.domain };
  if (data.deployTime) fields['部署时间'] = data.deployTime;
  if (data.status !== undefined) fields['状态'] = data.status;
  return fields;
}

export async function listProjects(): Promise<FeishuProject[]> {
  const headers = await authHeaders();
  const res = await fetch(`${RECORDS_URL}?page_size=500`, { headers });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg ?? 'Feishu API error');
  return ((data.data?.items ?? []) as FeishuRecord[]).map(recordToProject);
}

export async function createProject(project: Omit<FeishuProject, 'id'>): Promise<FeishuProject> {
  const headers = await authHeaders();
  const res = await fetch(RECORDS_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields: projectToFields(project) }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg ?? 'Feishu API error');
  return recordToProject(data.data.record as FeishuRecord);
}

export async function updateProject(id: string, project: Partial<FeishuProject>): Promise<FeishuProject> {
  const headers = await authHeaders();
  const res = await fetch(`${RECORDS_URL}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ fields: projectToFields(project) }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg ?? 'Feishu API error');
  return recordToProject(data.data.record as FeishuRecord);
}

export async function deleteProject(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${RECORDS_URL}/${id}`, { method: 'DELETE', headers });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg ?? 'Feishu API error');
}
