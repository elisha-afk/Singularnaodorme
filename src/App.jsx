import { useEffect, useState } from 'react'
import {
  AlertTriangle, CheckCircle2, Eye, HandHeart, Heart, Lightbulb, Lock,
  Menu, MessageCircleWarning, Phone, Search, Send, ShieldCheck, UserRoundCheck,
  Users, X,
} from 'lucide-react'
import { findReport, submitReport } from './supabase.js'

const initialReport = {
  tipo: 'bullying',
  descricao: '',
  local: '',
  data_incidente: '',
  envolvidos: '',
  testemunhas: '',
  severidade: '',
  anonimo: true,
  nome: '',
  email: '',
  telefone: '',
  escola: '',
}

const statusLabels = {
  pendente: 'Em análise',
  investigando: 'Em investigação',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
}

function useHashRoute() {
  const getRoute = () => window.location.hash.slice(1) || '/'
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const syncRoute = () => setRoute(getRoute())
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  return route
}

function Nav() {
  const [open, setOpen] = useState(false)
  const closeMenu = () => setOpen(false)

  return (
    <header className="site-header">
      <div className="nav-shell">
        <a className="brand" href="#/" onClick={closeMenu}>
          <ShieldCheck aria-hidden="true" />
          <span>SingularNãoDorme</span>
        </a>
        <button className="menu-toggle" type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="Abrir menu">
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'nav-links is-open' : 'nav-links'}>
          <a href="#/" onClick={closeMenu}>Home</a>
          <a href="#/relatar" onClick={closeMenu}>Denunciar</a>
          <a href="#/recursos" onClick={closeMenu}>Recursos</a>
          <a href="#/faq" onClick={closeMenu}>FAQ</a>
        </nav>
      </div>
    </header>
  )
}

function Home() {
  const cards = [
    { icon: Lock, color: 'blue', title: '100% Seguro', text: 'Seus dados são protegidos. Você decide se quer permanecer anônimo.' },
    { icon: UserRoundCheck, color: 'green', title: 'Anonimato Total', text: 'Denuncie sem medo de represálias e acompanhe pelo seu código.' },
    { icon: HandHeart, color: 'purple', title: 'Apoio Real', text: 'Informação e caminhos de apoio para você não enfrentar isso sozinho.' },
    { icon: CheckCircle2, color: 'red', title: 'Ação Rápida', text: 'Relatos organizados para que a equipe responsável possa agir.' },
  ]

  return (
    <main>
      <section className="hero">
        <div className="container hero-content">
          <h1><HandHeart aria-hidden="true" />Sua Voz é Segura Aqui</h1>
          <p>Uma plataforma segura, anônima e confidencial para relatar bullying e conflitos escolares.</p>
          <div className="hero-actions">
            <a className="button button-success" href="#/relatar"><MessageCircleWarning />Fazer uma Denúncia</a>
            <a className="button button-light" href="#/recursos"><Heart />Recursos de Apoio</a>
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <h2 className="section-title">Por que usar o SingularNãoDorme?</h2>
          <div className="feature-grid">
            {cards.map(({ icon: Icon, color, title, text }) => (
              <article className="feature-card" key={title}>
                <Icon className={`feature-icon ${color}`} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container two-column">
          <div>
            <h2>O que é bullying?</h2>
            <p>Bullying é uma agressão intencional e repetida, física, verbal, psicológica ou virtual, contra alguém em condição de vulnerabilidade.</p>
            <ul className="check-list">
              <li><CheckCircle2 /> <span><strong>Agressão verbal:</strong> xingamentos, ameaças e fofocas.</span></li>
              <li><CheckCircle2 /> <span><strong>Agressão física:</strong> empurrões, socos e chutes.</span></li>
              <li><CheckCircle2 /> <span><strong>Exclusão:</strong> isolamento ou deixar alguém de fora.</span></li>
              <li><CheckCircle2 /> <span><strong>Cyberbullying:</strong> agressões em redes sociais.</span></li>
            </ul>
          </div>
          <img className="support-image" src="https://images.unsplash.com/photo-1516387938699-c52646db42da?auto=format&fit=crop&w=900&q=80" alt="Estudantes se apoiando" />
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <h2>Realidade do bullying no Brasil</h2>
          <div className="stats-grid">
            <div><strong>37%</strong><span>dos estudantes sofreram bullying</span></div>
            <div><strong>62%</strong><span>testemunharam cenas de bullying</span></div>
            <div><strong>15%</strong><span>reportam ter praticado bullying</span></div>
          </div>
          <p className="source">Pesquisa PeNSE - Instituto Brasileiro de Geografia e Estatística</p>
        </div>
      </section>

      <section className="section section-muted cta-section">
        <div className="container">
          <h2>Você sofre com bullying?</h2>
          <p>Não fique sozinho. Faça sua denúncia de forma segura e anônima.</p>
          <a className="button button-success button-large" href="#/relatar"><Send />Denunciar agora</a>
        </div>
      </section>
    </main>
  )
}

function ReportPage() {
  const [report, setReport] = useState(initialReport)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [tracking, setTracking] = useState({ state: 'idle', message: '', data: null })

  function update(field, value) {
    setReport(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: '' }))
  }

  function validate() {
    const next = {}
    if (report.descricao.trim().length < 20) next.descricao = 'Descreva o ocorrido com pelo menos 20 caracteres.'
    if (!report.local.trim()) next.local = 'Indique o local do incidente.'
    if (!report.data_incidente) next.data_incidente = 'Indique a data do incidente.'
    if (!report.severidade) next.severidade = 'Selecione o nível de severidade.'
    if (!report.anonimo) {
      if (report.nome.trim().length < 3) next.nome = 'Informe seu nome.'
      if (!/^\S+@\S+\.\S+$/.test(report.email)) next.email = 'Informe um e-mail válido.'
      if (report.telefone.replace(/\D/g, '').length < 10) next.telefone = 'Informe um telefone válido.'
      if (!report.escola.trim()) next.escola = 'Informe sua escola.'
    }
    if (!agreed) next.terms = 'Você precisa concordar com os termos para enviar.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function send(event) {
    event.preventDefault()
    if (!validate()) return
    setStatus('sending')
    setResult(null)
    try {
      const data = await submitReport(report)
      setResult(data)
      setReport(initialReport)
      setAgreed(false)
      setStatus('success')
    } catch (error) {
      setResult({ error: error.message })
      setStatus('error')
    }
  }

  async function search(event) {
    event.preventDefault()
    if (!trackingCode.trim()) return setTracking({ state: 'error', message: 'Digite seu código de rastreamento.' })
    setTracking({ state: 'loading', message: '', data: null })
    try {
      const data = await findReport(trackingCode.trim().toUpperCase())
      setTracking({ state: 'success', data, message: '' })
    } catch (error) {
      setTracking({ state: 'error', message: error.message, data: null })
    }
  }

  return (
    <main className="report-page">
      <section className="report-hero"><div className="container"><h1><HandHeart />Faça sua denúncia</h1><p>Compartilhe com segurança, anonimato e confiança.</p></div></section>
      <div className="container report-container">
        <div className="safety-alert"><ShieldCheck /><div><strong>Sua segurança é prioridade.</strong><span>Você pode enviar o relato anonimamente e acompanhar o andamento por código.</span></div></div>
        <form className="report-form" onSubmit={send} noValidate>
          <div className="type-tabs">{['bullying', 'conflito', 'sugestao'].map(type => <button key={type} type="button" className={report.tipo === type ? 'active' : ''} onClick={() => update('tipo', type)}>{type}</button>)}</div>
          <FormField label="O que aconteceu?" error={errors.descricao}><textarea value={report.descricao} onChange={event => update('descricao', event.target.value)} placeholder="Descreva o incidente com o máximo de detalhes possível." /></FormField>
          <div className="form-grid"><FormField label="Onde aconteceu?" error={errors.local}><input value={report.local} onChange={event => update('local', event.target.value)} placeholder="Sala, pátio, corredor ou rede social" /></FormField><FormField label="Quando aconteceu?" error={errors.data_incidente}><input type="date" value={report.data_incidente} onChange={event => update('data_incidente', event.target.value)} /></FormField></div>
          <FormField label="Nível de severidade" error={errors.severidade}><select value={report.severidade} onChange={event => update('severidade', event.target.value)}><option value="">Selecione</option><option value="leve">Leve</option><option value="moderado">Moderado</option><option value="grave">Grave</option><option value="critico">Crítico</option></select></FormField>
          <FormField label="Quem estava envolvido? (opcional)"><textarea value={report.envolvidos} onChange={event => update('envolvidos', event.target.value)} /></FormField>
          <FormField label="Houve testemunhas? (opcional)"><textarea value={report.testemunhas} onChange={event => update('testemunhas', event.target.value)} /></FormField>
          <label className="anonymous-toggle"><input type="checkbox" checked={report.anonimo} onChange={event => update('anonimo', event.target.checked)} /><span><UserRoundCheck />Enviar denúncia de forma anônima</span></label>
          {!report.anonimo && <div className="identified-fields"><FormField label="Nome" error={errors.nome}><input value={report.nome} onChange={event => update('nome', event.target.value)} /></FormField><FormField label="E-mail" error={errors.email}><input type="email" value={report.email} onChange={event => update('email', event.target.value)} /></FormField><FormField label="Telefone" error={errors.telefone}><input value={report.telefone} onChange={event => update('telefone', event.target.value)} /></FormField><FormField label="Escola" error={errors.escola}><input value={report.escola} onChange={event => update('escola', event.target.value)} /></FormField></div>}
          <label className="terms"><input type="checkbox" checked={agreed} onChange={event => { setAgreed(event.target.checked); setErrors(current => ({ ...current, terms: '' })) }} />Declaro que as informações são verdadeiras e concordo com os Termos de Uso e a Política de Privacidade.</label>
          {errors.terms && <p className="field-error">{errors.terms}</p>}
          <button className="button button-success submit-button" disabled={status === 'sending'}>{status === 'sending' ? 'Enviando denúncia...' : <><Send />Enviar denúncia</>}</button>
          {status === 'error' && <p className="notice error">{result.error}</p>}
        </form>
        {status === 'success' && <section className="notice success"><CheckCircle2 /><div><h2>Denúncia enviada</h2><p>Guarde o seu código de rastreamento:</p><strong>{result.trackingCode}</strong><button type="button" className="text-button" onClick={() => setStatus('idle')}>Enviar outro relato</button></div></section>}
        <section className="tracking-card"><h2><Search />Rastrear sua denúncia</h2><p>Digite o código recebido ao enviar seu relato.</p><form onSubmit={search}><input value={trackingCode} onChange={event => setTrackingCode(event.target.value)} placeholder="Código de rastreamento" /><button className="button button-primary">Buscar</button></form>{tracking.state === 'loading' && <p>Buscando...</p>}{tracking.state === 'error' && <p className="notice error">{tracking.message}</p>}{tracking.state === 'success' && <div className="notice"><p><strong>Status:</strong> {statusLabels[tracking.data.status] || tracking.data.status}</p><p><strong>Tipo:</strong> {tracking.data.tipo}</p><p><strong>Data:</strong> {new Date(tracking.data.data_criacao).toLocaleDateString('pt-BR')}</p></div>}</section>
      </div>
    </main>
  )
}

function FormField({ label, error, children }) {
  return <label className="field"><span>{label}</span>{children}{error && <small>{error}</small>}</label>
}

function Resources() {
  return <InfoPage title="Recursos de apoio"><div className="resource-grid"><Resource icon={Phone} title="CVV" text="Ligue 188. Apoio emocional gratuito, 24 horas." /><Resource icon={AlertTriangle} title="Emergência" text="Em risco imediato, ligue 190." /><Resource icon={Heart} title="Disque 100" text="Canal para denunciar violações de direitos humanos." /></div></InfoPage>
}

function Resource({ icon: Icon, title, text }) {
  return <article className="resource-card"><Icon /><h2>{title}</h2><p>{text}</p></article>
}

function InfoPage({ title, children }) {
  return <main className="info-page"><div className="container"><h1>{title}</h1>{children}</div></main>
}

function Faq() {
  return <InfoPage title="Perguntas frequentes"><div className="faq-list"><article><h2>Posso denunciar anonimamente?</h2><p>Sim. Nenhum dado pessoal é obrigatório quando a opção de anonimato está ativa.</p></article><article><h2>Como acompanho o relato?</h2><p>Guarde o código de rastreamento exibido ao final do envio e use a seção de acompanhamento.</p></article></div></InfoPage>
}

function Footer() {
  return <footer><div className="container footer-grid"><div><h2>Precisa de ajuda imediata?</h2><p>CVV: <strong>188</strong> · Emergência: <strong>190</strong> · Direitos Humanos: <strong>100</strong></p></div><p>© 2026 SingularNãoDorme. Sua voz segura contra o bullying.</p></div></footer>
}

export default function App() {
  const route = useHashRoute()
  const page = route === '/relatar' ? <ReportPage /> : route === '/recursos' ? <Resources /> : route === '/faq' ? <Faq /> : <Home />
  return <><Nav />{page}<Footer /></>
}