'use client';
import { useEffect, useState } from 'react';

interface Project {
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

type FormState = {
  name: string;
  gitUrl: string;
  purpose: string;
  platform: string;
  domain: string;
  status: string;
};

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  '运行中': { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400' },
  '已下线': { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', dot: 'bg-red-400' },
  '部署失败': { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20', dot: 'bg-amber-400' },
};

const platformIcons: Record<string, string> = {
  'Vercel': '▲',
  'Netlify': '◆',
  'Railway': '🚂',
  'Fly.io': '✈️',
};

function formatDate(ts: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title="复制域名"
      className={`ml-1.5 text-xs px-1.5 py-0.5 rounded transition-all ${
        copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-200'
      }`}
    >
      {copied ? '✓' : '复制'}
    </button>
  );
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Project | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = () => {
    setLoading(true);
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.purpose.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: projects.length,
    running: projects.filter(p => p.status === '运行中').length,
    offline: projects.filter(p => p.status === '已下线').length,
    failed: projects.filter(p => p.status === '部署失败').length,
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await fetch(`/api/projects/${deleteId}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
    setSelected(null);
    setDeleting(false);
  };

  const handleUpdated = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
    setEditTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#111]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-black font-bold text-sm">▲</div>
            <h1 className="text-base font-semibold tracking-tight">Deploy Dashboard</h1>
            <span className="text-[11px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">Projects</span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-white text-black text-sm font-medium px-3.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-base leading-none">+</span> 新增项目
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: '总项目', value: stats.total, color: 'text-white', accent: 'border-white/10' },
            { label: '运行中', value: stats.running, color: 'text-emerald-400', accent: 'border-emerald-500/20' },
            { label: '已下线', value: stats.offline, color: 'text-red-400', accent: 'border-red-500/20' },
            { label: '部署失败', value: stats.failed, color: 'text-amber-400', accent: 'border-amber-500/20' },
          ].map(s => (
            <div key={s.label} className={`bg-[#161616] border ${s.accent} rounded-xl p-5 hover:bg-[#1c1c1c] transition-colors`}>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{s.label}</p>
              <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜索项目名称或用途..."
              className="w-full bg-[#161616] border border-white/[0.08] rounded-lg pl-8 pr-4 py-2.5 text-sm focus:outline-none focus:border-white/20 transition-colors placeholder:text-gray-600"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: '运行中', label: '运行中' },
              { key: '已下线', label: '已下线' },
              { key: '部署失败', label: '失败' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-sm px-3 py-2 rounded-lg transition-all ${
                  filter === f.key
                    ? 'bg-white text-black font-medium'
                    : 'bg-[#161616] border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="text-center py-24 text-gray-600">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-gray-700 border-t-gray-300 rounded-full mb-4"></div>
            <p className="text-sm">加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <p className="text-5xl mb-4 opacity-30">▲</p>
            <p className="text-sm">暂无项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => {
              const sc = statusConfig[p.status] || statusConfig['运行中'];
              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group bg-[#161616] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.15] hover:bg-[#1a1a1a] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 text-xs flex-shrink-0">{platformIcons[p.platform] || '🌐'}</span>
                      <h3 className="font-medium text-sm truncate group-hover:text-white transition-colors">{p.name}</h3>
                    </div>
                    <span className={`flex-shrink-0 ml-2 text-[11px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${sc.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${p.status === '运行中' ? 'animate-pulse' : ''}`}></span>
                      <span className={sc.color}>{p.status || '未知'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">{p.purpose || '暂无描述'}</p>

                  {p.domain && (
                    <div className="flex items-center gap-1 mb-3 bg-white/[0.03] rounded-lg px-3 py-1.5">
                      <a
                        href={p.domain}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-[11px] text-blue-400 hover:text-blue-300 truncate flex-1 transition-colors"
                      >
                        {p.domainText || p.domain}
                      </a>
                      <CopyButton text={p.domain} />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>{p.platform || '未知平台'}</span>
                    <span>{formatDate(p.deployTime)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selected && !editTarget && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#161616] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selected.platform}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-gray-300 transition-colors p-1">✕</button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <Row label="状态">
                <span className={`${statusConfig[selected.status]?.color || 'text-gray-400'}`}>{selected.status || '未知'}</span>
              </Row>
              <Row label="用途">
                <span className="text-gray-300">{selected.purpose || '暂无'}</span>
              </Row>
              <Row label="部署时间">
                <span className="text-gray-300">{formatDate(selected.deployTime)}</span>
              </Row>
              {selected.domain && (
                <Row label="访问地址">
                  <div className="flex items-center gap-2">
                    <a href={selected.domain} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate transition-colors">
                      {selected.domainText || selected.domain}
                    </a>
                    <CopyButton text={selected.domain} />
                  </div>
                </Row>
              )}
              {selected.gitUrl && (
                <Row label="Git 仓库">
                  <a href={selected.gitUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 truncate transition-colors">
                    {selected.gitText || selected.gitUrl}
                  </a>
                </Row>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => setEditTarget(selected)}
                className="flex-1 bg-white/[0.06] hover:bg-white/[0.10] text-sm py-2 rounded-lg transition-colors"
              >
                编辑
              </button>
              <button
                onClick={() => setDeleteId(selected.id)}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm py-2 rounded-lg transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-semibold mb-2">确认删除</h3>
            <p className="text-sm text-gray-400 mb-6">此操作不可撤销，项目数据将被永久删除。</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-white/[0.06] hover:bg-white/[0.10] text-sm py-2 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm py-2 rounded-lg transition-colors"
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <ProjectModal
          onClose={() => setShowAdd(false)}
          onSaved={(p) => { setProjects(prev => [...prev, p]); setShowAdd(false); }}
        />
      )}

      {/* Edit Modal */}
      {editTarget && (
        <ProjectModal
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleUpdated}
        />
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-500 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function ProjectModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Project;
  onClose: () => void;
  onSaved: (p: Project) => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<FormState>({
    name: initial?.name || '',
    gitUrl: initial?.gitUrl || '',
    purpose: initial?.purpose || '',
    platform: initial?.platform || 'Vercel',
    domain: initial?.domain || '',
    status: initial?.status || '运行中',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (isEdit && initial) {
        const res = await fetch(`/api/projects/${initial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            gitText: initial.gitText || 'GitHub',
            domainText: form.domain,
          }),
        });
        const data = await res.json();
        onSaved(data.project);
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, deployTime: Date.now(), gitText: 'GitHub', domainText: form.domain }),
        });
        const data = await res.json();
        onSaved(data.project);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#161616] border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">{isEdit ? '编辑项目' : '新增项目'}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors p-1">✕</button>
        </div>
        <div className="space-y-4">
          {[
            { key: 'name' as const, label: '项目名称 *', placeholder: 'My Project' },
            { key: 'gitUrl' as const, label: 'Git 地址', placeholder: 'https://github.com/...' },
            { key: 'purpose' as const, label: '项目用途', placeholder: '简要描述项目功能...' },
            { key: 'domain' as const, label: '访问域名', placeholder: 'https://example.com' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-gray-500 mb-1.5 block">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors placeholder:text-gray-700"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">部署平台</label>
              <select
                value={form.platform}
                onChange={e => setForm(prev => ({ ...prev, platform: e.target.value }))}
                className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
              >
                {['Vercel', 'Netlify', 'Railway', 'Fly.io'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">状态</label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full bg-[#111] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
              >
                {['运行中', '已下线', '部署失败'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name}
            className="w-full bg-white text-black font-medium text-sm py-2.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors mt-2"
          >
            {saving ? '保存中...' : isEdit ? '保存修改' : '新增项目'}
          </button>
        </div>
      </div>
    </div>
  );
}
