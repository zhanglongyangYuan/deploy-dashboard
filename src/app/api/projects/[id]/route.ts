import { NextResponse } from 'next/server';
import { updateProject, deleteProject } from '@/lib/feishu';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const project = await updateProject(id, {
      name: body.name,
      gitUrl: body.gitUrl,
      gitText: body.gitText,
      purpose: body.purpose,
      platform: body.platform,
      domain: body.domain,
      domainText: body.domainText || body.domain,
      deployTime: body.deployTime,
      status: body.status,
    });
    return NextResponse.json({ project });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
