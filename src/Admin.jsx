import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Eye,
  FileText,
  Filter,
  KeyRound,
  Lightbulb,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  adminApi,
  authClient,
  requestPasswordReset,
} from "./adminApi.js";
import "./admin.css";

const typeLabels = {
  bullying: "Bullying",
  conflito: "Conflito",
  sugestao: "Ideia para a escola",
};
const editableStatusLabels = {
  pendente: "Pendente",
  investigando: "Em investigação",
  resolvido: "Resolvido",
};
const statusLabels = {
  ...editableStatusLabels,
  fechado: "Fechado",
};
const severityLabels = {
  leve: "Leve",
  moderado: "Moderado",
  grave: "Grave",
  critico: "Crítico",
};
const priorityLabels = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};
const roleLabels = {
  admin: "Administrador",
  coordinator: "Coordenação",
  orientacao: "Orientação",
};
const destinationLabels = {
  coordenacao: "Coordenação",
  orientacao: "Orientação",
};

function formatDate(value, includeTime = false) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat(
    "pt-BR",
    includeTime
      ? { dateStyle: "short", timeStyle: "short" }
      : { dateStyle: "short" },
  ).format(new Date(value));
}

export default function AdminApp() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [accessError, setAccessError] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(() =>
    new URLSearchParams(window.location.search).has("admin-recovery"),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const recoveryToken = params.get("token_hash");
    const initializeAuth = recoveryToken
      ? authClient.auth
          .verifyOtp({ token_hash: recoveryToken, type: "recovery" })
          .then(({ data, error }) => {
            if (error) throw error;
            window.history.replaceState({}, "", "/?admin-recovery=1#/adm");
            setSession(data.session);
          })
      : authClient.auth.getSession().then(({ data }) => {
          setSession(data.session);
        });

    initializeAuth
      .catch(() => setRecoveryError("Este link expirou ou já foi utilizado."))
      .finally(() => setAuthLoading(false));
    const { data: listener } = authClient.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    adminApi
      .me()
      .then((data) => {
        setProfile({ ...data.profile, email: data.email });
        setAccessError("");
      })
      .catch((error) => setAccessError(error.message));
  }, [session]);

  if (authLoading) return <AdminLoading />;
  if (recoveryMode && session)
    return (
      <RecoveryPassword
        onChanged={() => {
          window.history.replaceState({}, "", "/#/adm");
          setRecoveryMode(false);
        }}
      />
    );
  if (recoveryMode && !session)
    return <RecoveryLinkError message={recoveryError} />;
  if (!session) return <AdminLogin />;
  if (accessError) return <AccessDenied message={accessError} />;
  if (!profile) return <AdminLoading />;
  if (profile.must_change_password)
    return (
      <ChangePassword
        profile={profile}
        onChanged={() =>
          setProfile((current) => ({ ...current, must_change_password: false }))
        }
      />
    );
  return <AdminDashboard profile={profile} />;
}

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function signIn(event) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError("E-mail ou senha incorretos.");
      setStatus("idle");
    }
  }

  async function recover(event) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setMessage("");
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
      setStatus("sent");
    } catch (recoveryError) {
      setError(recoveryError.message);
      setStatus("idle");
    }
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-brand">
        <a href="#/">
          <img src="/singular-nao-dorme-logo.png" alt="" aria-hidden="true" />
          <span>SingularNãoDorme</span>
        </a>
        <div>
          <span className="admin-kicker">Área protegida</span>
          <h1>
            Coordenação presente.
            <br />
            Relatos bem cuidados.
          </h1>
          <p>
            Organize prioridades, acompanhe cada caso e responda com segurança
            em um só lugar.
          </p>
        </div>
        <small>O acesso é registrado e restrito à equipe autorizada.</small>
      </section>
      <section className="admin-auth-panel">
        <form onSubmit={forgotPassword ? recover : signIn}>
          <div className="admin-auth-icon">
            {forgotPassword ? <Mail /> : <LockKeyhole />}
          </div>
          <h2>{forgotPassword ? "Recuperar acesso" : "Acessar o painel"}</h2>
          <p>
            {forgotPassword
              ? "Informe seu e-mail institucional para receber um link seguro."
              : "Use as credenciais fornecidas pelo administrador."}
          </p>
          <label>
            E-mail institucional
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          {!forgotPassword && (
            <>
              <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              <button
                type="button"
                className="admin-forgot-button"
                onClick={() => {
                  setForgotPassword(true);
                  setError("");
                }}
              >
                Esqueceu a senha?
              </button>
            </>
          )}
          {error && (
            <div className="admin-error">
              <AlertCircle />
              {error}
            </div>
          )}
          {message && (
            <div className="admin-success">
              <CheckCircle2 />
              {message}
            </div>
          )}
          <button
            className="admin-primary-button"
            disabled={status === "loading" || status === "sent"}
          >
            {status === "loading" ? (
              <>
                <Loader2 className="spin" />
                {forgotPassword ? "Enviando..." : "Entrando..."}
              </>
            ) : (
              <>
                {forgotPassword
                  ? status === "sent"
                    ? "E-mail solicitado"
                    : "Enviar link de recuperação"
                  : "Entrar com segurança"}
              </>
            )}
          </button>
          {forgotPassword && (
            <button
              type="button"
              className="admin-back-link admin-link-button"
              onClick={() => {
                setForgotPassword(false);
                setStatus("idle");
                setError("");
                setMessage("");
              }}
            >
              <ArrowLeft />
              Voltar ao login
            </button>
          )}
          <a className="admin-back-link" href="#/">
            <ArrowLeft />
            Voltar ao site
          </a>
        </form>
      </section>
    </main>
  );
}

function RecoveryPassword({ onChanged }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function change(event) {
    event.preventDefault();
    if (password.length < 10 || password !== confirm) {
      setError("Use ao menos 10 caracteres e confirme a mesma senha.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: passwordError } = await authClient.auth.updateUser({
      password,
    });
    if (passwordError) {
      setError(passwordError.message);
      setLoading(false);
      return;
    }
    try {
      await adminApi.completePasswordChange();
      onChanged();
    } catch (profileError) {
      setError(profileError.message);
      setLoading(false);
    }
  }

  return (
    <main className="admin-center-page">
      <KeyRound />
      <h1>Defina sua nova senha</h1>
      <p>O link foi validado. Crie uma senha exclusiva para acessar o painel.</p>
      <form className="password-form" onSubmit={change}>
        <label>
          Nova senha
          <input
            type="password"
            minLength="10"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirmar senha
          <input
            type="password"
            minLength="10"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && <div className="admin-error">{error}</div>}
        <button className="admin-primary-button" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </main>
  );
}

function RecoveryLinkError({ message }) {
  return (
    <main className="admin-center-page">
      <AlertCircle />
      <h1>Link inválido ou expirado</h1>
      <p>{message || "Solicite um novo link na tela de acesso do painel."}</p>
      <a className="admin-primary-button" href="/#/adm">
        Voltar ao login
      </a>
    </main>
  );
}

function AccessDenied({ message }) {
  return (
    <main className="admin-center-page">
      <ShieldCheck />
      <h1>Acesso não autorizado</h1>
      <p>{message}</p>
      <button
        className="admin-primary-button"
        onClick={() => authClient.auth.signOut()}
      >
        Sair desta conta
      </button>
    </main>
  );
}

function ChangePassword({ profile, onChanged }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function change(event) {
    event.preventDefault();
    if (password.length < 10 || password !== confirm)
      return setError("Use ao menos 10 caracteres e confirme a mesma senha.");
    setLoading(true);
    const { error: passwordError } = await authClient.auth.updateUser({
      password,
    });
    if (passwordError) {
      setError(passwordError.message);
      setLoading(false);
      return;
    }
    await adminApi.completePasswordChange();
    onChanged();
  }

  return (
    <main className="admin-center-page">
      <KeyRound />
      <h1>Crie sua senha definitiva</h1>
      <p>
        Este é o seu primeiro acesso. Troque a senha temporária antes de
        continuar.
      </p>
      <form className="password-form" onSubmit={change}>
        <label>
          Nova senha
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label>
          Confirmar senha
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
        {error && <div className="admin-error">{error}</div>}
        <button className="admin-primary-button" disabled={loading}>
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </main>
  );
}

function AdminLoading() {
  return (
    <main className="admin-center-page">
      <Loader2 className="spin" />
      <p>Carregando ambiente seguro...</p>
    </main>
  );
}

function AdminDashboard({ profile }) {
  const [view, setView] = useState("reports");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("adminTheme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("adminTheme", theme);
  }, [theme]);

  return (
    <div className={`admin-shell ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <aside className={sidebarOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-sidebar-head">
          <a href="#/">
            <img src="/singular-nao-dorme-logo.png" alt="" aria-hidden="true" />
            <span>SingularNãoDorme</span>
          </a>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Fechar menu"
          >
            <X />
          </button>
        </div>
        <nav>
          <button
            className={view === "reports" ? "active" : ""}
            onClick={() => {
              setView("reports");
              setSidebarOpen(false);
            }}
          >
            <FileText />
            Relatos
          </button>
          {profile.role === "admin" && (
            <button
              className={view === "units" ? "active" : ""}
              onClick={() => {
                setView("units");
                setSidebarOpen(false);
              }}
            >
              <Building2 />
              Unidades
            </button>
          )}
          {profile.role === "admin" && (
            <button
              className={view === "users" ? "active" : ""}
              onClick={() => {
                setView("users");
                setSidebarOpen(false);
              }}
            >
              <Users />
              Usuários
            </button>
          )}
        </nav>
        <div className="admin-profile">
          <span>{profile.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{profile.name}</strong>
            <small>
              {roleLabels[profile.role] || profile.role}
            </small>
          </div>
          <button title="Sair" onClick={() => authClient.auth.signOut()}>
            <LogOut />
          </button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu />
          </button>
          <div>
            <span>{profile.role === "orientacao" ? "Painel da orientação" : "Painel da coordenação"}</span>
            <strong>{profile.school || "Todas as unidades"}</strong>
          </div>
          <button
            type="button"
            className="admin-theme-toggle"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
            title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <a href="#/" target="_blank">
            <Eye />
            Ver site
          </a>
        </header>
        {view === "reports" && <ReportsView isAdmin={profile.role === "admin"} />}
        {view === "units" && profile.role === "admin" && <UnitsView />}
        {view === "users" && profile.role === "admin" && (
          <UsersView currentUser={profile} />
        )}
      </div>
    </div>
  );
}

function ReportsView({ isAdmin }) {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    tipo: "",
    status: "",
    severidade: "",
    priority: "",
    anonimo: "",
    destino: "",
  });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [statsData, reportsData] = await Promise.all([
        adminApi.dashboard(),
        adminApi.reports({ ...filters, page, pageSize: 20 }),
      ]);
      setStats(statsData);
      setReports(reportsData.reports);
      setTotal(reportsData.total);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [
    page,
    filters.tipo,
    filters.status,
    filters.severidade,
    filters.priority,
    filters.anonimo,
    filters.destino,
  ]);

  function search(event) {
    event.preventDefault();
    setPage(1);
    load();
  }

  return (
    <main className="admin-main">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Visão geral</span>
          <h1>Relatos da comunidade</h1>
          <p>Priorize, acompanhe e registre cada ação da equipe.</p>
        </div>
        <button className="admin-secondary-button" onClick={load}>
          <RefreshCw />
          Atualizar
        </button>
      </div>
      {stats && (
        <div className="admin-stats">
          <Stat icon={FileText} label="Todos" value={stats.total} tone="blue" />
          <Stat
            icon={Clock3}
            label="Pendentes"
            value={stats.pending}
            tone="yellow"
          />
          <Stat
            icon={BarChart3}
            label="Em investigação"
            value={stats.investigating}
            tone="coral"
          />
          <Stat
            icon={AlertCircle}
            label="Urgentes"
            value={stats.urgent}
            tone="red"
          />
          <Stat
            icon={Mail}
            label="Identificados"
            value={stats.identified}
            tone="green"
          />
        </div>
      )}
      <section className="admin-list-panel">
        <div className="admin-filters">
          <form onSubmit={search}>
            <Search />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Buscar código, local ou conteúdo"
            />
            <button>Buscar</button>
          </form>
          <div className="admin-filter-row">
            <Filter />
            <SelectFilter
              label="Categoria"
              value={filters.tipo}
              options={typeLabels}
              onChange={(value) => {
                setPage(1);
                setFilters((current) => ({ ...current, tipo: value }));
              }}
            />
            <SelectFilter
              label="Status"
              value={filters.status}
              options={editableStatusLabels}
              onChange={(value) => {
                setPage(1);
                setFilters((current) => ({ ...current, status: value }));
              }}
            />
            <SelectFilter
              label="Severidade"
              value={filters.severidade}
              options={severityLabels}
              onChange={(value) => {
                setPage(1);
                setFilters((current) => ({ ...current, severidade: value }));
              }}
            />
            <SelectFilter
              label="Prioridade"
              value={filters.priority}
              options={priorityLabels}
              onChange={(value) => {
                setPage(1);
                setFilters((current) => ({ ...current, priority: value }));
              }}
            />
            {isAdmin && (
              <SelectFilter
                label="Destino"
                value={filters.destino}
                options={destinationLabels}
                onChange={(value) => {
                  setPage(1);
                  setFilters((current) => ({ ...current, destino: value }));
                }}
              />
            )}
            <select
              aria-label="Identificação"
              value={filters.anonimo}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({
                  ...current,
                  anonimo: event.target.value,
                }));
              }}
            >
              <option value="">Todos os autores</option>
              <option value="false">Identificados</option>
              <option value="true">Anônimos</option>
            </select>
          </div>
        </div>
        {error && (
          <div className="admin-error">
            <AlertCircle />
            {error}
          </div>
        )}
        {loading ? (
          <div className="admin-table-loading">
            <Loader2 className="spin" />
            Carregando relatos...
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Relato</th>
                    <th>Categoria</th>
                    <th>Destino</th>
                    <th>Status</th>
                    <th>Gravidade</th>
                    <th>Prioridade</th>
                    <th>Recebido</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <ReportRow
                      key={report.id}
                      report={report}
                      onOpen={() => setSelectedId(report.id)}
                    />
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan="8">
                        <div className="admin-empty">
                          <Search />
                          <strong>Nenhum relato encontrado</strong>
                          <span>Altere os filtros para ampliar a busca.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span>
                {total} relato{total === 1 ? "" : "s"}
              </span>
              <div>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft />
                </button>
                <strong>Página {page}</strong>
                <button
                  disabled={page * 20 >= total}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {selectedId && (
        <ReportDrawer
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
          canDelete={isAdmin}
        />
      )}
    </main>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <article className={`admin-stat ${tone}`}>
      <span>
        <Icon />
      </span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}

function SelectFilter({ label, value, options, onChange }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{label}: todos</option>
      {Object.entries(options).map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}

function ReportRow({ report, onOpen }) {
  return (
    <tr onClick={onOpen}>
      <td>
        <strong>#{report.tracking_code}</strong>
        <span>{report.local}</span>
      </td>
      <td>
        <span className={`admin-type ${report.tipo}`}>
          {report.tipo === "sugestao" ? <Lightbulb /> : <MessageSquareText />}
          {typeLabels[report.tipo] || report.tipo}
        </span>
      </td>
      <td>{destinationLabels[report.destino] || report.destino}</td>
      <td>
        <span className={`admin-status ${report.status}`}>
          {statusLabels[report.status] || report.status}
        </span>
      </td>
      <td>{severityLabels[report.severidade] || report.severidade}</td>
      <td>
        <span className={`admin-priority ${report.priority}`}>
          {priorityLabels[report.priority] || report.priority}
        </span>
      </td>
      <td>{formatDate(report.data_criacao, true)}</td>
      <td>
        <button aria-label="Abrir relato">
          <ChevronRight />
        </button>
      </td>
    </tr>
  );
}

function ReportDrawer({ id, onClose, onUpdated, canDelete }) {
  const [data, setData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [tab, setTab] = useState("details");
  const [note, setNote] = useState("");
  const [response, setResponse] = useState({ subject: "", message: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [reportData, staffData] = await Promise.all([
        adminApi.report(id),
        adminApi.staff(),
      ]);
      setData(reportData);
      setStaff(staffData.staff);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }
  useEffect(() => {
    load();
  }, [id]);

  async function update(field, value) {
    setSaving(true);
    try {
      const result = await adminApi.updateReport({ id, [field]: value });
      setData((current) => ({ ...current, report: result.report }));
      onUpdated();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function addNote(event) {
    event.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      const result = await adminApi.addNote({ relato_id: id, content: note });
      setData((current) => ({
        ...current,
        notes: [result.note, ...current.notes],
      }));
      setNote("");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function sendResponse(event) {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await adminApi.respond({ relato_id: id, ...response });
      setResponse({ subject: "", message: "" });
      setMessage({ type: "success", text: "Resposta enviada e registrada." });
      load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function removeReport() {
    if (!canDelete || data?.report?.status !== "resolvido") return;
    const accepted = window.confirm(
      `Tem certeza que deseja excluir o relato #${data.report.tracking_code}? Esta ação não pode ser desfeita.`,
    );
    if (!accepted) return;

    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await adminApi.deleteReport(id);
      onUpdated();
      onClose();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setSaving(false);
    }
  }

  return (
    <div className="admin-drawer-layer">
      <button
        className="admin-drawer-backdrop"
        onClick={onClose}
        aria-label="Fechar relato"
      />
      <aside className="admin-drawer">
        {!data ? (
          <div className="admin-table-loading">
            <Loader2 className="spin" />
            Abrindo relato...
          </div>
        ) : (
          <>
            <header>
              <div>
                <span className={`admin-type ${data.report.tipo}`}>
                  {typeLabels[data.report.tipo]}
                </span>
                <h2>#{data.report.tracking_code}</h2>
                <p>Recebido em {formatDate(data.report.data_criacao, true)}</p>
              </div>
              <button onClick={onClose} aria-label="Fechar">
                <X />
              </button>
            </header>
            <div className="admin-drawer-controls">
              <label>
                Status
                <select
                  value={data.report.status}
                  disabled={saving}
                  onChange={(event) => update("status", event.target.value)}
                >
                  {Object.entries(editableStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prioridade
                <select
                  value={data.report.priority || "normal"}
                  disabled={saving}
                  onChange={(event) => update("priority", event.target.value)}
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Responsável
                <select
                  value={data.report.assigned_to || ""}
                  disabled={saving}
                  onChange={(event) =>
                    update("assigned_to", event.target.value || null)
                  }
                >
                  <option value="">Não atribuído</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {canDelete && data.report.status === "resolvido" && (
              <div className="admin-drawer-danger">
                <button
                  type="button"
                  className="admin-danger-button"
                  disabled={saving}
                  onClick={removeReport}
                >
                  <Trash2 />
                  Excluir denúncia
                </button>
              </div>
            )}
            <nav className="admin-drawer-tabs">
              <button
                className={tab === "details" ? "active" : ""}
                onClick={() => setTab("details")}
              >
                Detalhes
              </button>
              <button
                className={tab === "notes" ? "active" : ""}
                onClick={() => setTab("notes")}
              >
                Notas ({data.notes.length})
              </button>
              <button
                className={tab === "response" ? "active" : ""}
                onClick={() => setTab("response")}
              >
                Resposta ({data.responses.length})
              </button>
            </nav>
            {message.text && (
              <div
                className={
                  message.type === "success" ? "admin-success" : "admin-error"
                }
              >
                {message.type === "success" ? (
                  <CheckCircle2 />
                ) : (
                  <AlertCircle />
                )}
                {message.text}
              </div>
            )}
            <div className="admin-drawer-body">
              {tab === "details" && <ReportDetails report={data.report} />}
              {tab === "notes" && (
                <NotesPanel
                  notes={data.notes}
                  note={note}
                  setNote={setNote}
                  onSubmit={addNote}
                  saving={saving}
                />
              )}
              {tab === "response" && (
                <ResponsePanel
                  report={data.report}
                  responses={data.responses}
                  response={response}
                  setResponse={setResponse}
                  onSubmit={sendResponse}
                  saving={saving}
                />
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function ReportDetails({ report }) {
  return (
    <div className="admin-report-details">
      <Detail label="Descrição" value={report.descricao} wide />
      <Detail
        label={report.tipo === "sugestao" ? "Categoria da ideia" : "Local"}
        value={report.local}
      />
      <Detail
        label="Data informada"
        value={formatDate(report.data_incidente)}
      />
      <Detail label="Gravidade" value={severityLabels[report.severidade]} />
      <Detail label="Equipe responsável" value={destinationLabels[report.destino] || report.destino} />
      <Detail
        label="Identificação"
        value={report.anonimo ? "Relato anônimo" : report.nome}
      />
      {report.envolvidos && (
        <Detail
          label={
            report.tipo === "sugestao" ? "Público beneficiado" : "Envolvidos"
          }
          value={report.envolvidos}
          wide
        />
      )}
      {report.testemunhas && (
        <Detail
          label={
            report.tipo === "sugestao" ? "Exemplo adicional" : "Testemunhas"
          }
          value={report.testemunhas}
          wide
        />
      )}
      {!report.anonimo && (
        <>
          <Detail label="E-mail" value={report.email} />
          <Detail label="Telefone" value={report.telefone} />
        </>
      )}
      {report.escola && <Detail label="Unidade" value={report.escola} />}
    </div>
  );
}

function UnitsView() {
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ name: "", category: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function load() {
    setLoading(true);
    try {
      const data = await adminApi.units();
      setUnits(data.units);
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await adminApi.createUnit(form);
      setForm({ name: "", category: "" });
      setMessage({ type: "success", text: "Unidade cadastrada com sucesso." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function toggle(unit) {
    try {
      await adminApi.updateUnit({ id: unit.id, active: !unit.active });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  async function removeUnit(unit) {
    const accepted = window.confirm(
      `Tem certeza que deseja excluir a unidade "${unit.name}"?`,
    );
    if (!accepted) return;

    try {
      await adminApi.deleteUnit(unit.id);
      setMessage({ type: "success", text: "Unidade excluída com sucesso." });
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  }

  return (
    <main className="admin-main">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Organização escolar</span>
          <h1>Unidades para denúncias</h1>
          <p>Cadastre as escolas para aparecerem no formulário público.</p>
        </div>
      </div>

      <section className="admin-list-panel">
        <form className="admin-unit-form" onSubmit={create}>
          <label>
            Nome da unidade
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Ex.: Escola Municipal Aurora"
              required
            />
          </label>
          <label>
            Categoria
            <input
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
              placeholder="Ex.: Fundamental I"
              required
            />
          </label>
          <button className="admin-primary-button" disabled={saving}>
            <Plus />
            {saving ? "Salvando..." : "Adicionar unidade"}
          </button>
        </form>

        {message.text && (
          <div className={message.type === "success" ? "admin-success" : "admin-error"}>
            {message.type === "success" ? <CheckCircle2 /> : <AlertCircle />}
            {message.text}
          </div>
        )}

        <div className="admin-units-list">
          {loading ? (
            <div className="admin-table-loading">
              <Loader2 className="spin" />
              Carregando unidades...
            </div>
          ) : (
            units.map((unit) => (
              <article className="admin-unit-row" key={unit.id}>
                <div>
                  <strong>{unit.name}</strong>
                  <small>{unit.category}</small>
                </div>
                <span className={unit.active ? "user-active" : "user-inactive"}>
                  {unit.active ? "Ativa" : "Inativa"}
                </span>
                <div className="admin-unit-actions">
                  <button className="admin-secondary-button" onClick={() => toggle(unit)}>
                    {unit.active ? "Desativar" : "Ativar"}
                  </button>
                  <button className="admin-danger-button" onClick={() => removeUnit(unit)}>
                    <Trash2 />
                    Excluir
                  </button>
                </div>
              </article>
            ))
          )}
          {!loading && units.length === 0 && (
            <div className="admin-empty">
              <Building2 />
              <strong>Nenhuma unidade cadastrada</strong>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value, wide = false }) {
  return (
    <div className={wide ? "admin-detail wide" : "admin-detail"}>
      <span>{label}</span>
      <p>{value || "Não informado"}</p>
    </div>
  );
}

function NotesPanel({ notes, note, setNote, onSubmit, saving }) {
  return (
    <div>
      <form className="admin-note-form" onSubmit={onSubmit}>
        <label>
          Nova observação interna
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Registre encaminhamentos, contatos e decisões da equipe."
          />
        </label>
        <button
          className="admin-primary-button"
          disabled={saving || !note.trim()}
        >
          Adicionar nota
        </button>
      </form>
      <div className="admin-timeline">
        {notes.map((entry) => (
          <article key={entry.id}>
            <span />
            <div>
              <strong>{entry.admin_profiles?.name || "Coordenação"}</strong>
              <small>{formatDate(entry.created_at, true)}</small>
              <p>{entry.content}</p>
            </div>
          </article>
        ))}
        {notes.length === 0 && (
          <div className="admin-empty">
            <MessageSquareText />
            <strong>Nenhuma observação</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function ResponsePanel({
  report,
  responses,
  response,
  setResponse,
  onSubmit,
  saving,
}) {
  if (report.anonimo || !report.email)
    return (
      <div className="admin-anonymous-note">
        <LockKeyhole />
        <h3>Este relato é anônimo</h3>
        <p>
          Não existe endereço de e-mail associado. Atualizações de status
          continuam disponíveis pelo código de rastreamento.
        </p>
      </div>
    );
  return (
    <div>
      <form className="admin-response-form" onSubmit={onSubmit}>
        <div className="admin-recipient">
          <Mail />
          <span>
            Responder para <strong>{report.email}</strong>
          </span>
        </div>
        <label>
          Assunto
          <input
            value={response.subject}
            onChange={(event) =>
              setResponse((current) => ({
                ...current,
                subject: event.target.value,
              }))
            }
            placeholder={`Retorno sobre o relato #${report.tracking_code}`}
            required
          />
        </label>
        <label>
          Mensagem
          <textarea
            value={response.message}
            onChange={(event) =>
              setResponse((current) => ({
                ...current,
                message: event.target.value,
              }))
            }
            placeholder="Escreva uma resposta acolhedora e informe os próximos passos."
            required
          />
        </label>
        <button className="admin-primary-button" disabled={saving}>
          <Send />
          {saving ? "Enviando..." : "Enviar por e-mail"}
        </button>
      </form>
      <div className="admin-response-history">
        <h3>Histórico de respostas</h3>
        {responses.map((entry) => (
          <article key={entry.id}>
            <div>
              <strong>{entry.subject}</strong>
              <span className={`delivery ${entry.delivery_status}`}>
                {entry.delivery_status === "sent"
                  ? "Enviado"
                  : entry.delivery_status === "failed"
                    ? "Falhou"
                    : "Pendente"}
              </span>
            </div>
            <small>
              {entry.admin_profiles?.name || "Coordenação"} ·{" "}
              {formatDate(entry.created_at, true)}
            </small>
            <p>{entry.message}</p>
          </article>
        ))}
        {responses.length === 0 && <p>Nenhuma resposta enviada.</p>}
      </div>
    </div>
  );
}

function UsersView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      setUsers((await adminApi.users()).users);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function toggle(user) {
    try {
      await adminApi.updateUser({ id: user.id, active: !user.active });
      load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="admin-main">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Controle de acesso</span>
          <h1>Equipe autorizada</h1>
          <p>Crie contas e controle quem pode acessar dados sensíveis.</p>
        </div>
        <button
          className="admin-primary-button compact"
          onClick={() => setShowCreate(true)}
        >
          <Plus />
          Novo usuário
        </button>
      </div>
      {message && <div className="admin-error">{message}</div>}
      <section className="admin-users-panel">
        {loading ? (
          <div className="admin-table-loading">
            <Loader2 className="spin" />
            Carregando equipe...
          </div>
        ) : (
          users.map((user) => (
            <article className="admin-user-row" key={user.id}>
              <span className="admin-avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="admin-user-name">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
              <div>
                <span>Perfil</span>
                <strong>
                  {roleLabels[user.role] || user.role}
                </strong>
              </div>
              <div>
                <span>Unidade</span>
                <strong>{user.school || "Todas"}</strong>
              </div>
              <span className={user.active ? "user-active" : "user-inactive"}>
                {user.active ? "Ativo" : "Desativado"}
              </span>
              <div className="admin-user-actions">
                <button
                  className="admin-secondary-button"
                  onClick={() => setResetUser(user)}
                >
                  <KeyRound />
                  Nova senha
                </button>
                <button
                  className="admin-secondary-button"
                  disabled={user.id === currentUser.id}
                  onClick={() => toggle(user)}
                >
                  {user.active ? "Desativar" : "Reativar"}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onUpdated={() => {
            setResetUser(null);
            load();
          }}
        />
      )}
    </main>
  );
}

function ResetPasswordModal({ user, onClose, onUpdated }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function reset(event) {
    event.preventDefault();
    if (password.length < 10) {
      setError("A senha temporária precisa ter ao menos 10 caracteres.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await adminApi.updateUser({ id: user.id, password });
      onUpdated();
    } catch (resetError) {
      setError(resetError.message);
      setLoading(false);
    }
  }

  return (
    <div className="admin-modal-layer">
      <button
        className="admin-drawer-backdrop"
        onClick={onClose}
        aria-label="Fechar"
      />
      <form className="admin-modal" onSubmit={reset}>
        <header>
          <div>
            <span className="admin-kicker">Redefinir acesso</span>
            <h2>Nova senha temporária</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </header>
        <p>
          Defina uma senha para <strong>{user.name}</strong>. A troca será
          exigida no próximo acesso.
        </p>
        <label>
          Senha temporária
          <input
            type="password"
            minLength="10"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <small>Mínimo de 10 caracteres.</small>
        </label>
        {error && <div className="admin-error">{error}</div>}
        <footer>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="admin-primary-button" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    school: "",
    role: "coordinator",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  async function create(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminApi.createUser(form);
      onCreated();
    } catch (createError) {
      setError(createError.message);
      setLoading(false);
    }
  }

  return (
    <div className="admin-modal-layer">
      <button
        className="admin-drawer-backdrop"
        onClick={onClose}
        aria-label="Fechar"
      />
      <form className="admin-modal" onSubmit={create}>
        <header>
          <div>
            <span className="admin-kicker">Novo acesso</span>
            <h2>Adicionar à equipe</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </header>
        <label>
          Nome completo
          <input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </label>
        <label>
          E-mail institucional
          <input
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
          />
        </label>
        <div className="admin-form-grid">
          <label>
            Perfil
            <select
              value={form.role}
              onChange={(event) => update("role", event.target.value)}
            >
              <option value="coordinator">Coordenação</option>
              <option value="orientacao">Orientação</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label>
            Unidade escolar
            <input
              value={form.school}
              onChange={(event) => update("school", event.target.value)}
              placeholder="Opcional"
            />
          </label>
        </div>
        <label>
          Senha temporária
          <input
            type="password"
            minLength="10"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            required
          />
          <small>
            Mínimo de 10 caracteres. A troca será exigida no primeiro acesso.
          </small>
        </label>
        {error && <div className="admin-error">{error}</div>}
        <footer>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className="admin-primary-button" disabled={loading}>
            {loading ? "Criando..." : "Criar acesso"}
          </button>
        </footer>
      </form>
    </div>
  );
}
