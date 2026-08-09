import { useState } from 'react'
import { findReport, submitReport } from './supabase.js'

const initialReport = {
  tipo: 'bullying', descricao: '', local: '', data_incidente: '', envolvidos: '', testemunhas: '',
  severidade: '', anonimo: true, nome: '', email: '', telefone: '', escola: '',
}

const labels = {
  pendente: 'Pendente', investigando: 'Em investigação', resolvido: 'Resolvido', fechado: 'Fechado',
}

function Nav() {
  return <header className="site-header"><a className="brand" href="#/">SingularNãoDorme</a><nav><a href="#/">Início</a><a href="#/relatar">Denunciar</a><a href="#/recursos">Recursos</a><a href="#/faq">FAQ</a></nav></header>
}

function Home() {
  return <main><section className="hero"><p className="eyebrow">Canal seguro de escuta</p><h1>Sua voz merece proteção.</h1><p>Relate bullying, conflitos e sugestões com segurança, privacidade e acompanhamento.</p><div className="hero-actions"><a className="button button-primary" href="#/relatar">Fazer uma denúncia</a><a className="button button-secondary" href="#/recursos">Buscar apoio</a></div></section><section className="info-grid"><article><h2>Anonimato</h2><p>Escolha não informar dados pessoais e receba um código para acompanhar o caso.</p></article><article><h2>Acolhimento</h2><p>Uma denúncia não precisa ser enfrentada sozinho. Procure apoio quando precisar.</p></article><article><h2>Urgência</h2><p>Em risco imediato, ligue 190. Para violações de direitos, disque 100.</p></article></section></main>
}

function ReportPage() {
  const [report, setReport] = useState(initialReport)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [trackingCode, setTrackingCode] = useState('')
  const [tracking, setTracking] = useState({ state: 'idle', data: null, message: '' })

  function update(field, value) { setReport(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: '' })) }
  function validate() {
    const next = {}
    if (report.descricao.trim().length < 20) next.descricao = 'Escreva pelo menos 20 caracteres.'
    if (!report.local.trim()) next.local = 'Informe onde aconteceu.'
    if (!report.data_incidente) next.data_incidente = 'Informe quando aconteceu.'
    if (!report.severidade) next.severidade = 'Selecione a gravidade.'
    if (!report.anonimo) {
      if (report.nome.trim().length < 3) next.nome = 'Informe seu nome.'
      if (!/^\S+@\S+\.\S+$/.test(report.email)) next.email = 'Informe um e-mail válido.'
      if (report.telefone.replace(/\D/g, '').length < 10) next.telefone = 'Informe um telefone válido.'
      if (!report.escola.trim()) next.escola = 'Informe sua escola.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }
  async function send(event) {
    event.preventDefault()
    if (!validate()) return
    setStatus('sending')
    try { const data = await submitReport(report); setResult(data); setReport(initialReport); setStatus('success') } catch (error) { setResult({ error: error.message }); setStatus('error') }
  }
  async function search(event) {
    event.preventDefault()
    if (!trackingCode.trim()) return setTracking({ state: 'error', message: 'Digite o código de rastreamento.' })
    setTracking({ state: 'loading', data: null, message: '' })
    try { setTracking({ state: 'success', data: await findReport(trackingCode.trim().toUpperCase()), message: '' }) } catch (error) { setTracking({ state: 'error', data: null, message: error.message }) }
  }
  return <main className="page-shell"><section className="page-intro"><p className="eyebrow">Relato confidencial</p><h1>Faça sua denúncia</h1><p>Se houver risco imediato, ligue 190. Este canal não substitui serviços de emergência.</p></section><form className="report-form" onSubmit={send} noValidate><div className="type-picker">{['bullying', 'conflito', 'sugestao'].map(type => <button key={type} type="button" className={report.tipo === type ? 'selected' : ''} onClick={() => update('tipo', type)}>{type}</button>)}</div><Field label="O que aconteceu?" error={errors.descricao}><textarea value={report.descricao} onChange={event => update('descricao', event.target.value)} /></Field><Field label="Onde aconteceu?" error={errors.local}><input value={report.local} onChange={event => update('local', event.target.value)} /></Field><Field label="Quando aconteceu?" error={errors.data_incidente}><input type="date" value={report.data_incidente} onChange={event => update('data_incidente', event.target.value)} /></Field><Field label="Nível de severidade" error={errors.severidade}><select value={report.severidade} onChange={event => update('severidade', event.target.value)}><option value="">Selecione</option><option value="leve">Leve</option><option value="moderado">Moderado</option><option value="grave">Grave</option><option value="critico">Crítico</option></select></Field><Field label="Pessoas envolvidas (opcional)"><textarea value={report.envolvidos} onChange={event => update('envolvidos', event.target.value)} /></Field><Field label="Testemunhas (opcional)"><textarea value={report.testemunhas} onChange={event => update('testemunhas', event.target.value)} /></Field><label className="toggle"><input type="checkbox" checked={report.anonimo} onChange={event => update('anonimo', event.target.checked)} />Enviar de forma anônima</label>{!report.anonimo && <section className="identified-fields"><Field label="Nome" error={errors.nome}><input value={report.nome} onChange={event => update('nome', event.target.value)} /></Field><Field label="E-mail" error={errors.email}><input type="email" value={report.email} onChange={event => update('email', event.target.value)} /></Field><Field label="Telefone" error={errors.telefone}><input value={report.telefone} onChange={event => update('telefone', event.target.value)} /></Field><Field label="Escola" error={errors.escola}><input value={report.escola} onChange={event => update('escola', event.target.value)} /></Field></section>}<label className="terms"><input type="checkbox" required />Confirmo que as informações são verdadeiras e aceito os termos de uso.</label><button className="button button-primary submit-button" disabled={status === 'sending'}>{status === 'sending' ? 'Enviando denúncia...' : 'Enviar denúncia'}</button>{status === 'error' && <p className="notice error">{result.error}</p>}</form>{status === 'success' && <section className="notice success"><h2>Denúncia recebida</h2><p>Guarde seu código de rastreamento:</p><strong>{result.trackingCode}</strong><button className="link-button" onClick={() => setStatus('idle')}>Enviar outro relato</button></section>}<section className="tracking"><h2>Acompanhar denúncia</h2><form onSubmit={search}><input placeholder="Código de rastreamento" value={trackingCode} onChange={event => setTrackingCode(event.target.value)} /><button className="button button-secondary">Buscar</button></form>{tracking.state === 'loading' && <p>Buscando...</p>}{tracking.state === 'error' && <p className="notice error">{tracking.message}</p>}{tracking.state === 'success' && <div className="notice"><p><strong>Status:</strong> {labels[tracking.data.status] || tracking.data.status}</p><p><strong>Tipo:</strong> {tracking.data.tipo}</p><p><strong>Enviado em:</strong> {new Date(tracking.data.data_criacao).toLocaleDateString('pt-BR')}</p></div>}</section></main>
}

function Field({ label, error, children }) { return <label className="field"><span>{label}</span>{children}{error && <small>{error}</small>}</label> }
function Support({ title, children }) { return <main className="page-shell text-page"><h1>{title}</h1>{children}</main> }

export default function App() {
  const route = window.location.hash.replace('#', '') || '/'
  const page = route === '/relatar' ? <ReportPage /> : route === '/recursos' ? <Support title="Recursos de apoio"><p>CVV: 188, disponível 24 horas. Em emergência, ligue 190. Para violações de direitos humanos, disque 100.</p></Support> : route === '/faq' ? <Support title="Perguntas frequentes"><h2>Posso denunciar anonimamente?</h2><p>Sim. Você receberá um código de rastreamento para acompanhar a denúncia.</p></Support> : <Home />
  return <><Nav />{page}<footer>SingularNãoDorme · Canal de escuta e proteção</footer></>
}