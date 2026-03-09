import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

function readProjects() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]');
      return [];
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeProjects(projects: unknown[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

export async function GET() {
  const projects = readProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }
    const projects = readProjects();
    const newProject = {
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: body.name,
      gitUrl: body.gitUrl || '',
      gitText: body.gitText || 'GitHub',
      purpose: body.purpose || '',
      platform: body.platform || 'Vercel',
      domain: body.domain || '',
      domainText: body.domainText || body.domain || '',
      deployTime: body.deployTime || Date.now(),
      status: body.status || '运行中',
    };
    projects.push(newProject);
    writeProjects(projects);
    return NextResponse.json({ project: newProject });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
