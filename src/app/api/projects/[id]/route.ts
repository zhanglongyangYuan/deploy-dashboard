import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'projects.json');

function readProjects() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeProjects(projects: unknown[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const projects = readProjects();
    const idx = projects.findIndex((p: { id: string }) => p.id === id);
    if (idx === -1) return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    projects[idx] = { ...projects[idx], ...body, id };
    writeProjects(projects);
    return NextResponse.json({ project: projects[idx] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const projects = readProjects();
    const next = projects.filter((p: { id: string }) => p.id !== id);
    if (next.length === projects.length) return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    writeProjects(next);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
