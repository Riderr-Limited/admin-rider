'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Handshake, Eye, Plus, Ban, CheckCircle, RefreshCw, Copy, Check, AlertTriangle, Package } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '../PageHeader';
import {
  Badge, Card, EmptyState, LoadingBlock, Modal, InfoGrid, Section, Notice, Field, FilterBar, SearchInput,
  selectCls, inputCls, btnPrimary, btnSecondary, iconBtn, fmtDate, fmtDateTime,
} from '../ui';

const idOf = (p: any) => p.id ?? p._id;

export default function Partners() {
  const [partners, setPartners] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [secret, setSecret] = useState<{ apiKey: string; apiSecret: string; message: string } | null>(null);
  const [regenTarget, setRegenTarget] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'green' | 'red'; text: string } | null>(null);

  const flash = (tone: 'green' | 'red', text: string) => { setNotice({ tone, text }); setTimeout(() => setNotice(null), 4000); };

  useEffect(() => { api.getCompanies({ limit: 100, status: 'active' }).then(r => setCompanies(r.data ?? [])).catch(() => {}); }, []);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPartners();
      setPartners(res.data ?? []);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // The partners endpoint returns everything unfiltered, so search/status are applied here.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter(p =>
      (!status || p.status === status) &&
      (!q || [p.businessName, p.contactName, p.contactEmail, p.contactPhone, p.apiKey].some(v => v?.toLowerCase?.().includes(q))));
  }, [partners, search, status]);

  const companyName = (id: string) => companies.find(c => c._id === id)?.name ?? id;

  const toggleStatus = async (p: any) => {
    setBusy(true);
    try {
      const res = p.status === 'active' ? await api.suspendPartner(idOf(p)) : await api.activatePartner(idOf(p));
      flash('green', `${p.businessName} ${p.status === 'active' ? 'suspended' : 'activated'}`);
      fetchPartners();
      if (selected && idOf(selected) === idOf(p)) setSelected(res.data);
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async (p: any) => {
    setBusy(true);
    try {
      const res = await api.regeneratePartnerSecret(idOf(p));
      setRegenTarget(null);
      setSecret({ apiKey: res.data?.apiKey, apiSecret: res.data?.apiSecret, message: res.message ?? 'New secret generated. Store it now — it will not be shown again.' });
      fetchPartners();
    } catch (e: any) {
      flash('red', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        icon={Handshake}
        title="API Partners"
        subtitle="External businesses that create deliveries through the Partner API"
        gradient="from-cyan-500 to-blue-600"
        action={<button onClick={() => setShowCreate(true)} className={btnPrimary}><Plus className="w-4 h-4" /> Add partner</button>}
      />

      {notice && <div className="mb-4"><Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search business, contact or API key…" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </FilterBar>

      {loading ? <LoadingBlock /> : visible.length === 0 ? <EmptyState icon={Handshake} text="No partners found" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((p) => (
            <Card key={idOf(p)} className="p-4 sm:p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0"><Handshake className="w-5 h-5 text-white" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{p.businessName}</p>
                  <p className="text-xs text-gray-500 truncate">{p.contactName} · {p.contactEmail}</p>
                </div>
                <Badge status={p.status} />
              </div>
              <code className="mt-3 text-[11px] bg-gray-100 px-2 py-1 rounded-lg text-gray-700 truncate block">{p.apiKey}</code>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                <span>{(p.requestCount ?? 0).toLocaleString()} requests</span>
                <span>Last used {p.lastUsedAt ? fmtDate(p.lastUsedAt) : 'never'}</span>
              </div>
              <div className="flex items-center justify-end gap-1 mt-3 pt-2 border-t border-gray-100">
                <button onClick={() => setSelected(p)} className={iconBtn} title="Details"><Eye className="w-4 h-4 text-gray-600" /></button>
                <button onClick={() => setRegenTarget(p)} className={iconBtn} title="Regenerate secret"><RefreshCw className="w-4 h-4 text-blue-600" /></button>
                <button onClick={() => toggleStatus(p)} disabled={busy} className={iconBtn} title={p.status === 'active' ? 'Suspend' : 'Activate'}>
                  {p.status === 'active' ? <Ban className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <Modal
          title={selected.businessName}
          subtitle={<Badge status={selected.status} />}
          onClose={() => setSelected(null)}
          footer={
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => setRegenTarget(selected)} className={btnSecondary}><RefreshCw className="w-4 h-4" /> Regenerate secret</button>
              <button onClick={() => toggleStatus(selected)} disabled={busy} className={`${btnSecondary} ${selected.status === 'active' ? '!text-red-600' : '!text-emerald-700'}`}>
                {selected.status === 'active' ? <><Ban className="w-4 h-4" /> Suspend</> : <><CheckCircle className="w-4 h-4" /> Activate</>}
              </button>
            </div>
          }
        >
          <Section title="Contact">
            <InfoGrid items={[
              ['Contact', selected.contactName],
              ['Email', selected.contactEmail],
              ['Phone', selected.contactPhone],
              ['Created', fmtDate(selected.createdAt)],
            ]} />
          </Section>
          <Section title="API usage">
            <InfoGrid items={[
              ['API key', <CopyField key="k" value={selected.apiKey} />],
              ['Requests', (selected.requestCount ?? 0).toLocaleString()],
              ['Last used', selected.lastUsedAt ? fmtDateTime(selected.lastUsedAt) : 'Never'],
            ]} />
          </Section>
          <Section title="Allowed companies">
            {(selected.allowedCompanyIds ?? []).length === 0 ? <p className="text-sm text-gray-600">Any active company</p> : (
              <div className="flex flex-wrap gap-1.5">
                {selected.allowedCompanyIds.map((cid: string) => <Badge key={cid} tone="gray">{companyName(cid)}</Badge>)}
              </div>
            )}
          </Section>
          <p className="text-xs text-gray-500 mt-5 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Their orders appear in Deliveries under source “Partner API”.</p>
        </Modal>
      )}

      {showCreate && (
        <CreatePartnerModal
          companies={companies}
          onClose={() => setShowCreate(false)}
          onCreated={(res) => {
            setShowCreate(false);
            setSecret({ apiKey: res.data?.apiKey, apiSecret: res.data?.apiSecret, message: res.message ?? 'Partner created. Store the API secret now — it will not be shown again.' });
            fetchPartners();
          }}
        />
      )}

      {regenTarget && (
        <Modal
          title="Regenerate API secret"
          size="sm"
          onClose={() => setRegenTarget(null)}
          footer={
            <div className="flex gap-2">
              <button onClick={() => setRegenTarget(null)} className={`${btnSecondary} flex-1`}>Cancel</button>
              <button onClick={() => regenerate(regenTarget)} disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? 'Working…' : 'Regenerate'}</button>
            </div>
          }
        >
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p><b>{regenTarget.businessName}</b>&apos;s current secret stops working immediately. Their integration will fail until they install the new one.</p>
          </div>
        </Modal>
      )}

      {secret && (
        <Modal title="Partner credentials" size="sm" onClose={() => setSecret(null)} footer={<button onClick={() => setSecret(null)} className={`${btnPrimary} w-full`}>I&apos;ve stored it — close</button>}>
          <div className="space-y-4">
            <Notice tone="amber">{secret.message}</Notice>
            <Field label="API key"><CopyField value={secret.apiKey} /></Field>
            <Field label="API secret"><CopyField value={secret.apiSecret} /></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex items-center gap-2">
      <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded-xl text-gray-700 break-all">{value}</code>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {})}
        className={iconBtn}
        aria-label="Copy"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
      </button>
    </span>
  );
}

function CreatePartnerModal({ companies, onClose, onCreated }: { companies: any[]; onClose: () => void; onCreated: (res: any) => void }) {
  const [form, setForm] = useState({ businessName: '', contactName: '', contactEmail: '', contactPhone: '' });
  const [allowed, setAllowed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.createPartner({ ...form, ...(allowed.length ? { allowedCompanyIds: allowed } : {}) });
      onCreated(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add API partner"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${btnSecondary} flex-1`}>Cancel</button>
          <button type="submit" form="create-partner" disabled={busy} className={`${btnPrimary} flex-1`}>{busy ? 'Creating…' : 'Create partner'}</button>
        </div>
      }
    >
      <form id="create-partner" onSubmit={submit} className="space-y-4">
        <Field label="Business name"><input required value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Jumia NG" className={inputCls} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact name"><input required value={form.contactName} onChange={e => set('contactName', e.target.value)} className={inputCls} /></Field>
          <Field label="Contact phone"><input required type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="08012345678" className={inputCls} /></Field>
        </div>
        <Field label="Contact email"><input required type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} className={inputCls} /></Field>
        <Field label="Restrict to companies" hint="Leave all unticked to allow any active company">
          <div className="max-h-44 overflow-y-auto rounded-xl ring-1 ring-gray-200 divide-y divide-gray-100">
            {companies.length === 0 ? <p className="text-xs text-gray-400 p-3">No active companies</p> : companies.map(c => (
              <label key={c._id} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={allowed.includes(c._id)}
                  onChange={e => setAllowed(prev => e.target.checked ? [...prev, c._id] : prev.filter(x => x !== c._id))}
                  className="w-4 h-4 accent-blue-600"
                />
                {c.name}
              </label>
            ))}
          </div>
        </Field>
        {error && <Notice tone="red">{error}</Notice>}
      </form>
    </Modal>
  );
}
