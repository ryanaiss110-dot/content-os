import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  LayoutDashboard, UserPlus, Target, Calendar, BarChart3, ChevronRight,
  Plus, Search, Filter, Download, Edit3, Check, X, RefreshCw, Loader2,
  TrendingUp, TrendingDown, Users, FileText, Clock, AlertCircle, Zap,
  Eye, MoreVertical, ChevronDown, ChevronUp, Star, Award, Flame,
  ArrowRight, ExternalLink, Trash2, Save, Grid, List, AlertTriangle
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from 'recharts'

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const storage = {
  get(key) {
    try {
      if (window.storage?.getItem) return JSON.parse(window.storage.getItem(key) || 'null')
      return JSON.parse(localStorage.getItem(key) || 'null')
    } catch { return null }
  },
  set(key, value) {
    try {
      const str = JSON.stringify(value)
      if (window.storage?.setItem) window.storage.setItem(key, str)
      else localStorage.setItem(key, str)
    } catch (e) { console.error('Storage error:', e) }
  },
  remove(key) {
    try {
      if (window.storage?.removeItem) window.storage.removeItem(key)
      else localStorage.removeItem(key)
    } catch (e) { console.error('Storage remove error:', e) }
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Jamais'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `Il y a ${days}j`
}

// ============================================================================
// AI API CALLS
// ============================================================================

const SYSTEM_PROMPT = `Tu es un Chief Strategy Officer & Content Marketing Expert pour une agence marketing.
Tu dois répondre UNIQUEMENT en JSON valide, sans texte avant ou après, sans backticks markdown.
Utilise les frameworks : OPSC, 6 Piliers Content Marketing, Empathy Map, Job-to-be-Done, POEM, AARRR.
Sois précis, actionnable et adapté au marché francophone.`

async function callAI(userPrompt) {
  // Appel via le proxy Vercel serverless — la clé API reste côté serveur
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: SYSTEM_PROMPT, userPrompt }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `API Error ${res.status}`)
  }

  const data = await res.json()
  const cleaned = (data.result || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  return JSON.parse(cleaned)
}

// ============================================================================
// DEMO DATA
// ============================================================================

const DEMO_CLIENT = {
  name: "Yusuf Benali",
  businessName: "HalalTech Solutions",
  sector: "Services IT pour PME",
  offer: "Externalisation IT complète pour PME de 10-50 salariés : maintenance, cybersécurité, cloud, support. Prix fixe mensuel 990€. Pas de surprise, pas de coût caché.",
  targetAudience: "Gérants de PME dans des secteurs traditionnels (bâtiment, commerce, restauration) qui sont dépassés par l'informatique et ont peur des pannes/piratage",
  objectives: "12 premiers clients en 90 jours, CA de 12 000€/mois en fin de trimestre",
  currentSituation: "0 départ",
  channels: ["LinkedIn", "Email", "Blog/SEO"],
  monthlyBudget: "500",
  additionalInfo: ""
}

// ============================================================================
// PILLAR COLORS
// ============================================================================

const PILLAR_COLORS = ['#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F97316']

function getPillarColor(pillar, allPillars) {
  const idx = allPillars.indexOf(pillar)
  return PILLAR_COLORS[idx >= 0 ? idx % PILLAR_COLORS.length : 0]
}

// ============================================================================
// TOAST NOTIFICATION
// ============================================================================

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning' : 'bg-success'
  return (
    <div className={`fixed top-4 right-4 z-50 ${bg} text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in`}>
      {type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
      <span className="font-body text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
    </div>
  )
}

// ============================================================================
// BADGE COMPONENT
// ============================================================================

function Badge({ label, color = 'violet' }) {
  const colors = {
    violet: 'bg-accent-primary/20 text-accent-secondary',
    green: 'bg-success/20 text-success',
    orange: 'bg-warning/20 text-warning',
    red: 'bg-danger/20 text-danger',
    blue: 'bg-blue-500/20 text-blue-400',
    gray: 'bg-text-muted/20 text-text-secondary',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.violet}`}>
      {label}
    </span>
  )
}

function StatusBadge({ status }) {
  const map = {
    'onboarding': { label: 'Onboarding', color: 'orange' },
    'active': { label: 'Actif', color: 'green' },
    'paused': { label: 'En pause', color: 'gray' },
    'À faire': { label: 'À faire', color: 'orange' },
    'En cours': { label: 'En cours', color: 'blue' },
    'Publié': { label: 'Publié', color: 'green' },
  }
  const m = map[status] || { label: status, color: 'gray' }
  return <Badge label={m.label} color={m.color} />
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

function ProgressBar({ value, max = 100, size = 'md' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5'
  return (
    <div className={`w-full ${h} bg-bg-tertiary rounded-full overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-500`}
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, #7C3AED ${0}%, #F59E0B ${100}%)`,
        }}
      />
    </div>
  )
}

// ============================================================================
// INLINE EDITABLE TEXT
// ============================================================================

function EditableText({ value, onChange, tag = 'span', className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  if (!editing) {
    const Tag = tag
    return (
      <Tag
        className={`${className} cursor-pointer hover:bg-bg-tertiary/50 rounded px-1 -mx-1 transition`}
        onDoubleClick={() => setEditing(true)}
        title="Double-cliquer pour modifier"
      >
        {value || '(vide)'}
      </Tag>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {tag === 'p' || tag === 'div' ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="flex-1 bg-bg-tertiary border border-border-custom rounded px-2 py-1 text-text-primary text-sm focus:border-accent-primary outline-none resize-y min-h-[60px]"
        />
      ) : (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="flex-1 bg-bg-tertiary border border-border-custom rounded px-2 py-1 text-text-primary text-sm focus:border-accent-primary outline-none"
        />
      )}
      <button onClick={() => { onChange(draft); setEditing(false) }} className="text-success hover:text-success/80"><Check size={16} /></button>
      <button onClick={() => { setDraft(value); setEditing(false) }} className="text-danger hover:text-danger/80"><X size={16} /></button>
    </div>
  )
}

// ============================================================================
// CARD COMPONENT
// ============================================================================

function Card({ children, className = '', glow = false, gold = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-bg-secondary border border-border-custom rounded-xl p-6 ${glow ? 'shadow-[0_0_20px_rgba(124,58,237,0.1)]' : ''} ${gold ? 'border-accent-gold/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''} ${onClick ? 'cursor-pointer hover:border-accent-primary/40 transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ============================================================================
// ACCORDION
// ============================================================================

function Accordion({ title, icon, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border-custom rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 bg-bg-secondary hover:bg-bg-tertiary/50 transition text-left"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-display font-semibold text-lg">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp size={20} className="text-text-secondary" /> : <ChevronDown size={20} className="text-text-secondary" />}
      </button>
      {open && <div className="p-5 bg-bg-secondary border-t border-border-custom">{children}</div>}
    </div>
  )
}

// ============================================================================
// GENERATION PIPELINE MODAL
// ============================================================================

const GENERATION_STEPS = [
  { label: "Analyse de l'offre en cours...", icon: "🔍" },
  { label: "Création des personas ICP...", icon: "👥" },
  { label: "Définition des piliers de contenu...", icon: "🎯" },
  { label: "Structuration des OKRs 12 mois...", icon: "📊" },
  { label: "Génération du calendrier éditorial...", icon: "📅" },
]

function GenerationModal({ step, totalSteps, isVisible }) {
  if (!isVisible) return null
  const pct = ((step + 1) / totalSteps) * 100
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-custom rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">{GENERATION_STEPS[Math.min(step, GENERATION_STEPS.length - 1)]?.icon || '⚡'}</div>
          <h3 className="font-display font-bold text-xl text-text-primary mb-2">Génération en cours</h3>
          <p className="text-text-secondary text-sm">
            {GENERATION_STEPS[Math.min(step, GENERATION_STEPS.length - 1)]?.label || 'Traitement...'}
          </p>
        </div>
        <div className="mb-4">
          <ProgressBar value={pct} />
        </div>
        <p className="text-center text-text-muted text-xs">
          Étape {step + 1} / {totalSteps} — Ne fermez pas cette page
        </p>
        <div className="flex justify-center mt-4">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SIDEBAR
// ============================================================================

function Sidebar({ activeView, setActiveView, clients, activeClientId, setActiveClientId, onNewClient }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'client', label: 'Fiche Client', icon: <UserPlus size={20} /> },
    { id: 'strategy', label: 'Stratégie & OKRs', icon: <Target size={20} /> },
    { id: 'calendar', label: 'Calendrier', icon: <Calendar size={20} /> },
    { id: 'kpis', label: 'Analyse KPIs', icon: <BarChart3 size={20} /> },
  ]

  const clientList = Object.values(clients)
  const statusDot = { active: 'bg-success', onboarding: 'bg-warning', paused: 'bg-text-muted' }

  return (
    <aside className="w-[240px] min-w-[240px] h-screen bg-bg-secondary border-r border-border-custom flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-border-custom">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-gold flex items-center justify-center font-display font-bold text-lg text-white">
            H
          </div>
          <div>
            <div className="font-display font-bold text-sm text-text-primary">Hijra's Agency</div>
            <div className="text-xs text-text-muted">Content OS</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted px-3">Navigation</span>
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
              activeView === item.id
                ? 'bg-accent-primary/15 text-accent-secondary font-medium'
                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* Client list */}
        <div className="mt-6 mb-2 flex items-center justify-between px-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Clients</span>
          <button onClick={onNewClient} className="text-accent-primary hover:text-accent-secondary transition" title="Nouveau client">
            <Plus size={16} />
          </button>
        </div>
        {clientList.map(c => (
          <button
            key={c.id}
            onClick={() => { setActiveClientId(c.id); setActiveView('client') }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${
              activeClientId === c.id
                ? 'bg-bg-tertiary text-text-primary'
                : 'text-text-secondary hover:bg-bg-tertiary/50'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-accent-primary/20 flex items-center justify-center text-xs font-bold text-accent-secondary relative">
              {c.name?.[0] || '?'}
              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${statusDot[c.status] || 'bg-text-muted'} ring-2 ring-bg-secondary`} />
            </div>
            <span className="truncate">{c.businessName || c.name}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border-custom">
        <div className="text-[10px] text-text-muted text-center">v1.0 — Content OS by Hijra's Agency</div>
      </div>
    </aside>
  )
}

// ============================================================================
// TOP BAR
// ============================================================================

function TopBar({ activeClient, saved }) {
  return (
    <header className="h-14 border-b border-border-custom bg-bg-secondary/80 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {activeClient && (
          <>
            <span className="text-text-secondary text-sm">Client actif :</span>
            <span className="font-display font-semibold text-text-primary">{activeClient.businessName || activeClient.name}</span>
            <StatusBadge status={activeClient.status} />
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-xs text-success">
            <Check size={14} /> Sauvegardé
          </span>
        )}
      </div>
    </header>
  )
}

// ============================================================================
// DASHBOARD VIEW
// ============================================================================

function DashboardView({ clients, setActiveView, setActiveClientId, onNewClient, onImportDemo }) {
  const clientList = Object.values(clients)
  const activeClients = clientList.filter(c => c.status === 'active')
  const totalContent = clientList.reduce((sum, c) => sum + (c.editorialCalendar?.length || 0), 0)
  const avgOkr = clientList.length > 0
    ? Math.round(clientList.reduce((sum, c) => {
        if (!c.okrs?.length) return sum
        const krValues = c.okrs.flatMap(o => o.keyResults || [])
        if (!krValues.length) return sum
        const pct = krValues.reduce((s, kr) => {
          const curr = parseFloat(kr.currentValue) || 0
          const tgt = parseFloat(kr.target) || 1
          return s + Math.min(100, (curr / tgt) * 100)
        }, 0) / krValues.length
        return sum + pct
      }, 0) / clientList.length)
    : 0
  const needsAction = clientList.filter(c => c.status === 'active' && (!c.kpis?.length || !c.kpiAnalysis))

  const getSetupProgress = (c) => {
    let done = 0, total = 3
    if (c.strategy) done++
    if (c.editorialCalendar?.length) done++
    if (c.kpis?.length) done++
    return (done / total) * 100
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Vue d'ensemble de tous vos clients</p>
        </div>
        <div className="flex gap-3">
          {clientList.length === 0 && (
            <button onClick={onImportDemo} className="flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary border border-border-custom rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-accent-primary/40 transition">
              <Zap size={16} /> Importer démo
            </button>
          )}
          <button onClick={onNewClient} className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-accent-primary/20">
            <Plus size={16} /> Nouveau Client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Clients actifs', value: activeClients.length, icon: <Users size={20} />, color: 'text-accent-secondary' },
          { label: 'Contenus créés', value: totalContent, icon: <FileText size={20} />, color: 'text-success' },
          { label: 'OKR moyen', value: `${avgOkr}%`, icon: <Target size={20} />, color: 'text-accent-gold' },
          { label: 'Actions urgentes', value: needsAction.length, icon: <AlertCircle size={20} />, color: needsAction.length > 0 ? 'text-danger' : 'text-success' },
        ].map((stat, i) => (
          <Card key={i} glow>
            <div className="flex items-center justify-between mb-3">
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <div className="font-display font-bold text-2xl">{stat.value}</div>
            <div className="text-text-secondary text-xs mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Client list */}
      {clientList.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-5xl mb-4">🚀</div>
          <h3 className="font-display font-semibold text-lg mb-2">Aucun client pour le moment</h3>
          <p className="text-text-secondary text-sm mb-6">Ajoutez votre premier client ou importez le client de démonstration.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={onImportDemo} className="px-4 py-2 bg-bg-tertiary border border-border-custom rounded-lg text-sm hover:border-accent-primary/40 transition">
              Importer la démo
            </button>
            <button onClick={onNewClient} className="px-4 py-2 bg-accent-primary rounded-lg text-sm text-white hover:bg-accent-primary/90 transition">
              Créer un client
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientList.map(c => (
            <Card
              key={c.id}
              glow
              onClick={() => { setActiveClientId(c.id); setActiveView('client') }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center font-display font-bold text-accent-secondary">
                    {c.name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-display font-semibold">{c.businessName || c.name}</div>
                    <div className="text-text-muted text-xs">{c.sector}</div>
                  </div>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                  <span>Setup complet</span>
                  <span>{Math.round(getSetupProgress(c))}%</span>
                </div>
                <ProgressBar value={getSetupProgress(c)} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {c.strategy && <Badge label="Stratégie" color="green" />}
                  {c.editorialCalendar?.length > 0 && <Badge label="Calendrier" color="green" />}
                  {c.kpis?.length > 0 && <Badge label="KPIs" color="green" />}
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Urgent actions */}
      {needsAction.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <AlertTriangle size={20} className="text-warning" /> Actions urgentes
          </h2>
          <div className="space-y-2">
            {needsAction.map(c => (
              <Card key={c.id} className="flex items-center justify-between !p-4"
                onClick={() => { setActiveClientId(c.id); setActiveView('kpis') }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-warning" />
                  <span className="text-sm"><strong>{c.businessName}</strong> — KPIs mensuels non saisis/analysés</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CLIENT FORM / PROFILE VIEW
// ============================================================================

const EMPTY_FORM = {
  name: '', businessName: '', sector: '', offer: '', targetAudience: '',
  objectives: '', currentSituation: '0 départ', channels: [],
  monthlyBudget: '', additionalInfo: ''
}

const CHANNEL_OPTIONS = ['LinkedIn', 'Instagram', 'TikTok', 'Blog/SEO', 'Email', 'YouTube', 'Facebook']
const SITUATION_OPTIONS = ['0 départ', 'Déjà actif avec audience', 'Réactivation']

function ClientFormView({ client, onSave, onGenerate, isGenerating }) {
  const [form, setForm] = useState(client ? {
    name: client.name || '',
    businessName: client.businessName || '',
    sector: client.sector || '',
    offer: client.offer || '',
    targetAudience: client.targetAudience || '',
    objectives: client.objectives || '',
    currentSituation: client.currentSituation || '0 départ',
    channels: client.channels || [],
    monthlyBudget: client.monthlyBudget || '',
    additionalInfo: client.additionalInfo || '',
  } : { ...EMPTY_FORM })
  const [editing, setEditing] = useState(!client)
  const [showRegenWarning, setShowRegenWarning] = useState(false)

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name || '', businessName: client.businessName || '',
        sector: client.sector || '', offer: client.offer || '',
        targetAudience: client.targetAudience || '', objectives: client.objectives || '',
        currentSituation: client.currentSituation || '0 départ',
        channels: client.channels || [], monthlyBudget: client.monthlyBudget || '',
        additionalInfo: client.additionalInfo || '',
      })
      setEditing(false)
    } else {
      setForm({ ...EMPTY_FORM })
      setEditing(true)
    }
  }, [client?.id])

  const toggleChannel = (ch) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch]
    }))
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.offer.trim()) return
    onSave(form)
    setEditing(false)
  }

  const hasStrategy = client?.strategy

  // Profile view
  if (client && !editing) {
    return (
      <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-56px)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl">{client.businessName || client.name}</h1>
            <p className="text-text-secondary text-sm mt-1">Fiche client — {client.sector}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (hasStrategy) setShowRegenWarning(true)
                else setEditing(true)
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-bg-tertiary border border-border-custom rounded-lg text-sm hover:border-accent-primary/40 transition"
            >
              <Edit3 size={16} /> Modifier le brief
            </button>
          </div>
        </div>

        {showRegenWarning && (
          <Card className="!border-warning/30 !bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-warning mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Attention</p>
                <p className="text-text-secondary text-sm">Modifier le brief et régénérer la stratégie effacera toutes les données générées (stratégie, OKRs, calendrier). Les KPIs seront conservés.</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEditing(true); setShowRegenWarning(false) }} className="px-3 py-1.5 bg-warning text-black rounded text-sm font-medium">Modifier quand même</button>
                  <button onClick={() => setShowRegenWarning(false)} className="px-3 py-1.5 bg-bg-tertiary rounded text-sm">Annuler</button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Brief summary */}
        <Card glow>
          <h3 className="font-display font-semibold mb-4">Résumé du Brief</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-text-muted">Nom :</span> <span className="text-text-primary ml-2">{client.name}</span></div>
            <div><span className="text-text-muted">Entreprise :</span> <span className="text-text-primary ml-2">{client.businessName}</span></div>
            <div><span className="text-text-muted">Secteur :</span> <span className="text-text-primary ml-2">{client.sector}</span></div>
            <div><span className="text-text-muted">Budget :</span> <span className="text-text-primary ml-2">{client.monthlyBudget}€/mois</span></div>
            <div><span className="text-text-muted">Situation :</span> <span className="text-text-primary ml-2">{client.currentSituation}</span></div>
            <div><span className="text-text-muted">Canaux :</span> <span className="text-text-primary ml-2">{client.channels?.join(', ')}</span></div>
            <div className="col-span-2"><span className="text-text-muted">Offre :</span> <p className="text-text-primary mt-1">{client.offer}</p></div>
            <div className="col-span-2"><span className="text-text-muted">Cible :</span> <p className="text-text-primary mt-1">{client.targetAudience}</p></div>
            <div className="col-span-2"><span className="text-text-muted">Objectifs :</span> <p className="text-text-primary mt-1">{client.objectives}</p></div>
          </div>
        </Card>

        {/* Module status */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Stratégie', done: !!client.strategy, icon: <Target size={20} /> },
            { label: 'Calendrier', done: !!client.editorialCalendar?.length, icon: <Calendar size={20} /> },
            { label: 'KPIs', done: !!client.kpis?.length, icon: <BarChart3 size={20} /> },
          ].map((mod, i) => (
            <Card key={i} className={mod.done ? '!border-success/20' : ''}>
              <div className="flex items-center gap-3">
                <span className={mod.done ? 'text-success' : 'text-text-muted'}>{mod.icon}</span>
                <span className="font-medium text-sm">{mod.label}</span>
                {mod.done ? <Badge label="Complété" color="green" /> : <Badge label="En attente" color="gray" />}
              </div>
            </Card>
          ))}
        </div>

        {/* Generate button */}
        {!hasStrategy && (
          <button
            onClick={() => onGenerate(client.id)}
            disabled={isGenerating}
            className="w-full py-4 bg-gradient-to-r from-accent-primary to-accent-gold text-white font-display font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-accent-primary/20 disabled:opacity-50 text-lg"
          >
            {isGenerating ? 'Génération en cours...' : '⚡ Générer la stratégie complète'}
          </button>
        )}
      </div>
    )
  }

  // Form view
  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">{client ? 'Modifier le brief' : 'Nouveau client'}</h1>
          <p className="text-text-secondary text-sm mt-1">Remplissez le brief pour générer une stratégie complète</p>
        </div>
      </div>

      <Card glow>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Nom du client *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition" placeholder="Yusuf Benali" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Nom de l'entreprise</label>
              <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition" placeholder="HalalTech Solutions" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Secteur d'activité *</label>
              <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition" placeholder="Services IT pour PME" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Budget mensuel (€)</label>
              <input type="number" value={form.monthlyBudget} onChange={e => setForm(f => ({ ...f, monthlyBudget: e.target.value }))}
                className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition" placeholder="500" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Description de l'offre *</label>
            <textarea value={form.offer} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))} rows={3}
              className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition resize-y"
              placeholder="Ce qu'on vend, à qui, comment, à quel prix..." />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Cible supposée *</label>
            <textarea value={form.targetAudience} onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))} rows={2}
              className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition resize-y"
              placeholder="Qui sont les clients idéaux..." />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Objectifs trimestriels</label>
            <textarea value={form.objectives} onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))} rows={2}
              className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition resize-y"
              placeholder="CA visé, nombre de leads, clients..." />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Situation actuelle</label>
            <div className="flex gap-3">
              {SITUATION_OPTIONS.map(opt => (
                <button key={opt} onClick={() => setForm(f => ({ ...f, currentSituation: opt }))}
                  className={`px-4 py-2 rounded-lg text-sm border transition ${
                    form.currentSituation === opt
                      ? 'bg-accent-primary/15 border-accent-primary text-accent-secondary'
                      : 'bg-bg-tertiary border-border-custom text-text-secondary hover:border-accent-primary/40'
                  }`}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Canaux marketing</label>
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map(ch => (
                <button key={ch} onClick={() => toggleChannel(ch)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    form.channels.includes(ch)
                      ? 'bg-accent-primary/15 border-accent-primary text-accent-secondary'
                      : 'bg-bg-tertiary border-border-custom text-text-secondary hover:border-accent-primary/40'
                  }`}
                >{ch}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Informations complémentaires</label>
            <textarea value={form.additionalInfo} onChange={e => setForm(f => ({ ...f, additionalInfo: e.target.value }))} rows={2}
              className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none transition resize-y"
              placeholder="Contexte unique, contraintes, opportunités..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={!form.name.trim() || !form.offer.trim()}
              className="flex-1 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg font-display font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed">
              {client ? 'Sauvegarder les modifications' : 'Créer le client'}
            </button>
            {client && (
              <button onClick={() => setEditing(false)} className="px-6 py-3 bg-bg-tertiary border border-border-custom rounded-lg text-sm hover:border-accent-primary/40 transition">
                Annuler
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

// ============================================================================
// STRATEGY VIEW
// ============================================================================

function StrategyView({ client, onUpdateClient }) {
  if (!client?.strategy) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-56px)]">
        <Card className="text-center py-12 max-w-md">
          <Target size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">Aucune stratégie générée</h3>
          <p className="text-text-secondary text-sm">Rendez-vous dans la fiche client pour générer la stratégie complète.</p>
        </Card>
      </div>
    )
  }

  const strat = client.strategy
  const allPillarNames = (strat.contentPillars || []).map(p => p.name)

  const updateField = (path, value) => {
    const updated = JSON.parse(JSON.stringify(client))
    const keys = path.split('.')
    let obj = updated
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
    obj[keys[keys.length - 1]] = value
    onUpdateClient(updated)
  }

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-56px)]">
      <div>
        <h1 className="font-display font-bold text-2xl">Stratégie & OKRs</h1>
        <p className="text-text-secondary text-sm mt-1">{client.businessName} — {client.sector}</p>
      </div>

      {/* North Star Metric */}
      {client.northStarMetric && (
        <Card gold className="!p-5">
          <div className="flex items-center gap-3 mb-2">
            <Star size={24} className="text-accent-gold" />
            <span className="font-display font-bold text-lg text-accent-gold">North Star Metric</span>
          </div>
          <div className="text-xl font-display font-bold">{client.northStarMetric.metric}</div>
          <div className="text-text-secondary text-sm mt-1">
            Objectif 12 mois : {client.northStarMetric.target12months} — Type : {client.northStarMetric.type}
          </div>
        </Card>
      )}

      {/* Offer Analysis */}
      <Accordion title="Analyse de l'offre" icon={<Zap size={20} className="text-accent-gold" />} defaultOpen>
        {strat.killerFeature && (
          <Card gold className="mb-4 !p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-accent-gold" />
              <span className="font-display font-semibold text-accent-gold text-sm">Killer Feature</span>
            </div>
            <EditableText value={strat.killerFeature} onChange={v => updateField('strategy.killerFeature', v)} tag="p" className="text-text-primary" />
          </Card>
        )}

        {strat.usp && (
          <div className="mb-4 pl-4 border-l-2 border-accent-primary">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">USP</div>
            <EditableText value={strat.usp} onChange={v => updateField('strategy.usp', v)} tag="p" className="text-lg text-accent-secondary italic font-display" />
          </div>
        )}

        {strat.bleedingProblems?.length > 0 && (
          <div>
            <h4 className="font-display font-semibold text-sm mb-3 text-text-secondary">Problèmes Saignants</h4>
            <div className="space-y-3">
              {strat.bleedingProblems.map((bp, i) => (
                <Card key={i} className="!p-4 !bg-bg-tertiary/50">
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">🩸</span>
                    <div className="flex-1">
                      <EditableText value={bp.problem} onChange={v => {
                        const updated = [...strat.bleedingProblems]
                        updated[i] = { ...updated[i], problem: v }
                        updateField('strategy.bleedingProblems', updated)
                      }} className="font-semibold text-sm" />
                      <EditableText value={bp.description} onChange={v => {
                        const updated = [...strat.bleedingProblems]
                        updated[i] = { ...updated[i], description: v }
                        updateField('strategy.bleedingProblems', updated)
                      }} tag="p" className="text-text-secondary text-sm mt-1" />
                      {bp.emotionalImpact && <p className="text-xs text-accent-secondary mt-1">Impact : {bp.emotionalImpact}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Accordion>

      {/* Personas */}
      <Accordion title="Personas (ICP)" icon={<Users size={20} className="text-accent-secondary" />} badge={<Badge label={`${strat.personas?.length || 0}`} color="violet" />}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(strat.personas || []).map((p, i) => (
            <Card key={i} glow className="min-w-[340px] max-w-[380px] flex-shrink-0 !p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center font-display font-bold text-accent-secondary">
                  {p.name?.[0]}
                </div>
                <div>
                  <div className="font-display font-semibold">{p.name}</div>
                  <div className="text-text-muted text-xs">{p.title}</div>
                </div>
              </div>
              {p.demographics && <p className="text-xs text-text-secondary mb-3">{p.demographics}</p>}
              <div className="mb-3">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Frustrations</div>
                <ul className="space-y-1">
                  {(p.frustrations || p.painPoints || []).slice(0, 3).map((f, j) => (
                    <li key={j} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-danger mt-0.5">•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              {p.jobToBeDone && (
                <div className="mb-3">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Job-to-be-Done</div>
                  <p className="text-sm text-text-primary">{p.jobToBeDone}</p>
                </div>
              )}
              {p.infoSources?.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Sources d'info</div>
                  <div className="flex flex-wrap gap-1">
                    {p.infoSources.map((s, j) => <Badge key={j} label={s} color="gray" />)}
                  </div>
                </div>
              )}
              {p.funnelStage && <Badge label={p.funnelStage} color="blue" />}
              {p.typicalLanguage && (
                <div className="mt-3 p-2 bg-bg-tertiary rounded text-xs text-text-secondary italic">
                  "{p.typicalLanguage}"
                </div>
              )}
            </Card>
          ))}
        </div>
      </Accordion>

      {/* Editorial Charter */}
      <Accordion title="Charte Éditoriale" icon={<FileText size={20} className="text-success" />}>
        {strat.editorialCharter && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="!p-4 !bg-bg-tertiary/50">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Ton éditorial</div>
                <p className="font-semibold">{strat.editorialCharter.tone}</p>
                {strat.editorialCharter.toneJustification && (
                  <p className="text-xs text-text-secondary mt-1">{strat.editorialCharter.toneJustification}</p>
                )}
              </Card>
              <Card className="!p-4 !bg-bg-tertiary/50">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Anti-Personas</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(strat.editorialCharter.antiPersonas || []).map((a, i) => <Badge key={i} label={a} color="red" />)}
                </div>
              </Card>
            </div>
            {strat.editorialCharter.rules?.length > 0 && (
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Règles de ton et de style</div>
                <div className="space-y-1.5">
                  {strat.editorialCharter.rules.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-accent-primary font-mono">{i + 1}.</span>
                      <span className="text-text-secondary">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Accordion>

      {/* Content Pillars */}
      <Accordion title="Piliers de contenu" icon={<Flame size={20} className="text-accent-gold" />} badge={<Badge label={`${strat.contentPillars?.length || 0}`} color="orange" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(strat.contentPillars || []).map((p, i) => (
            <Card key={i} className="!p-4" style={{ borderLeftColor: getPillarColor(p.name, allPillarNames), borderLeftWidth: '3px' }}>
              <div className="font-display font-semibold mb-1">{p.name}</div>
              <p className="text-sm text-text-secondary mb-2">{p.description}</p>
              {p.painAddressed && <p className="text-xs text-danger/80 mb-2">Douleur : {p.painAddressed}</p>}
              <div className="flex flex-wrap gap-1">
                {(p.contentTypes || []).map((t, j) => <Badge key={j} label={t} color="gray" />)}
              </div>
            </Card>
          ))}
        </div>
      </Accordion>

      {/* OKRs */}
      <Accordion title="OKRs 12 mois" icon={<Target size={20} className="text-accent-primary" />} badge={<Badge label={`${client.okrs?.length || 0} objectifs`} color="violet" />}>
        <div className="space-y-4">
          {(client.okrs || []).map((okr, i) => (
            <Card key={i} className="!p-5">
              <div className="font-display font-semibold mb-3">
                <span className="text-accent-primary mr-2">O{i + 1}.</span>
                <EditableText value={okr.objective} onChange={v => {
                  const updated = [...client.okrs]
                  updated[i] = { ...updated[i], objective: v }
                  updateField('okrs', updated)
                }} className="inline" />
              </div>
              <div className="space-y-2 mb-3">
                {(okr.keyResults || []).map((kr, j) => {
                  const curr = parseFloat(kr.currentValue) || 0
                  const tgt = parseFloat(kr.target) || 1
                  const pct = Math.min(100, (curr / tgt) * 100)
                  return (
                    <div key={j} className="flex items-center gap-3">
                      <span className="text-xs text-text-muted font-mono w-8">KR{j + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-secondary">{kr.metric}</span>
                          <span className="text-text-muted">{kr.currentValue || 0} / {kr.target} {kr.unit || ''}</span>
                        </div>
                        <ProgressBar value={pct} size="sm" />
                      </div>
                    </div>
                  )
                })}
              </div>
              {okr.actions?.length > 0 && (
                <div className="text-xs text-text-muted">
                  Actions : {okr.actions.join(' • ')}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Accordion>

      {/* AARRR */}
      {client.aarrr && (
        <Accordion title="Stratégie AARRR" icon={<TrendingUp size={20} className="text-success" />}>
          <div className="grid grid-cols-5 gap-3">
            {[
              { key: 'acquisition', label: 'Acquisition', color: 'text-blue-400' },
              { key: 'activation', label: 'Activation', color: 'text-accent-secondary' },
              { key: 'retention', label: 'Rétention', color: 'text-success' },
              { key: 'referral', label: 'Recommandation', color: 'text-accent-gold' },
              { key: 'revenue', label: 'Revenu', color: 'text-danger' },
            ].map(phase => {
              const data = client.aarrr[phase.key]
              if (!data) return null
              return (
                <Card key={phase.key} className="!p-4">
                  <div className={`font-display font-semibold text-sm mb-2 ${phase.color}`}>{phase.label}</div>
                  <div className="text-xs text-text-secondary mb-2">{data.objective}</div>
                  <div className="space-y-1">
                    {(data.sources || data.methods || []).map((s, i) => (
                      <div key={i} className="text-xs text-text-muted">• {s}</div>
                    ))}
                  </div>
                  <div className="text-xs text-accent-primary mt-2 font-mono">
                    {data.conversionRate || data.retentionRate || data.kFactor || data.mrr || ''}
                  </div>
                </Card>
              )
            })}
          </div>
        </Accordion>
      )}
    </div>
  )
}

// ============================================================================
// EDITORIAL CALENDAR VIEW
// ============================================================================

function CalendarView({ client, onUpdateClient, onGenerateCalendar, isGenerating }) {
  const [viewMode, setViewMode] = useState('table')
  const [filters, setFilters] = useState({ pillar: '', channel: '', funnelStage: '', status: '' })

  if (!client) {
    return <EmptyState icon={<Calendar size={48} />} text="Sélectionnez un client" />
  }

  const calendar = client.editorialCalendar || []
  const allPillarNames = [...new Set(calendar.map(c => c.pillar))]
  const allChannels = [...new Set(calendar.map(c => c.channel))]
  const allStages = [...new Set(calendar.map(c => c.funnelStage))]

  const filtered = calendar.filter(item => {
    if (filters.pillar && item.pillar !== filters.pillar) return false
    if (filters.channel && item.channel !== filters.channel) return false
    if (filters.funnelStage && item.funnelStage !== filters.funnelStage) return false
    if (filters.status && item.status !== filters.status) return false
    return true
  })

  const updateItemStatus = (dayIndex, newStatus) => {
    const updated = JSON.parse(JSON.stringify(client))
    const item = updated.editorialCalendar.find(c => c.day === dayIndex)
    if (item) item.status = newStatus
    onUpdateClient(updated)
  }

  const exportCSV = () => {
    const headers = ['Jour', 'Pilier', 'Persona', 'Titre', 'Angle', 'Format', 'Canal', 'Funnel', 'Hook', 'Statut']
    const rows = calendar.map(c => [
      c.day, c.pillar, c.targetPersona, c.title, c.emotionalAngle, c.format, c.channel, c.funnelStage, c.hook, c.status
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calendrier-${client.businessName || 'client'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!calendar.length) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-56px)]">
        <Card className="text-center py-12 max-w-md">
          <Calendar size={48} className="text-text-muted mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg mb-2">Calendrier non généré</h3>
          <p className="text-text-secondary text-sm mb-6">
            {client.strategy ? 'La stratégie est prête. Générez le calendrier éditorial.' : "Générez d'abord la stratégie dans la fiche client."}
          </p>
          {client.strategy && (
            <button
              onClick={() => onGenerateCalendar(client.id)}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-accent-primary to-accent-gold text-white rounded-lg font-display font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isGenerating ? 'Génération...' : '📅 Générer 30 jours de contenu'}
            </button>
          )}
        </Card>
      </div>
    )
  }

  const activeFilters = Object.entries(filters).filter(([, v]) => v)

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Calendrier Éditorial</h1>
          <p className="text-text-secondary text-sm mt-1">{calendar.length} contenus — {client.businessName}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-bg-tertiary rounded-lg border border-border-custom overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
              <Grid size={16} />
            </button>
          </div>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border-custom rounded-lg text-sm text-text-secondary hover:text-text-primary transition">
            <Download size={16} /> CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filters.pillar} onChange={e => setFilters(f => ({ ...f, pillar: e.target.value }))}
          className="bg-bg-tertiary border border-border-custom rounded-lg px-3 py-2 text-sm text-text-secondary focus:border-accent-primary outline-none">
          <option value="">Tous les piliers</option>
          {allPillarNames.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.channel} onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}
          className="bg-bg-tertiary border border-border-custom rounded-lg px-3 py-2 text-sm text-text-secondary focus:border-accent-primary outline-none">
          <option value="">Tous les canaux</option>
          {allChannels.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.funnelStage} onChange={e => setFilters(f => ({ ...f, funnelStage: e.target.value }))}
          className="bg-bg-tertiary border border-border-custom rounded-lg px-3 py-2 text-sm text-text-secondary focus:border-accent-primary outline-none">
          <option value="">Tout le funnel</option>
          {allStages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="bg-bg-tertiary border border-border-custom rounded-lg px-3 py-2 text-sm text-text-secondary focus:border-accent-primary outline-none">
          <option value="">Tous les statuts</option>
          <option value="À faire">À faire</option>
          <option value="En cours">En cours</option>
          <option value="Publié">Publié</option>
        </select>
        {activeFilters.length > 0 && (
          <button onClick={() => setFilters({ pillar: '', channel: '', funnelStage: '', status: '' })}
            className="text-xs text-danger hover:text-danger/80 flex items-center gap-1">
            <X size={14} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="border border-border-custom rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-tertiary text-left">
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">J</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">Pilier</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">ICP</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs min-w-[200px]">Titre</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">Angle</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">Format</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">Canal</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">Funnel</th>
                  <th className="px-4 py-3 text-text-muted font-medium text-xs">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} className="border-t border-border-custom hover:bg-bg-tertiary/30 transition">
                    <td className="px-4 py-3 font-mono text-text-muted">{item.day}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getPillarColor(item.pillar, allPillarNames) }} />
                        <span className="text-xs">{item.pillar}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{item.targetPersona}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{item.title}</div>
                      {item.hook && <div className="text-xs text-text-muted mt-0.5 italic truncate max-w-[300px]">{item.hook}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={item.emotionalAngle} color={
                        item.emotionalAngle === 'Panique' ? 'red' : item.emotionalAngle === 'Colère' ? 'orange' :
                        item.emotionalAngle === 'Joie' ? 'green' : 'blue'
                      } />
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{item.format}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{item.channel}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{item.funnelStage}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={e => updateItemStatus(item.day, e.target.value)}
                        className="bg-bg-tertiary border border-border-custom rounded px-2 py-1 text-xs focus:border-accent-primary outline-none"
                      >
                        <option value="À faire">À faire</option>
                        <option value="En cours">En cours</option>
                        <option value="Publié">Publié</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-7 gap-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="text-center text-xs text-text-muted font-medium py-2">{d}</div>
          ))}
          {Array.from({ length: 35 }, (_, i) => {
            const day = i + 1
            const items = filtered.filter(c => c.day === day)
            if (day > 30) return <div key={i} />
            return (
              <div key={i} className="bg-bg-secondary border border-border-custom rounded-lg p-2 min-h-[100px] hover:border-accent-primary/30 transition">
                <div className="text-xs text-text-muted mb-1 font-mono">J{day}</div>
                {items.map((item, j) => (
                  <div key={j} className="text-xs p-1.5 rounded mb-1" style={{ backgroundColor: getPillarColor(item.pillar, allPillarNames) + '20', borderLeft: `2px solid ${getPillarColor(item.pillar, allPillarNames)}` }}>
                    <div className="font-medium text-text-primary truncate">{item.title}</div>
                    <div className="text-text-muted truncate">{item.format}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// KPI VIEW
// ============================================================================

const KPI_FIELDS = {
  acquisition: [
    { key: 'blogTraffic', label: 'Trafic blog', unit: 'visites' },
    { key: 'socialImpressions', label: 'Impressions réseaux sociaux', unit: 'impressions' },
    { key: 'organicReach', label: 'Portée organique', unit: 'personnes' },
    { key: 'newFollowers', label: 'Nouveaux followers', unit: 'followers' },
  ],
  activation: [
    { key: 'engagementRate', label: "Taux d'engagement moyen", unit: '%' },
    { key: 'ctaClicks', label: 'Clics sur CTA', unit: 'clics' },
    { key: 'emailOpenRate', label: "Taux d'ouverture email", unit: '%' },
  ],
  conversion: [
    { key: 'leadsGenerated', label: 'Leads générés', unit: 'leads' },
    { key: 'demosBooked', label: 'Démos/appels', unit: 'appels' },
    { key: 'newClients', label: 'Nouveaux clients', unit: 'clients' },
  ],
  retention: [
    { key: 'retentionRate', label: 'Taux de rétention', unit: '%' },
    { key: 'nps', label: 'NPS', unit: 'score' },
  ],
  revenue: [
    { key: 'monthlyRevenue', label: 'CA du mois', unit: '€' },
    { key: 'cumulativeRevenue', label: 'CA cumulé', unit: '€' },
    { key: 'averageBasket', label: 'Panier moyen', unit: '€' },
  ],
}

function KPIView({ client, onUpdateClient, onAnalyzeKPIs, isGenerating }) {
  const [kpiForm, setKpiForm] = useState({})
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [comment, setComment] = useState('')

  if (!client) {
    return <EmptyState icon={<BarChart3 size={48} />} text="Sélectionnez un client" />
  }

  const kpis = client.kpis || []
  const analysis = client.kpiAnalysis

  const handleKpiChange = (key, value) => {
    const updated = { ...kpiForm, [key]: value }
    setKpiForm(updated)
    // Real-time save
    const updatedClient = JSON.parse(JSON.stringify(client))
    updatedClient.kpiDraft = { month, data: updated, comment }
    onUpdateClient(updatedClient)
  }

  const handleAnalyze = () => {
    const kpiData = { month, ...kpiForm, comment }
    onAnalyzeKPIs(client.id, kpiData)
  }

  // Chart data
  const revenueData = kpis.map(k => ({ month: k.month, CA: parseFloat(k.monthlyRevenue) || 0 }))
  const leadsData = kpis.map(k => ({
    month: k.month,
    Leads: parseFloat(k.leadsGenerated) || 0,
    Objectif: 10, // Could be derived from OKRs
  }))

  const aarrr = client.aarrr
  const radarData = aarrr ? [
    { phase: 'Acquisition', score: analysis?.aarrrScores?.acquisition || 3 },
    { phase: 'Activation', score: analysis?.aarrrScores?.activation || 3 },
    { phase: 'Rétention', score: analysis?.aarrrScores?.retention || 3 },
    { phase: 'Recommandation', score: analysis?.aarrrScores?.referral || 3 },
    { phase: 'Revenu', score: analysis?.aarrrScores?.revenue || 3 },
  ] : []

  const scoreColor = (s) => s >= 7 ? '#10B981' : s >= 5 ? '#F59E0B' : '#EF4444'

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-56px)]">
      <div>
        <h1 className="font-display font-bold text-2xl">Analyse KPIs</h1>
        <p className="text-text-secondary text-sm mt-1">{client.businessName} — Performance mensuelle</p>
      </div>

      {/* KPI Input Form */}
      <Accordion title="Saisie des KPIs mensuels" icon={<Edit3 size={20} className="text-accent-primary" />} defaultOpen={!analysis}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Mois</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none" />
          </div>

          {Object.entries(KPI_FIELDS).map(([category, fields]) => (
            <div key={category}>
              <h4 className="font-display font-semibold text-sm mb-3 capitalize text-text-secondary">
                {category === 'acquisition' ? '📈 Acquisition' : category === 'activation' ? '⚡ Activation' :
                 category === 'conversion' ? '🎯 Conversion' : category === 'retention' ? '🔄 Rétention' : '💰 Revenu'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs text-text-muted mb-1">{f.label}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={kpiForm[f.key] || ''}
                        onChange={e => handleKpiChange(f.key, e.target.value)}
                        className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-3 py-2 text-sm focus:border-accent-primary outline-none pr-12"
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm text-text-secondary mb-1.5">Commentaire libre</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              className="w-full bg-bg-tertiary border border-border-custom rounded-lg px-4 py-2.5 text-sm focus:border-accent-primary outline-none resize-y"
              placeholder="Événements exceptionnels, contexte du mois..."
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isGenerating || Object.values(kpiForm).every(v => !v)}
            className="w-full py-3 bg-gradient-to-r from-accent-primary to-accent-gold text-white rounded-lg font-display font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            {isGenerating ? 'Analyse en cours...' : '📊 Analyser avec l\'IA'}
          </button>
        </div>
      </Accordion>

      {/* KPI Charts */}
      {kpis.length > 0 && (
        <Accordion title="Dashboard de visualisation" icon={<BarChart3 size={20} className="text-success" />} defaultOpen>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {revenueData.length > 0 && (
              <Card className="!p-4">
                <h4 className="font-display font-semibold text-sm mb-4">CA mensuel</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
                    <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="CA" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED' }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            )}

            {leadsData.length > 0 && (
              <Card className="!p-4">
                <h4 className="font-display font-semibold text-sm mb-4">Leads vs Objectif</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={leadsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1E2E" />
                    <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: '8px' }} />
                    <Bar dataKey="Leads" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Objectif" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {radarData.length > 0 && (
              <Card className="!p-4">
                <h4 className="font-display font-semibold text-sm mb-4">Performance AARRR</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1E1E2E" />
                    <PolarAngleAxis dataKey="phase" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#475569', fontSize: 10 }} />
                    <Radar dataKey="score" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* OKR Progress */}
            {client.okrs?.length > 0 && (
              <Card className="!p-4">
                <h4 className="font-display font-semibold text-sm mb-4">Progression OKRs</h4>
                <div className="space-y-4">
                  {client.okrs.slice(0, 3).map((okr, i) => (
                    <div key={i}>
                      <div className="text-xs text-text-secondary mb-2 truncate">O{i + 1}: {okr.objective}</div>
                      {(okr.keyResults || []).map((kr, j) => {
                        const curr = parseFloat(kr.currentValue) || 0
                        const tgt = parseFloat(kr.target) || 1
                        const pct = Math.min(100, (curr / tgt) * 100)
                        return (
                          <div key={j} className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-text-muted">{kr.metric}</span>
                              <span className={pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-danger'}>
                                {Math.round(pct)}%
                              </span>
                            </div>
                            <ProgressBar value={pct} size="sm" />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </Accordion>
      )}

      {/* AI Analysis */}
      {analysis && (
        <Accordion title="Analyse IA & Recommandations" icon={<Zap size={20} className="text-accent-gold" />} defaultOpen>
          <div className="space-y-6">
            {/* Global score */}
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#1E1E2E" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={scoreColor(analysis.globalScore)}
                    strokeWidth="8" strokeDasharray={`${(analysis.globalScore / 10) * 264} 264`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display font-bold text-2xl" style={{ color: scoreColor(analysis.globalScore) }}>
                    {analysis.globalScore}
                  </span>
                </div>
              </div>
              <div>
                <div className="font-display font-semibold text-lg">Score de performance</div>
                <p className="text-text-secondary text-sm">{analysis.scoreJustification}</p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="!p-4 !border-success/20">
                <h4 className="font-display font-semibold text-sm mb-3 text-success">Points forts</h4>
                <ul className="space-y-2">
                  {(analysis.strengths || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <TrendingUp size={14} className="text-success mt-0.5 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="!p-4 !border-danger/20">
                <h4 className="font-display font-semibold text-sm mb-3 text-danger">Améliorations</h4>
                <ul className="space-y-2">
                  {(analysis.improvements || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <TrendingDown size={14} className="text-danger mt-0.5 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Funnel bottleneck */}
            {analysis.funnelBottleneck && (
              <Card className="!p-4 !border-warning/20">
                <h4 className="font-display font-semibold text-sm mb-2 text-warning">Goulot d'étranglement</h4>
                <p className="text-sm"><strong>{analysis.funnelBottleneck.phase}</strong> — {analysis.funnelBottleneck.diagnosis}</p>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div>
                <h4 className="font-display font-semibold text-sm mb-3">Recommandations actionnables</h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((r, i) => (
                    <Card key={i} className="!p-4 flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        r.priority === 1 ? 'bg-danger/20 text-danger' :
                        r.priority === 2 ? 'bg-warning/20 text-warning' :
                        'bg-accent-primary/20 text-accent-secondary'
                      }`}>
                        P{r.priority}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{r.action}</p>
                        <p className="text-xs text-text-muted mt-1">Impact : {r.expectedImpact} — {r.timeframe}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy adjustment */}
            {analysis.strategyAdjustment?.needed && (
              <Card className="!p-4 !border-accent-primary/30">
                <h4 className="font-display font-semibold text-sm mb-2 text-accent-secondary">Ajustement stratégique</h4>
                <p className="text-sm text-text-secondary mb-2">{analysis.strategyAdjustment.description}</p>
                <ul className="space-y-1">
                  {(analysis.strategyAdjustment.specificChanges || []).map((c, i) => (
                    <li key={i} className="text-xs text-text-muted flex items-start gap-2">
                      <ArrowRight size={12} className="mt-0.5 text-accent-primary" />{c}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Priority content */}
            {analysis.priorityContent && (
              <Card gold className="!p-4">
                <h4 className="font-display font-semibold text-sm mb-2 text-accent-gold">Contenu prioritaire</h4>
                <p className="text-sm"><strong>{analysis.priorityContent.type}</strong> — {analysis.priorityContent.reason}</p>
                {analysis.priorityContent.exampleTitle && (
                  <p className="text-xs text-text-muted mt-1 italic">Ex : "{analysis.priorityContent.exampleTitle}"</p>
                )}
              </Card>
            )}
          </div>
        </Accordion>
      )}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({ icon, text }) {
  return (
    <div className="p-6 flex items-center justify-center h-[calc(100vh-56px)]">
      <Card className="text-center py-12 max-w-md">
        <div className="text-text-muted mx-auto mb-4 flex justify-center">{icon}</div>
        <p className="text-text-secondary text-sm">{text}</p>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [clients, setClients] = useState({})
  const [activeClientId, setActiveClientId] = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [generationTotal, setGenerationTotal] = useState(3)
  const [toast, setToast] = useState(null)
  const [saved, setSaved] = useState(false)

  const activeClient = activeClientId ? clients[activeClientId] : null

  // Load from storage on mount
  useEffect(() => {
    const ids = storage.get('clients-list') || []
    const loaded = {}
    ids.forEach(id => {
      const c = storage.get(`client:${id}`)
      if (c) loaded[id] = c
    })
    setClients(loaded)
    if (ids.length > 0) setActiveClientId(ids[0])
  }, [])

  // Save helper
  const saveClient = useCallback((client) => {
    setClients(prev => {
      const next = { ...prev, [client.id]: client }
      storage.set(`client:${client.id}`, client)
      storage.set('clients-list', Object.keys(next))
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  // Create new client
  const handleNewClient = useCallback(() => {
    setActiveClientId(null)
    setActiveView('client')
  }, [])

  // Save client form
  const handleSaveClient = useCallback((formData) => {
    const id = activeClientId || generateId()
    const existing = clients[id] || {}
    const client = {
      ...existing,
      ...formData,
      id,
      createdAt: existing.createdAt || new Date().toISOString(),
      status: existing.status || 'onboarding',
    }
    saveClient(client)
    setActiveClientId(id)
    showToast('Client sauvegardé')
  }, [activeClientId, clients, saveClient, showToast])

  // Import demo client
  const handleImportDemo = useCallback(() => {
    const id = generateId()
    const client = {
      ...DEMO_CLIENT,
      id,
      createdAt: new Date().toISOString(),
      status: 'onboarding',
    }
    saveClient(client)
    setActiveClientId(id)
    setActiveView('client')
    showToast('Client démo importé')
  }, [saveClient, showToast])

  // Update client (for inline edits)
  const handleUpdateClient = useCallback((updatedClient) => {
    saveClient(updatedClient)
  }, [saveClient])

  // Delete client
  const handleDeleteClient = useCallback((id) => {
    setClients(prev => {
      const next = { ...prev }
      delete next[id]
      storage.remove(`client:${id}`)
      storage.set('clients-list', Object.keys(next))
      return next
    })
    if (activeClientId === id) {
      const remaining = Object.keys(clients).filter(k => k !== id)
      setActiveClientId(remaining[0] || null)
      setActiveView('dashboard')
    }
    showToast('Client supprimé')
  }, [activeClientId, clients, showToast])

  // ============ GENERATION PIPELINE ============

  const generateStrategy = useCallback(async (clientId) => {
    const client = clients[clientId]
    if (!client) return

    setIsGenerating(true)
    setGenerationStep(0)
    setGenerationTotal(3)

    try {
      // Step 1: Fundamental Strategy
      setGenerationStep(0)
      const stratPrompt = `Analyse ce brief client et génère la stratégie fondamentale.

Brief :
- Secteur : ${client.sector}
- Offre : ${client.offer}
- Cible supposée : ${client.targetAudience}
- Objectifs : ${client.objectives}
- Situation : ${client.currentSituation}
- Canaux : ${(client.channels || []).join(', ')}
- Budget : ${client.monthlyBudget}€/mois
- Contexte additionnel : ${client.additionalInfo || 'Aucun'}

Génère un JSON avec cette structure exacte :
{
  "killerFeature": "string — ce qui est fondamentalement différent/meilleur",
  "usp": "string — USP en 1 phrase percutante",
  "bleedingProblems": [
    { "problem": "string", "description": "string", "emotionalImpact": "string" }
  ],
  "personas": [
    {
      "name": "string",
      "title": "string",
      "demographics": "string",
      "realNeeds": ["string"],
      "painPoints": ["string"],
      "jobToBeDone": "string",
      "infoSources": ["string"],
      "funnelStage": "Awareness | Consideration | Decision",
      "typicalLanguage": "string",
      "frustrations": ["string", "string", "string"]
    }
  ],
  "editorialCharter": {
    "tone": "string",
    "toneJustification": "string",
    "antiPersonas": ["string"],
    "rules": ["string", "string", "string", "string", "string"]
  },
  "contentPillars": [
    {
      "name": "string",
      "description": "string",
      "painAddressed": "string",
      "contentTypes": ["string"]
    }
  ]
}`

      const strategy = await callAI(stratPrompt)

      // Save intermediate result
      const updated1 = { ...client, strategy, status: 'active', strategyGeneratedAt: new Date().toISOString() }
      saveClient(updated1)

      // Step 2: OKRs & AARRR
      setGenerationStep(1)
      const okrPrompt = `Sur la base de cette stratégie :
${JSON.stringify(strategy)}

Et du brief original :
- Objectifs : ${client.objectives}
- Budget : ${client.monthlyBudget}€/mois
- Canaux : ${(client.channels || []).join(', ')}

Génère les OKRs 12 mois et la stratégie AARRR en JSON :
{
  "northStarMetric": {
    "metric": "string",
    "type": "acquisition | activation | retention | revenue",
    "target12months": "string"
  },
  "okrs": [
    {
      "objective": "string",
      "keyResults": [
        { "metric": "string", "target": "string", "currentValue": "0", "unit": "string" }
      ],
      "actions": ["string"]
    }
  ],
  "aarrr": {
    "acquisition": { "sources": ["string"], "objective": "string", "conversionRate": "string" },
    "activation": { "methods": ["string"], "objective": "string", "conversionRate": "string" },
    "retention": { "methods": ["string"], "objective": "string", "retentionRate": "string" },
    "referral": { "methods": ["string"], "objective": "string", "kFactor": "string" },
    "revenue": { "methods": ["string"], "objective": "string", "mrr": "string" }
  }
}`

      const okrData = await callAI(okrPrompt)

      const updated2 = {
        ...updated1,
        northStarMetric: okrData.northStarMetric,
        okrs: okrData.okrs,
        aarrr: okrData.aarrr,
      }
      saveClient(updated2)

      // Step 3: Editorial Calendar
      setGenerationStep(2)
      const calPrompt = `Sur la base de cette stratégie complète :
Piliers : ${JSON.stringify(strategy.contentPillars)}
Personas : ${JSON.stringify(strategy.personas?.map(p => p.name))}
Canaux actifs : ${(client.channels || []).join(', ')}
Ton éditorial : ${strategy.editorialCharter?.tone || 'Professionnel'}

Génère exactement 30 pièces de contenu pour le calendrier éditorial.
Applique la règle 1=3 (angles Panique/Colère/Joie), couvre toutes les phases du funnel AARRR.
Assure-toi qu'aucun pilier n'est sur-représenté.

Génère un JSON :
{
  "calendar": [
    {
      "day": 1,
      "pillar": "string",
      "targetPersona": "string",
      "title": "string",
      "emotionalAngle": "Panique | Colère | Joie | Éducation",
      "format": "Post LinkedIn | Article Blog | Email | Réel | Story | Thread | Carrousel | Vidéo courte",
      "channel": "string",
      "funnelStage": "Déclencheur | Passif | Actif | Rétention | Upsell",
      "hook": "string — première phrase accrocheuse du contenu",
      "targetMetric": "string",
      "status": "À faire"
    }
  ]
}`

      const calData = await callAI(calPrompt)

      const updated3 = {
        ...updated2,
        editorialCalendar: calData.calendar || calData,
        calendarGeneratedAt: new Date().toISOString(),
      }
      saveClient(updated3)

      showToast('Stratégie complète générée avec succès !')
      setActiveView('strategy')

    } catch (err) {
      console.error('Generation error:', err)
      showToast(`Erreur : ${err.message}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [clients, saveClient, showToast])

  // Generate calendar separately
  const generateCalendar = useCallback(async (clientId) => {
    const client = clients[clientId]
    if (!client?.strategy) return

    setIsGenerating(true)
    setGenerationStep(2)
    setGenerationTotal(3)

    try {
      const strategy = client.strategy
      const calPrompt = `Sur la base de cette stratégie complète :
Piliers : ${JSON.stringify(strategy.contentPillars)}
Personas : ${JSON.stringify(strategy.personas?.map(p => p.name))}
Canaux actifs : ${(client.channels || []).join(', ')}
Ton éditorial : ${strategy.editorialCharter?.tone || 'Professionnel'}

Génère exactement 30 pièces de contenu pour le calendrier éditorial.
Applique la règle 1=3 (angles Panique/Colère/Joie), couvre toutes les phases du funnel AARRR.

Génère un JSON :
{
  "calendar": [
    {
      "day": 1,
      "pillar": "string",
      "targetPersona": "string",
      "title": "string",
      "emotionalAngle": "Panique | Colère | Joie | Éducation",
      "format": "Post LinkedIn | Article Blog | Email | Réel | Story | Thread | Carrousel | Vidéo courte",
      "channel": "string",
      "funnelStage": "Déclencheur | Passif | Actif | Rétention | Upsell",
      "hook": "string",
      "targetMetric": "string",
      "status": "À faire"
    }
  ]
}`

      const calData = await callAI(calPrompt)
      const updated = {
        ...client,
        editorialCalendar: calData.calendar || calData,
        calendarGeneratedAt: new Date().toISOString(),
      }
      saveClient(updated)
      showToast('Calendrier éditorial généré !')
    } catch (err) {
      showToast(`Erreur : ${err.message}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [clients, saveClient, showToast])

  // Analyze KPIs
  const analyzeKPIs = useCallback(async (clientId, kpiData) => {
    const client = clients[clientId]
    if (!client) return

    setIsGenerating(true)

    try {
      const prompt = `Tu es un analyste marketing expert. Analyse ces KPIs mensuels et génère des recommandations actionnables.

Client : ${client.name} — ${client.sector}
Stratégie définie : ${client.strategy ? `USP: ${client.strategy.usp}, Piliers: ${client.strategy.contentPillars?.map(p => p.name).join(', ')}` : 'Non définie'}
OKRs : ${client.okrs ? JSON.stringify(client.okrs.map(o => ({ objective: o.objective, krs: o.keyResults?.map(kr => `${kr.metric}: ${kr.currentValue}/${kr.target}`) }))) : 'Non définis'}

KPIs du mois de ${kpiData.month} :
${JSON.stringify(kpiData)}

Génère un JSON :
{
  "globalScore": 7,
  "scoreJustification": "string",
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "funnelBottleneck": { "phase": "string", "diagnosis": "string" },
  "aarrrScores": { "acquisition": 3, "activation": 4, "retention": 2, "referral": 3, "revenue": 4 },
  "recommendations": [
    { "priority": 1, "action": "string", "expectedImpact": "string", "timeframe": "string" }
  ],
  "strategyAdjustment": {
    "needed": false,
    "description": "string",
    "specificChanges": ["string"]
  },
  "priorityContent": {
    "type": "string",
    "reason": "string",
    "exampleTitle": "string"
  }
}`

      const analysis = await callAI(prompt)

      // Save KPIs + analysis
      const kpis = [...(client.kpis || [])]
      const existingIdx = kpis.findIndex(k => k.month === kpiData.month)
      if (existingIdx >= 0) kpis[existingIdx] = kpiData
      else kpis.push(kpiData)

      const updated = {
        ...client,
        kpis,
        kpiAnalysis: analysis,
        lastKpiAnalysis: new Date().toISOString(),
      }
      saveClient(updated)
      showToast('Analyse KPI complétée !')
    } catch (err) {
      showToast(`Erreur : ${err.message}`, 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [clients, saveClient, showToast])

  // ============ RENDER ============

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView
          clients={clients}
          setActiveView={setActiveView}
          setActiveClientId={setActiveClientId}
          onNewClient={handleNewClient}
          onImportDemo={handleImportDemo}
        />
      case 'client':
        return <ClientFormView
          client={activeClient}
          onSave={handleSaveClient}
          onGenerate={generateStrategy}
          isGenerating={isGenerating}
        />
      case 'strategy':
        return <StrategyView
          client={activeClient}
          onUpdateClient={handleUpdateClient}
        />
      case 'calendar':
        return <CalendarView
          client={activeClient}
          onUpdateClient={handleUpdateClient}
          onGenerateCalendar={generateCalendar}
          isGenerating={isGenerating}
        />
      case 'kpis':
        return <KPIView
          client={activeClient}
          onUpdateClient={handleUpdateClient}
          onAnalyzeKPIs={analyzeKPIs}
          isGenerating={isGenerating}
        />
      default:
        return <DashboardView clients={clients} setActiveView={setActiveView} setActiveClientId={setActiveClientId} onNewClient={handleNewClient} onImportDemo={handleImportDemo} />
    }
  }

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary font-body overflow-hidden">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        clients={clients}
        activeClientId={activeClientId}
        setActiveClientId={setActiveClientId}
        onNewClient={handleNewClient}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar activeClient={activeClient} saved={saved} />
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>

      <GenerationModal
        step={generationStep}
        totalSteps={generationTotal}
        isVisible={isGenerating}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  )
}
