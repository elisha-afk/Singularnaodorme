import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ExternalLink,
  HandHeart, Heart, Lock, Menu, MessageCircleWarning, Phone, Search, Send,
  ShieldCheck, Sparkles, UserRoundCheck, X,
} from 'lucide-react'
import { fetchSchoolUnits, findReport, submitReport } from './supabase.js'
import studentsSupportImage from './assets/students-support.jpg'
import AdminApp from './Admin.jsx'

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

const reportTypes = [
  { value: 'bullying', label: 'Bullying' },
  { value: 'conflito', label: 'Conflito' },
  { value: 'sugestao', label: 'Ideia para a escola' },
]

const reportTypeLabels = Object.fromEntries(reportTypes.map(({ value, label }) => [value, label]))

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
          <img className="support-image" src={studentsSupportImage} alt="Estudantes realizando uma atividade escolar" />
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
  const formRef = useRef(null)
  const [report, setReport] = useState(initialReport)
  const [step, setStep] = useState(1)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [tracking, setTracking] = useState({ state: 'idle', message: '', data: null })
  const [units, setUnits] = useState([])
  const [unitsLoading, setUnitsLoading] = useState(true)
  const [unitsError, setUnitsError] = useState('')

  useEffect(() => {
    async function loadUnits() {
      setUnitsLoading(true)
      try {
        const data = await fetchSchoolUnits()
        setUnits(data.units || [])
        setUnitsError('')
      } catch (error) {
        setUnits([])
        setUnitsError(error.message)
      } finally {
        setUnitsLoading(false)
      }
    }
    loadUnits()
  }, [])

  function update(field, value) {
    setReport(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: '' }))
  }

  function selectType(type) {
    setReport(current => ({
      ...current,
      tipo: type,
      data_incidente: type === 'sugestao' && !current.data_incidente
        ? new Date().toISOString().slice(0, 10)
        : current.data_incidente,
    }))
    setErrors({})
  }

  function validate(fields = 'all') {
    const next = {}
    if (fields === 'all' || fields === 1) {
      if (!report.severidade) next.severidade = 'Selecione como você avalia a situação.'
    }
    if (fields === 'all' || fields === 2) {
      if (report.descricao.trim().length < 20) next.descricao = 'Conte um pouco mais: use pelo menos 20 caracteres.'
      if (!report.local.trim()) next.local = 'Indique onde aconteceu.'
      if (!report.data_incidente) next.data_incidente = 'Indique quando aconteceu.'
      if (report.data_incidente > new Date().toISOString().slice(0, 10)) next.data_incidente = 'A data não pode estar no futuro.'
      if (!report.escola.trim()) next.escola = 'Selecione a unidade escolar.'
    }
    if (fields === 'all' || fields === 3) {
      if (!report.anonimo) {
        if (report.nome.trim().length < 3) next.nome = 'Informe seu nome.'
        if (!/^\S+@\S+\.\S+$/.test(report.email)) next.email = 'Informe um e-mail válido.'
        if (report.telefone.replace(/\D/g, '').length < 10) next.telefone = 'Informe um telefone válido.'
      }
      if (!agreed) next.terms = 'Confirme que as informações são verdadeiras para concluir.'
    }
    setErrors(next)
    const firstError = Object.keys(next)[0]
    if (firstError) {
      requestAnimationFrame(() => {
        const target = formRef.current?.querySelector(`[data-field="${firstError}"]`)
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target?.querySelector('input, textarea, select')?.focus()
      })
      return false
    }
    return true
  }

  function nextStep() {
    if (!validate(step)) return
    setStep(current => Math.min(current + 1, 3))
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function send(event) {
    event.preventDefault()
    if (!validate('all')) {
      if (!report.severidade) setStep(1)
      else if (report.descricao.trim().length < 20 || !report.local || !report.data_incidente || !report.escola.trim()) setStep(2)
      else setStep(3)
      return
    }
    setStatus('sending')
    setResult(null)
    try {
      const data = await submitReport(report)
      setResult({ ...data, submittedType: report.tipo })
      setReport(initialReport)
      setAgreed(false)
      setStep(1)
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

  const unitsByCategory = units.reduce((groups, unit) => {
    const category = unit.category || 'Unidades'
    if (!groups[category]) groups[category] = []
    groups[category].push(unit)
    return groups
  }, {})

  return (
    <main className="report-page">
      <section className="report-hero"><div className="container"><h1><HandHeart />Faça sua denúncia</h1><p>Compartilhe com segurança, anonimato e confiança.</p></div></section>
      <div className="container report-container">
        <div className="safety-alert"><ShieldCheck /><div><strong>Sua segurança é prioridade.</strong><span>Você pode enviar o relato anonimamente e acompanhar o andamento por código.</span></div></div>
        <form className="report-form" onSubmit={send} noValidate ref={formRef}>
          <div className="form-progress" aria-label={`Etapa ${step} de 3`}>
            {[['1', 'Situação'], ['2', 'Detalhes'], ['3', 'Segurança']].map(([number, label], index) => <div className={step >= index + 1 ? 'progress-step active' : 'progress-step'} key={number}><span>{step > index + 1 ? <CheckCircle2 /> : number}</span><small>{label}</small></div>)}
          </div>
          {Object.keys(errors).length > 0 && <div className="form-summary" role="alert"><AlertTriangle /><div><strong>Falta só um detalhe</strong><span>Confira o campo destacado para continuar.</span></div></div>}

          {step === 1 && <section className="form-step">
            <div className="step-heading"><span>01</span><div><h2>Como podemos ajudar?</h2><p>{report.tipo === 'sugestao' ? 'Compartilhe uma ideia para melhorar os espaços, regras ou atividades da escola.' : 'Escolha o tipo de relato e como você percebe a gravidade.'}</p></div></div>
            <div className="type-tabs">{reportTypes.map(({ value, label }) => <button key={value} type="button" className={report.tipo === value ? 'active' : ''} onClick={() => selectType(value)}>{label}</button>)}</div>
            <FormField field="severidade" label={report.tipo === 'sugestao' ? 'Qual impacto essa ideia pode ter?' : 'Como você avalia essa situação?'} error={errors.severidade}><select value={report.severidade} onChange={event => update('severidade', event.target.value)}>{report.tipo === 'sugestao' ? <><option value="">Escolha uma opção</option><option value="leve">Pequeno — melhora um detalhe</option><option value="moderado">Médio — ajuda uma turma ou espaço</option><option value="grave">Alto — ajuda muitas pessoas</option><option value="critico">Urgente — resolve um risco ou problema sério</option></> : <><option value="">Escolha uma opção</option><option value="leve">Leve — me incomodou</option><option value="moderado">Moderada — está se repetindo</option><option value="grave">Grave — causou medo ou dano</option><option value="critico">Crítica — existe risco imediato</option></>}</select></FormField>
          </section>}

          {step === 2 && <section className="form-step">
            <div className="step-heading"><span>02</span><div><h2>{report.tipo === 'sugestao' ? 'Conte a sua ideia' : 'Conte o que aconteceu'}</h2><p>{report.tipo === 'sugestao' ? 'Explique o que poderia mudar e como isso ajudaria os estudantes.' : 'Escreva do seu jeito. Você pode incluir apenas o que se sentir confortável.'}</p></div></div>
            <FormField field="descricao" label={report.tipo === 'sugestao' ? 'O que você gostaria de melhorar?' : 'O que aconteceu?'} error={errors.descricao}><textarea value={report.descricao} onChange={event => update('descricao', event.target.value)} placeholder={report.tipo === 'sugestao' ? 'Por exemplo: criar uma área de leitura no pátio, mudar uma regra ou propor uma nova atividade.' : 'Conte com suas palavras. Por exemplo: o que fizeram, quantas vezes aconteceu e como você se sentiu.'} /><span className="character-count">{report.descricao.length}/20 caracteres mínimos</span></FormField>
            {report.tipo === 'sugestao' ? <FormField field="local" label="Sobre o que é a sua ideia?" error={errors.local}><select value={report.local} onChange={event => update('local', event.target.value)}><option value="">Escolha uma categoria</option><option value="Espaço físico da escola">Espaço físico da escola</option><option value="Regra da escola">Regra da escola</option><option value="Convivência entre estudantes">Convivência entre estudantes</option><option value="Atividade ou projeto">Atividade ou projeto</option><option value="Outro assunto">Outro assunto</option></select></FormField> : <div className="form-grid"><FormField field="local" label="Onde aconteceu?" error={errors.local}><input value={report.local} onChange={event => update('local', event.target.value)} placeholder="Sala, pátio, corredor ou internet" /></FormField><FormField field="data_incidente" label="Quando aconteceu?" error={errors.data_incidente}><input type="date" max={new Date().toISOString().slice(0, 10)} value={report.data_incidente} onChange={event => update('data_incidente', event.target.value)} /></FormField></div>}
            <FormField field="escola" label="Para qual unidade você quer enviar este relato?" error={errors.escola}><select value={report.escola} onChange={event => update('escola', event.target.value)} disabled={unitsLoading || units.length === 0}><option value="">{unitsLoading ? 'Carregando unidades...' : units.length === 0 ? 'Nenhuma unidade disponível' : 'Selecione uma unidade'}</option>{Object.entries(unitsByCategory).map(([category, categoryUnits]) => <optgroup key={category} label={category}>{categoryUnits.map(unit => <option key={unit.id} value={unit.name}>{unit.name}</option>)}</optgroup>)}</select>{unitsError && <small>{unitsError}</small>}</FormField>
            <FormField label={report.tipo === 'sugestao' ? 'Quem seria beneficiado? (opcional)' : 'Quem estava envolvido? (opcional)'}><textarea value={report.envolvidos} onChange={event => update('envolvidos', event.target.value)} placeholder={report.tipo === 'sugestao' ? 'Uma turma, todos os estudantes, professores ou a comunidade escolar.' : 'Não precisa informar nomes completos.'} /></FormField>
            <FormField label={report.tipo === 'sugestao' ? 'Quer acrescentar algum exemplo? (opcional)' : 'Alguém viu? (opcional)'}><textarea value={report.testemunhas} onChange={event => update('testemunhas', event.target.value)} placeholder={report.tipo === 'sugestao' ? 'Conte como essa ideia poderia funcionar na prática.' : 'Colegas, professores ou outras pessoas.'} /></FormField>
          </section>}

          {step === 3 && <section className="form-step">
            <div className="step-heading"><span>03</span><div><h2>Você escolhe como enviar</h2><p>O modo anônimo vem ativado. Seus dados pessoais não são necessários.</p></div></div>
            <label className="anonymous-toggle"><input type="checkbox" checked={report.anonimo} onChange={event => update('anonimo', event.target.checked)} /><span><UserRoundCheck /><span><strong>Continuar em anonimato</strong><small>Nenhum dado pessoal será enviado.</small></span></span></label>
            {!report.anonimo && <div className="identified-fields"><FormField field="nome" label="Nome" error={errors.nome}><input value={report.nome} onChange={event => update('nome', event.target.value)} /></FormField><FormField field="email" label="E-mail" error={errors.email}><input type="email" value={report.email} onChange={event => update('email', event.target.value)} /></FormField><FormField field="telefone" label="Telefone" error={errors.telefone}><input value={report.telefone} onChange={event => update('telefone', event.target.value)} /></FormField></div>}
            <div className="report-review"><Sparkles /><div><strong>{report.tipo === 'sugestao' ? 'Sua ideia está pronta' : 'Seu relato está pronto'}</strong><span>{reportTypeLabels[report.tipo]} · {report.severidade} · {report.anonimo ? 'anônimo' : 'identificado'}</span></div></div>
            <label className="terms" data-field="terms"><input type="checkbox" checked={agreed} onChange={event => { setAgreed(event.target.checked); setErrors(current => ({ ...current, terms: '' })) }} />Confirmo que as informações são verdadeiras e concordo com os Termos de Uso e a Política de Privacidade.</label>
            {errors.terms && <p className="field-error">{errors.terms}</p>}
          </section>}

          <div className="form-actions">
            {step > 1 && <button type="button" className="button button-ghost" onClick={() => setStep(current => current - 1)}><ArrowLeft />Voltar</button>}
            {step < 3 && <button type="button" className="button button-primary next-button" onClick={nextStep}>Continuar<ArrowRight /></button>}
            {step === 3 && <button className="button button-success submit-button" disabled={status === 'sending'}>{status === 'sending' ? <><span className="spinner" />Enviando com segurança...</> : <><Send />{report.tipo === 'sugestao' ? 'Enviar ideia' : 'Enviar denúncia'}</>}</button>}
          </div>
          {status === 'error' && <p className="notice error">{result.error}</p>}
        </form>
        {status === 'success' && <section className="notice success"><CheckCircle2 /><div><h2>{result.submittedType === 'sugestao' ? 'Ideia enviada' : 'Denúncia enviada'}</h2><p>Guarde o seu código de rastreamento:</p><strong>{result.trackingCode}</strong><button type="button" className="text-button" onClick={() => setStatus('idle')}>{result.submittedType === 'sugestao' ? 'Enviar outra ideia' : 'Enviar outro relato'}</button></div></section>}
        <section className="tracking-card"><h2><Search />Rastrear sua denúncia</h2><p>Digite o código recebido ao enviar seu relato.</p><form onSubmit={search}><input value={trackingCode} onChange={event => setTrackingCode(event.target.value)} placeholder="Código de rastreamento" /><button className="button button-primary">Buscar</button></form>{tracking.state === 'loading' && <p>Buscando...</p>}{tracking.state === 'error' && <p className="notice error">{tracking.message}</p>}{tracking.state === 'success' && <div className="notice"><p><strong>Status:</strong> {statusLabels[tracking.data.status] || tracking.data.status}</p><p><strong>Tipo:</strong> {tracking.data.tipo}</p><p><strong>Data:</strong> {new Date(tracking.data.data_criacao).toLocaleDateString('pt-BR')}</p></div>}</section>
      </div>
    </main>
  )
}

function FormField({ field, label, error, children }) {
  return <label className={error ? 'field has-error' : 'field'} data-field={field}><span>{label}</span>{children}{error && <small>{error}</small>}</label>
}

function Resources() {
  return <InfoPage title="Você não precisa passar por isso só"><p className="page-lead">Escolha o tipo de ajuda que faz sentido agora. Todos estes canais são gratuitos.</p><div className="resource-grid"><Resource icon={Phone} title="CVV · 188" text="Apoio emocional sigiloso, disponível 24 horas por dia." href="tel:188" action="Ligar para 188" /><Resource icon={AlertTriangle} title="Emergência · 190" text="Use quando você ou outra pessoa estiver em risco imediato." href="tel:190" action="Ligar para 190" /><Resource icon={Heart} title="Disque 100" text="Denuncie violações de direitos de crianças e adolescentes." href="tel:100" action="Ligar para 100" /><Resource icon={BookOpen} title="SaferNet" text="Orientação para situações de cyberbullying e violência online." href="https://new.safernet.org.br/helpline" action="Acessar orientação" external /></div><section className="resource-cta"><div><span>Canal da escola</span><h2>Quer registrar o que aconteceu?</h2><p>Seu relato pode ser anônimo e você recebe um código para acompanhar.</p></div><a className="button button-success" href="#/relatar"><MessageCircleWarning />Fazer uma denúncia</a></section></InfoPage>
}

function Resource({ icon: Icon, title, text, href, action, external = false }) {
  return <article className="resource-card"><Icon /><h2>{title}</h2><p>{text}</p><a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{action}{external && <ExternalLink />}</a></article>
}

function InfoPage({ title, children }) {
  return <main className="info-page"><div className="container"><h1>{title}</h1>{children}</div></main>
}

function Faq() {
  const questions = [
    ['Posso denunciar anonimamente?', 'Sim. O anonimato já vem ativado e nenhum dado pessoal é exigido. Você pode desativá-lo somente se quiser se identificar.'],
    ['Como acompanho o relato?', 'Depois do envio, guarde o código exibido na tela. Use a área “Rastrear sua denúncia” para consultar o status sem criar uma conta.'],
    ['E se eu estiver em perigo agora?', 'Não espere a análise do formulário. Procure um adulto de confiança e ligue 190 em caso de risco imediato. Para apoio emocional, ligue 188.'],
    ['Quais informações devo incluir?', 'Conte o que aconteceu, onde e quando. Nomes de envolvidos e testemunhas são opcionais. Compartilhe apenas aquilo que você se sentir seguro para informar.'],
    ['O que acontece depois do envio?', 'O relato fica com status “Em análise”. A equipe responsável pode investigar e atualizar o andamento, que você consulta pelo código de rastreamento.'],
  ]
  return <InfoPage title="Perguntas que podem estar na sua cabeça"><p className="page-lead">Respostas diretas, sem julgamento. Clique em uma pergunta para abrir.</p><div className="faq-list">{questions.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div><div className="faq-help"><Heart /><div><strong>Ainda ficou com dúvida?</strong><span>Você pode buscar apoio antes de decidir fazer um relato.</span></div><a href="#/recursos">Ver recursos de apoio</a></div></InfoPage>
}

function Footer() {
  return <footer><div className="container footer-grid"><div><h2>Precisa de ajuda imediata?</h2><p>CVV: <strong>188</strong> · Emergência: <strong>190</strong> · Direitos Humanos: <strong>100</strong></p></div><p>© 2026 SingularNãoDorme. Sua voz segura contra o bullying.</p></div></footer>
}

export default function App() {
  const route = useHashRoute()
  const isAdminRecovery = new URLSearchParams(window.location.search).has('admin-recovery')
  if (route.startsWith('/adm') || isAdminRecovery) return <AdminApp />
  const page = route === '/relatar' ? <ReportPage /> : route === '/recursos' ? <Resources /> : route === '/faq' ? <Faq /> : <Home />
  return <><Nav />{page}<Footer /></>
}