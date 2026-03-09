import { NextResponse } from 'next/server';
import { listProjects, createProject } from '@/lib/feishu';

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }
    const project = await createProject({
      name: body.name,
      gitUrl: body.gitUrl || '',
      gitText: body.gitText || body.gitUrl || 'GitHub',
      purpose: body.purpose || '',
      platform: body.platform || 'Vercel',
      domain: body.domain || '',
      domainText: body.domainText || body.domain || '',
      deployTime: body.deployTime || Date.now(),
      status: body.status || '运行中',
    });
    return NextResponse.json({ project });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
