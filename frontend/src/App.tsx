import { ThemeSwitcher } from "./theme";
import { createOperationKey } from "./operationKey";
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useId } from "react";
import type { ReactNode, FormEvent } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Pill,
  Plus,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TriangleAlert,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  api,
  ApiError,
  money,
  date,
  saleCode,
  payment,
  movementLabel,
  localDay,
} from "./api";
import type {
  User,
  Product,
  Batch,
  Category,
  Sale,
  Page,
  Alerts,
  Report,
  Movement,
} from "./api";

type AlertTab = "stock" | "expiring" | "expired";

type View =
  | "dashboard"
  | "pos"
  | "inventory"
  | "sales"
  | "movements"
  | "alerts"
  | "reports"
  | "users"
  | "help";
const icons = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  inventory: Package,
  sales: ReceiptText,
  movements: ArrowDownLeft,
  alerts: Bell,
  reports: BarChart3,
  users: Users,
  help: CircleHelp,
};
const labels: Record<View, string> = {
  dashboard: "Vista general",
  pos: "Punto de venta",
  inventory: "Inventario",
  sales: "Ventas",
  movements: "Movimientos",
  alerts: "Alertas",
  reports: "Reportes",
  users: "Equipo",
  help: "Guía de uso",
};
function Logo() {
  return (
    <div className="brand">
      <img className="nova-mark" src={import.meta.env.BASE_URL + "nova-mark.svg"} alt="" width="44" height="44" />
      <div>
        nova<span>salud</span>
        <small>Gestión de botica</small>
      </div>
    </div>
  );
}

function LoginArtwork() {
  return (
    <svg className="login-art" viewBox="0 0 600 320" fill="none" aria-hidden="true">
      <path d="M55 246 302 102l245 144-247 143z" fill="var(--art-ground)" />
      <g stroke="var(--art-grid)" strokeWidth="1.3">
        <path d="m55 246 245 143M116 210l246 143M178 174l246 143M240 138l245 143M302 102l245 144" />
        <path d="m547 246-247 143M485 210 239 353M424 174 178 317M362 138 116 281M302 102 55 246" />
      </g>
      <g>
        <path d="m176 121 100-57 100 57-100 58z" fill="#eafaf3" />
        <path d="m176 121 100 58v118l-100-58z" fill="#87d4ae" />
        <path d="m276 179 100-58v118l-100 58z" fill="#21a46b" />
        <path d="m276 72 83 48-83 48-83-48z" stroke="#186f4a" />
        <path d="m214 143 15 9v16l13 7v16l-13-7v17l-15-9v-17l-14-8v-16l14 8z" fill="#13563b" />
        <path d="m300 219 48-28m-48 41 32-18m-32 31 48-28" stroke="#d6f9e7" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g>
        <path d="m344 164 59-34 64 37-59 34z" fill="#e4f3f9" />
        <path d="m344 164 64 37v75l-64-37z" fill="#b1d7e4" />
        <path d="m408 201 59-34v75l-59 34z" fill="#3c879f" />
        <path d="m364 182 24 14m-24-3 24 14m-24-3 24 14" stroke="#386a7b" strokeWidth="3" />
      </g>
      <g>
        <path d="m95 225 55-32 65 38-55 32z" fill="#fff3d6" />
        <path d="m95 225 65 38v38l-65-38z" fill="#f5c76c" />
        <path d="m160 263 55-32v38l-55 32z" fill="#b9892c" />
      </g>
      <path d="m444 91 11 7v13l-11 6-12-6V98z" fill="#15803d" />
      <path d="m490 126 9 5v11l-9 5-9-5v-11z" fill="#87d4ae" />
    </svg>
  );
}
function useResource<T>(path: string, refreshEvery = 30000) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let live = true,
      seq = 0;
    setLoading(true);
    const get = async () => {
      const n = ++seq;
      try {
        const d = await api<T>(path);
        if (live && n === seq) {
          setData(d);
          setError("");
        }
      } catch (e) {
        if (live && n === seq) setError((e as Error).message);
      } finally {
        if (live && n === seq) setLoading(false);
      }
    };
    get();
    const timer = setInterval(() => {
      if (!document.hidden) get();
    }, refreshEvery);
    const focus = () => get();
    window.addEventListener("focus", focus);
    return () => {
      live = false;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [path, version, refreshEvery]);
  return { data, loading, error, refresh };
}
function useDebounce(v: string) {
  const [d, set] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => set(v), 250);
    return () => clearTimeout(t);
  }, [v]);
  return d;
}
function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return (
    <span className={"badge " + tone}>
      <i />
      {children}
    </span>
  );
}
function ProductIcon({ category = 0 }: { category?: number }) {
  return (
    <span className={"product-icon color-" + (category % 5)}>
      <Pill size={21} />
    </span>
  );
}
function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="error-box" role="alert">
      <TriangleAlert size={18} />
      <span>{message}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" size={24} /> Cargando información…
    </div>
  );
}
function Empty({
  title = "Sin registros",
  text = "Los registros aparecerán aquí cuando completes una operación.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty">
      <Box size={34} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useLayoutEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => {
      if (d?.open) d.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={"modal " + (wide ? "wide" : "")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" aria-label="Cerrar" onClick={onClose}>
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Field({
  label,
  error,
  children,
  full = false,
}: {
  label: string;
  error?: string[];
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={"field " + (full ? "full" : "")}>
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error[0]}</small>}
    </label>
  );
}
function Form({
  children,
  submit,
  label = "Guardar",
  onCancel,
}: {
  children: (errors: Record<string, string[]>) => ReactNode;
  submit: (f: FormData) => Promise<unknown>;
  label?: string;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errors, setErrors] = useState<Record<string, string[]>>({});
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setErrors({});
    try {
      await submit(f);
    } catch (e) {
      setError((e as Error).message);
      setErrors((e as ApiError).errors || {});
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={onSubmit}>
      <div className="form-grid">{children(errors)}</div>
      {error && <ErrorBox message={error} />}
      <div className="modal-footer">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <Check size={17} />
          )}{" "}
          {busy ? "Guardando…" : label}
        </button>
      </div>
    </form>
  );
}
function useIdempotency() {
  const key = useRef<ReturnType<typeof createOperationKey> | null>(null);
  if (!key.current) key.current = createOperationKey();
  return key.current;
}
function Pagination({
  page,
  onPage,
}: {
  page: Page<unknown>;
  onPage: (v: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {page.from ?? 0}–{page.to ?? 0} de {page.total} registros
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Página anterior"
          disabled={page.current_page <= 1}
          onClick={() => onPage(page.current_page - 1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span>
          {page.current_page} / {page.last_page}
        </span>
        <button
          className="icon-button"
          aria-label="Página siguiente"
          disabled={page.current_page >= page.last_page}
          onClick={() => onPage(page.current_page + 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
function ProductName({ p }: { p: Product }) {
  return (
    <div className="product-name">
      <ProductIcon category={p.category_id} />
      <div>
        <strong>{p.name}</strong>
        <small>
          {p.code} <span>·</span> {p.presentation}
        </small>
      </div>
    </div>
  );
}
function Chart({
  data,
  bars = false,
}: {
  data: Report["series"];
  bars?: boolean;
}) {
  const Plot = bars ? BarChart : LineChart;
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <Plot
          data={data}
          margin={{ top: 8, right: 12, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            minTickGap={25}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickFormatter={(d) =>
              new Date(d + "T12:00:00").toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
              })
            }
            dy={10}
          />
          <YAxis
            width={62}
            tickCount={5}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickFormatter={(v) => "S/ " + Number(v) / 100}
          />
          <Tooltip
            formatter={(v) => [money(Number(v)), "Ventas"]}
            labelFormatter={(v) => date(String(v))}
            contentStyle={{
              borderRadius: 6,
              border: "1px solid var(--line)",
              background: "var(--panel)",
              color: "var(--ink)",
              fontSize: 13,
            }}
          />
          {bars ? (
            <Bar dataKey="total_cents" fill="var(--chart)" maxBarSize={34} isAnimationActive={false} />
          ) : (
            <Line
              type="linear"
              dataKey="total_cents"
              stroke="var(--chart)"
              strokeWidth={2}
              dot={data.length === 1}
              isAnimationActive={false}
              activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--panel)" }}
            />
          )}
        </Plot>
      </ResponsiveContainer>
    </div>
  );
}
function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [showPassword, setShowPassword] = useState(false);
  return (
    <main className="login">
      <section className="login-story" aria-label="Sobre Nova Salud">
        <Logo />
        <div className="story-body">
          <span className="login-kicker"><span /> Tu botica conectada</span>
          <h2>Cada caja.<br />Cada lote.<br /><em>Bajo control.</em></h2>
          <p>Un espacio para vender, reponer y cuidar lo que tienes en inventario.</p>
        </div>
        <LoginArtwork />
        <div className="login-capabilities">
          <span><Package size={16} /> Inventario</span>
          <span><ShoppingCart size={16} /> Punto de venta</span>
          <span><ShieldCheck size={16} /> Trazabilidad</span>
        </div>
      </section>
      <section className="login-form">
        <div className="login-tools">
          <div className="mobile-logo">
            <Logo />
          </div>
          <ThemeSwitcher />
        </div>
        <div className="login-form-inner">
          <span className="login-welcome">Bienvenido a Nova Salud</span>
          <h1>Todo listo para<br />un nuevo día.</h1>
          <p>Inicia sesión con tu cuenta de trabajo.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              const f = new FormData(e.currentTarget);
              setBusy(true);
              setError("");
              try {
                const d = await api<{ user: User }>(
                  "login",
                  "POST",
                  Object.fromEntries(f),
                );
                onLogin(d.user);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Correo electrónico">
              <input
                name="email"
                type="email"
                autoComplete="username"
                placeholder="nombre@ejemplo.com"
                required
              />
            </Field>
            <div className="field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="password-field">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <ErrorBox message={error} />}
            <button className="button primary login-submit" disabled={busy}>
              {busy ? (
                <>Ingresando… <LoaderCircle className="spin" size={18} /></>
              ) : (
                <>
                  Iniciar sesión <ArrowUpRight size={19} />
                </>
              )}
            </button>
          </form>
          <div className="login-note">
            <ShieldCheck size={21} />
            <span>
              Acceso exclusivo para el equipo.
              <br />
              <small>Solicita tus credenciales al administrador.</small>
            </span>
          </div>
        </div>
        <footer>
          Nova Salud <span>·</span> Gestión de inventario y ventas
        </footer>
      </section>
    </main>
  );
}
export default function App() {
  const [user, setUser] = useState<User | null>(null),
    [boot, setBoot] = useState(true),
    [bootError, setBootError] = useState(""),
    [demo, setDemo] = useState(false),
    [view, setView] = useState<View>("dashboard"),
    [mobile, setMobile] = useState(false),
    [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1121px)").matches),
    [alertTab, setAlertTab] = useState<AlertTab>("stock"),
    [toast, setToast] = useState(""),
    [sale, setSale] = useState<Sale | null>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const menuDialog = useRef<HTMLDialogElement>(null);
  const notify = (s: string) => setToast(s);
  const load = () => {
    setBoot(true);
    setBootError("");
    api<{ user: User | null; demo: boolean }>("session")
      .then((d) => {
        setUser(d.user);
        setDemo(d.demo);
        if (d.user?.role === "seller") setView("pos");
      })
      .catch((e) => setBootError(e.message))
      .finally(() => setBoot(false));
  };
  useEffect(load, []);
  useEffect(() => {
    const expired = () => {
      setUser(null);
      setSale(null);
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1121px)");
    const updateViewport = () => {
      setDesktop(query.matches);
      if (query.matches) setMobile(false);
    };
    query.addEventListener("change", updateViewport);
    return () => query.removeEventListener("change", updateViewport);
  }, []);
  useLayoutEffect(() => {
    const dialog = menuDialog.current;
    if (!dialog) return;
    if (desktop) {
      dialog.close();
      dialog.open = true;
      return;
    }
    if (!mobile) {
      dialog.close();
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = originalOverflow;
    };
  }, [mobile, desktop, user]);
  const navigate = (v: View, tab: AlertTab = "stock") => {
    setView(v);
    if (v === "alerts") setAlertTab(tab);
    setMobile(false);
    window.scrollTo(0, 0);
  };
  const openSale = async (id: number) => {
    try {
      setSale(await api<Sale>("sales/" + id));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  if (boot)
    return (
      <div className="boot">
        <Logo />
        <Loading />
      </div>
    );
  if (bootError)
    return (
      <div className="boot">
        <Logo />
        <ErrorBox message={bootError} retry={load} />
      </div>
    );
  if (!user)
    return (
      <Login
        onLogin={(u) => {
          setUser(u);
          setView(u.role === "admin" ? "dashboard" : "pos");
        }}
      />
    );
  const admin = user.role === "admin",
    nav: View[] = admin
      ? [
          "dashboard",
          "pos",
          "inventory",
          "sales",
          "movements",
          "alerts",
          "reports",
        ]
      : ["pos", "inventory", "sales"];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-workspace">Ir al contenido</a>
      <header className="masthead">
        <Logo />
        <div className="masthead-tools">
          <ThemeSwitcher />
          <div className="profile">
            <span className="avatar">
              {user.name
                .split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{admin ? "Administrador" : "Vendedor"}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              onClick={async () => {
                try {
                  await api("logout", "POST", {});
                  setUser(null);
                  setSale(null);
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <dialog
        ref={menuDialog}
        id="workspace-menu"
        className={"sidebar " + (mobile ? "open" : "")}
        role={desktop ? "presentation" : undefined}
        aria-label="Navegación de Nova Salud"
        onKeyDown={(event) => {
          if (desktop || event.key !== "Tab") return;
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onCancel={(event) => {
          event.preventDefault();
          setMobile(false);
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget || desktop) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX > bounds.right || event.clientX < bounds.left) setMobile(false);
        }}
      >
        <div className="drawer-heading">
          <Logo />
          <button className="icon-button" aria-label="Cerrar navegación" onClick={() => setMobile(false)}><X size={21} /></button>
        </div>
        <nav aria-label="Operación">
          {[...nav, ...(admin ? ["users" as const] : []), "help" as const].map((item) => {
            const Icon = icons[item];
            return (
              <button
                key={item}
                className={"nav-item " + (view === item ? "active" : "")}
                aria-current={view === item ? "page" : undefined}
                onClick={() => navigate(item)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item === "help" ? "Ayuda y guía" : labels[item]}</span>
              </button>
            );
          })}
        </nav>
      </dialog>
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              ref={menuTrigger}
              aria-label="Abrir menú"
              aria-controls="workspace-menu"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span className="workspace-label">{labels[view]}</span>
          </div>
          <div className="topbar-right">
            <span className="today">
              <Clock3 size={14} />
              {new Date().toLocaleDateString("es-PE", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "America/Lima",
              })}
            </span>
            {demo && (
              <span className="demo-label">Entorno de demostración</span>
            )}
            {admin && (
              <button
                className="notification-button"
                aria-label="Ver alertas"
                onClick={() => navigate("alerts")}
              >
                <Bell size={19} />
              </button>
            )}

          </div>
        </header>
        <main id="main-workspace" tabIndex={-1} className={`main-content view-${view}${view === "pos" ? " pos-main" : ""}`}>
          {view === "dashboard" && admin && (
            <Dashboard navigate={navigate} openSale={openSale} />
          )}
          {view === "inventory" && <Inventory admin={admin} notify={notify} />}
          {view === "pos" && (
            <POS
              onSale={(s) => {
                setSale(s);
                notify("Venta registrada. El inventario ya está actualizado.");
              }}
            />
          )}
          {view === "sales" && <Sales openSale={openSale} admin={admin} />}
          {view === "movements" && admin && <Movements />}
          {view === "alerts" && admin && (
            <AlertPage navigate={navigate} tab={alertTab} setTab={setAlertTab} />
          )}
          {view === "reports" && admin && <Reports />}
          {view === "users" && admin && <Team notify={notify} />}
          {view === "help" && <Help admin={admin} navigate={navigate} />}
        </main>
        <footer className="app-footer">
          <span>Nova Salud · Botica operativa</span>
          <span>Inventario por lote / Caja</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          {toast}
          <button aria-label="Cerrar aviso" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {sale && (
        <SaleDetail
          sale={sale}
          admin={admin}
          onClose={() => setSale(null)}
          onUpdate={(s) => {
            setSale(s);
            notify("Venta anulada y existencias repuestas.");
          }}
        />
      )}
    </div>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="title-action">{action}</div>}
    </div>
  );
}
function Sync({ refresh }: { refresh: () => void }) {
  return (
    <button
      className="sync"
      onClick={refresh}
      title="Actualiza automáticamente cada 30 segundos"
    >
      <RefreshCw size={13} /> Actualización cada 30 s
    </button>
  );
}
function Dashboard({
  navigate,
  openSale,
}: {
  navigate: (view: View, tab?: AlertTab) => void;
  openSale: (id: number) => void;
}) {
  const { data: d, loading, error, refresh } = useResource<Report>("reports");
  return (
    <div className="overview">
      <PageTitle
        eyebrow="Tu centro de operaciones"
        title="Vista general"
        description="Estado de caja, existencias y vencimientos de la botica."
        action={
          <button className="button primary" onClick={() => navigate("pos")}>
            <Plus size={18} /> Nueva venta
          </button>
        }
      />
      {error ? (
        <ErrorBox message={error} retry={refresh} />
      ) : loading ? (
        <Loading />
      ) : d && (
        <div className="overview-grid">
          <section className="cash-today" aria-label="Resumen del día">
            <div className="cash-heading"><span><Wallet size={18} /> Caja de hoy</span><span className="cash-scope">Ventas confirmadas</span></div>
            <strong className="cash-amount">{money(d.today_cents)}</strong>
            <div className="cash-details">
              <span><b>{d.today_count}</b> {d.today_count === 1 ? "venta registrada" : "ventas registradas"}</span>
              <span><b>{d.product_count}</b> productos activos</span>
            </div>
            <button type="button" onClick={() => navigate("sales")}>Ver operaciones de caja <ArrowUpRight size={17} /></button>
          </section>
          <section className="panel stock-queue" aria-label="Control de lotes">
            <div className="panel-header">
              <div>
                <h2>Pendientes de botica</h2>
                <p>Abre un pendiente para revisar sus lotes o productos.</p>
              </div>
            </div>
            {([
              {
                tab: "stock",
                title: "Productos por reponer",
                count: d.low_count,
                note: d.out_count === 1 ? "Incluye 1 agotado" : `Incluye ${d.out_count} agotados`,
                Icon: Package,
                tone: "warning",
              },
              {
                tab: "expired",
                title: "Lotes vencidos",
                count: d.expired_count,
                note: "Con unidades en inventario",
                Icon: TriangleAlert,
                tone: "negative",
              },
              {
                tab: "expiring",
                title: "Lotes próximos a vencer",
                count: d.expiring_count,
                note: "En los próximos 30 días",
                Icon: Clock3,
                tone: "warning",
              },
            ] as const).map(({ tab, title, count, note, Icon, tone }) => (
              <button className="queue-row" key={tab} onClick={() => navigate("alerts", tab)}>
                <Icon size={18} aria-hidden="true" />
                <span>
                  <strong>{title}</strong>
                  <small>{note}</small>
                </span>
                <b className={count ? tone : "muted"}>{count}</b>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            ))}
          </section>
          <section className="panel overview-sales">
            <div className="panel-header">
              <div>
                <h2>Ventas de la semana</h2>
                <p>{date(d.from)} – {date(d.to)}</p>
              </div>
              <Sync refresh={refresh} />
            </div>
            <div className="chart-total">
              {money(d.period_cents)}
              <span>{d.period_count} {d.period_count === 1 ? "venta confirmada" : "ventas confirmadas"}</span>
            </div>
            <Chart data={d.series} />
          </section>
          <section className="panel overview-products">
            <div className="panel-header">
              <div>
                <h2>Productos más vendidos</h2>
                <p>Unidades vendidas esta semana</p>
              </div>
            </div>
            {d.top_products.length ? (
              <ol className="ranked-products">
                {d.top_products.map((product) => (
                  <li key={product.product_id}>
                    <span>{product.name}</span>
                    <b>{product.quantity} <small>uds.</small></b>
                  </li>
                ))}
              </ol>
            ) : <Empty title="Aún no hay ventas esta semana" />}
            <button className="panel-link" onClick={() => navigate("reports")}>
              Explorar reportes <ArrowRight size={15} />
            </button>
          </section>
          <section className="panel overview-recent">
            <div className="panel-header">
              <div>
                <h2>Ventas recientes</h2>
                <p>Últimos comprobantes registrados</p>
              </div>
              <button className="text-button" onClick={() => navigate("sales")}>
                Ver todas <ArrowUpRight size={15} />
              </button>
            </div>
            <SalesTable rows={d.recent_sales} openSale={openSale} />
          </section>
        </div>
      )}
    </div>
  );
}
function Stat({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">{title}</div>
      <strong>{value}</strong>
      <p>{note}</p>
    </div>
  );
}
function Inventory({
  admin,
  notify,
}: {
  admin: boolean;
  notify: (s: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [cat, setCat] = useState(""),
    [status, setStatus] = useState("all"),
    [page, setPage] = useState(1),
    [product, setProduct] = useState<Product | null | undefined>(undefined),
    [stock, setStock] = useState(false),
    [detail, setDetail] = useState<Product | null>(null);
  const q = useDebounce(search),
    categories = useResource<Category[]>("categories"),
    { data, loading, error, refresh } = useResource<Page<Product>>(
      `products?search=${encodeURIComponent(q)}&category_id=${cat}&status=${status}&page=${page}`,
    );
  useEffect(() => setPage(1), [q, cat, status]);
  const done = () => {
    setProduct(undefined);
    setStock(false);
    refresh();
    notify("Cambios guardados correctamente.");
  };
  return (
    <>
      <PageTitle
        eyebrow="Catálogo y lotes"
        title="Inventario"
        description="Consulta disponibilidad y sigue el recorrido de cada lote."
        action={
          admin && (
            <>
              <button
                className="button secondary"
                onClick={() => setStock(true)}
              >
                <ArrowDownLeft size={17} /> Registrar entrada
              </button>
              <button
                className="button primary"
                onClick={() => setProduct(null)}
              >
                <Plus size={18} /> Nuevo producto
              </button>
            </>
          )
        }
      />
      <section className="panel inventory-register">
        <div className="register-tabs" role="group" aria-label="Estado de inventario">
          {(admin
            ? [["all", "Todos"], ["low", "Stock bajo"], ["out", "Agotados"], ["inactive", "Inactivos"]]
            : [["all", "Todos"], ["low", "Stock bajo"], ["out", "Agotados"]]
          ).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>
              {label}
            </button>
          ))}
        </div>
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              aria-label="Buscar productos"
              placeholder="Buscar por nombre o código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                aria-label="Limpiar búsqueda"
                onClick={() => setSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="toolbar-filters">
            <select
              aria-label="Categoría"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.data?.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? (
          <ErrorBox message={error} retry={refresh} />
        ) : loading ? (
          <Loading />
        ) : data?.data.length ? (
          <>
            <div className="table-wrap">
              <table className="mobile-records" role="table">
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader">Producto</th>
                    <th role="columnheader">Categoría</th>
                    <th role="columnheader" className="numeric">Precio de venta</th>
                    <th role="columnheader" className="numeric">Stock disponible</th>
                    <th role="columnheader">Estado</th>
                    <th role="columnheader" />
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {data.data.map((p) => (
                    <tr role="row" key={p.id}>
                      <td role="cell" data-column="primary">
                        <ProductName p={p} />
                      </td>
                      <td role="cell" data-column="label" data-label="Categoría">
                        <span className="category-tag">{p.category.name}</span>
                      </td>
                      <td role="cell" data-column="label" data-label="Precio" className="amount">{money(p.price_cents)}</td>
                      <td role="cell" data-column="label" data-label="Disponible" className="numeric stock-cell">
                        <strong>{p.available_stock ?? 0}</strong>
                        <small className="table-sub">
                          Mín. {p.min_stock} · Total {p.total_stock ?? 0}
                        </small>
                      </td>
                      <td role="cell" data-column="label" data-label="Estado">
                        <StockBadge p={p} />
                      </td>
                      <td role="cell" data-column="actions">
                        <div className="row-actions">
                          <button
                            className="text-button"
                            onClick={async () => {
                              try {
                                setDetail(
                                  await api<Product>("products/" + p.id),
                                );
                              } catch (e) {
                                notify((e as Error).message);
                              }
                            }}
                          >
                            Ver lotes
                          </button>
                          {admin && (
                            <button
                              className="text-button"
                              onClick={() => setProduct(p)}
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data} onPage={setPage} />
          </>
        ) : (
          <Empty
            title="No encontramos productos"
            text="Prueba con otro término o registra un nuevo producto."
          />
        )}
      </section>
      <div className="table-note">
        <ShieldCheck size={15} /> El stock disponible excluye lotes vencidos. El
        total incluye todas las existencias.
        <Sync refresh={refresh} />
      </div>
      {product !== undefined && (
        <ProductForm
          product={product}
          categories={categories.data || []}
          onClose={() => setProduct(undefined)}
          done={done}
        />
      )}
      {stock && <StockForm onClose={() => setStock(false)} done={done} />}
      {detail && (
        <Modal
          title={detail.name}
          subtitle="Trazabilidad por lote"
          onClose={() => setDetail(null)}
        >
          <div className="modal-body">
            {detail.batches?.length ? (
              <div className="batch-list">
                {detail.batches.map((b) => (
                  <div className="batch-item" key={b.id}>
                    <div>
                      <strong>{b.code}</strong>
                      <small>Vence el {date(b.expires_at)}</small>
                    </div>
                    <strong>{b.quantity} uds.</strong>
                    <Status tone={b.expires_at < localDay() ? "red" : "teal"}>
                      {b.expires_at < localDay() ? "Vencido" : "Vigente"}
                    </Status>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="Sin lotes"
                text="Registra una entrada para agregar existencias."
              />
            )}
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setDetail(null)}
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function StockBadge({ p }: { p: Product }) {
  return !p.active ? (
    <Status>Inactivo</Status>
  ) : !(p.available_stock ?? 0) ? (
    <Status tone="red">Agotado</Status>
  ) : (p.available_stock ?? 0) <= p.min_stock ? (
    <Status tone="amber">Stock bajo</Status>
  ) : (
    <Status tone="teal">Disponible</Status>
  );
}
function ProductForm({
  product: p,
  categories,
  onClose,
  done,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  done: () => void;
}) {
  return (
    <Modal
      title={p ? "Editar producto" : "Nuevo producto"}
      subtitle="La información de cada producto, clara y al día."
      onClose={onClose}
    >
      <Form
        onCancel={onClose}
        submit={async (f) => {
          const price = String(f.get("price"));
          if (!/^\d+(\.\d{1,2})?$/.test(price))
            throw new Error("El precio admite como máximo dos decimales.");
          const [units, fraction = ""] = price.split(".");
          const d = {
            ...Object.fromEntries(f),
            category_id: Number(f.get("category_id")),
            price_cents: Number(units) * 100 + Number(fraction.padEnd(2, "0")),
            min_stock: Number(f.get("min_stock")),
            active: f.get("active") === "true",
          };
          await api("products" + (p ? "/" + p.id : ""), p ? "PUT" : "POST", d);
          done();
        }}
      >
        {(errors) => (
          <>
            <Field label="Nombre del producto" error={errors.name} full>
              <input
                name="name"
                defaultValue={p?.name}
                maxLength={160}
                required
                placeholder="Ej. Paracetamol 500 mg"
              />
            </Field>
            <Field label="Código único" error={errors.code}>
              <input
                name="code"
                defaultValue={p?.code}
                maxLength={40}
                required
                placeholder="PAR-500"
              />
            </Field>
            <Field label="Categoría" error={errors.category_id}>
              <select
                name="category_id"
                defaultValue={p?.category_id || ""}
                required
              >
                <option value="" disabled>
                  Seleccionar categoría
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Presentación" error={errors.presentation} full>
              <input
                name="presentation"
                defaultValue={p?.presentation}
                maxLength={100}
                required
                placeholder="Ej. Blíster · 10 tabletas"
              />
            </Field>
            <Field label="Precio de venta (S/)" error={errors.price_cents}>
              <input
                name="price"
                type="number"
                min="0"
                max="100000"
                step="0.01"
                defaultValue={p ? (p.price_cents / 100).toFixed(2) : ""}
                required
              />
            </Field>
            <Field label="Stock mínimo" error={errors.min_stock}>
              <input
                name="min_stock"
                type="number"
                min="0"
                max="100000"
                step="1"
                defaultValue={p?.min_stock ?? 10}
                required
              />
            </Field>
            <Field label="Descripción" error={errors.description} full>
              <textarea
                name="description"
                defaultValue={p?.description}
                maxLength={2000}
                rows={2}
              />
            </Field>
            <Field label="Disponibilidad" error={errors.active} full>
              <select name="active" defaultValue={String(p?.active ?? true)}>
                <option value="true">Activo</option>
                <option value="false">Inactivo (conservar historial)</option>
              </select>
            </Field>
          </>
        )}
      </Form>
    </Modal>
  );
}
function StockForm({
  onClose,
  done,
}: {
  onClose: () => void;
  done: () => void;
}) {
  const [search, setSearch] = useState(""),
    [pid, setPid] = useState(""),
    [selected, setSelected] = useState<Product | null>(null),
    [type, setType] = useState("entry");
  const q = useDebounce(search),
    products = useResource<Page<Product>>(
      "products?per_page=100&search=" + encodeURIComponent(q),
    );
  const key = useIdempotency();
  useEffect(() => {
    if (pid)
      api<Product>("products/" + pid)
        .then(setSelected)
        .catch(() => setSelected(null));
    else setSelected(null);
  }, [pid]);
  return (
    <Modal
      title="Registrar movimiento"
      subtitle="Cada cambio de stock queda registrado con su motivo."
      onClose={onClose}
    >
      <Form
        label="Registrar movimiento"
        onCancel={onClose}
        submit={async (f) => {
          const d = {
            ...Object.fromEntries(f),
            product_id: Number(pid),
            quantity: Number(f.get("quantity")),
            batch_id: f.get("batch_id") ? Number(f.get("batch_id")) : null,
          };
          await api("stock", "POST", d, key(d));
          done();
        }}
      >
        {(errors) => (
          <>
            <Field label="Buscar producto" full>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre o código"
              />
            </Field>
            <Field label="Producto" error={errors.product_id} full>
              <select
                name="product_id"
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                required
              >
                <option value="">Selecciona un producto</option>
                {products.data?.data.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name} · {p.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Operación" error={errors.type} full>
              <select
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="entry">Entrada de existencias</option>
                <option value="adjustment">Ajuste de un lote existente</option>
              </select>
            </Field>
            {type === "entry" ? (
              <>
                <Field label="Código de lote" error={errors.code}>
                  <input name="code" maxLength={60} required />
                </Field>
                <Field label="Fecha de vencimiento" error={errors.expires_at}>
                  <input
                    name="expires_at"
                    type="date"
                    min={localDay()}
                    required
                  />
                </Field>
              </>
            ) : (
              <Field label="Lote a ajustar" error={errors.batch_id} full>
                <select name="batch_id" required key={pid}>
                  <option value="">Selecciona un lote</option>
                  {selected?.batches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} · {b.quantity} uds. · {date(b.expires_at)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field
              label={
                type === "entry"
                  ? "Unidades que ingresan"
                  : "Variación (+ ingreso / − retiro)"
              }
              error={errors.quantity}
              full
            >
              <input
                name="quantity"
                type="number"
                step="1"
                min={type === "entry" ? 1 : -100000}
                max="100000"
                required
                placeholder={type === "entry" ? "Ej. 25" : "Ej. -3"}
              />
            </Field>
            <Field label="Motivo" error={errors.reason} full>
              <textarea
                name="reason"
                rows={2}
                minLength={5}
                maxLength={255}
                placeholder="Ej. Reposición de proveedor / corrección por conteo físico"
                required
              />
            </Field>
          </>
        )}
      </Form>
    </Modal>
  );
}
function POS({ onSale }: { onSale: (s: Sale) => void }) {
  const [search, setSearch] = useState(""),
    [cat, setCat] = useState(""),
    [cart, setCart] = useState<{ p: Product; qty: number }[]>([]),
    [pay, setPay] = useState("cash"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  const q = useDebounce(search),
    categories = useResource<Category[]>("categories"),
    {
      data,
      loading,
      error: loadError,
      refresh,
    } = useResource<Page<Product>>(
      `products?per_page=100&search=${encodeURIComponent(q)}&category_id=${cat}`,
    );
  const key = useIdempotency();
  const total = cart.reduce((sum, i) => sum + i.p.price_cents * i.qty, 0);
  const add = (p: Product) => {
    setError("");
    setCart((rows) => {
      const i = rows.find((i) => i.p.id === p.id);
      if (i)
        return rows.map((i) =>
          i.p.id === p.id
            ? { ...i, qty: Math.min(i.qty + 1, p.available_stock ?? 0) }
            : i,
        );
      return [...rows, { p, qty: 1 }];
    });
  };
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const d = {
      payment_method: pay,
      items: cart.map((i) => ({ product_id: i.p.id, quantity: i.qty })),
    };
    try {
      const result = await api<{ sale: Sale }>("sales", "POST", d, key(d));
      key.complete();
      setCart([]);
      setConfirm(false);
      refresh();
      onSale(result.sale);
    } catch (e) {
      setError((e as Error).message);
      setConfirm(false);
      refresh();
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageTitle
        eyebrow="Caja"
        title="Punto de venta"
        description="Busca productos y prepara el comprobante de la venta."
      />
      <div className="pos-layout">
        <section className="pos-catalog">
          <div className="search-box large">
            <Search size={21} />
            <input
              autoFocus
              aria-label="Buscar para vender"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Escribe el nombre o código del producto…"
            />
            {search && (
              <button
                aria-label="Limpiar búsqueda"
                onClick={() => setSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="category-tabs">
            <button
              className={!cat ? "selected" : ""}
              onClick={() => setCat("")}
            >
              Todos
            </button>
            {categories.data?.map((c) => (
              <button
                key={c.id}
                className={cat === String(c.id) ? "selected" : ""}
                onClick={() => setCat(String(c.id))}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="catalog-meta">
            <span>
              {data?.total ?? 0} productos{" "}
              <span className="muted">en el catálogo</span>
            </span>
            <Sync refresh={refresh} />
          </div>
          {loadError ? (
            <ErrorBox message={loadError} retry={refresh} />
          ) : loading ? (
            <Loading />
          ) : (
            <div className="product-grid">
              {data?.data.map((p) => (
                <button
                  className="catalog-card"
                  key={p.id}
                  disabled={!(p.available_stock ?? 0)}
                  onClick={() => add(p)}
                >
                  <div className="catalog-card-top">
                    <ProductIcon category={p.category_id} />
                    <span
                      className={
                        (p.available_stock ?? 0) <= p.min_stock
                          ? "stock-number low"
                          : "stock-number"
                      }
                    >
                      {p.available_stock ?? 0} disponibles
                    </span>
                  </div>
                  <span className="catalog-code">{p.code}</span>
                  <h3>{p.name}</h3>
                  <p>{p.presentation}</p>
                  <div className="catalog-card-bottom">
                    <strong>{money(p.price_cents)}</strong>
                    <span>
                      <Plus size={18} />
                    </span>
                  </div>
                </button>
              ))}
              {!data?.data.length && (
                <Empty
                  title="Sin coincidencias"
                  text="Busca otro nombre o código de producto."
                />
              )}
            </div>
          )}
        </section>
        <aside id="comprobante" tabIndex={-1} className="cart panel" aria-label="Comprobante en preparación">
          <div className="cart-header">
            <div>
              <ShoppingBag size={20} />
              <h2>Venta actual</h2>
              <span className="count-badge">{cart.length}</span>
            </div>
            {cart.length > 0 && (
              <button
                className="text-button"
                onClick={() => {
                  setCart([]);
                  setError("");
                }}
              >
                Vaciar
              </button>
            )}
          </div>
          <div className="cart-items">
            {!cart.length ? (
              <div className="cart-empty">
                <span>
                  <ShoppingCart size={38} />
                </span>
                <h3>Comprobante vacío</h3>
                <p>
                  Selecciona un producto del catálogo
                  <br />
                  para comenzar esta venta.
                </p>
              </div>
            ) : (
              cart.map((i) => (
                <div className="cart-item" key={i.p.id}>
                  <div className="cart-item-name">
                    <strong>{i.p.name}</strong>
                    <button
                      className="icon-button"
                      aria-label={"Quitar " + i.p.name}
                      onClick={() =>
                        setCart((rows) => rows.filter((r) => r.p.id !== i.p.id))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <small>{money(i.p.price_cents)} por unidad</small>
                  <div className="cart-item-bottom">
                    <div className="quantity">
                      <button
                        aria-label={"Reducir " + i.p.name}
                        disabled={i.qty <= 1}
                        onClick={() =>
                          setCart((rows) =>
                            rows.map((r) =>
                              r.p.id === i.p.id ? { ...r, qty: r.qty - 1 } : r,
                            ),
                          )
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        aria-label={"Cantidad de " + i.p.name}
                        min="1"
                        max={i.p.available_stock ?? 0}
                        value={i.qty}
                        onChange={(e) => {
                          const n = Math.trunc(Number(e.target.value));
                          setCart((rows) =>
                            rows.map((r) =>
                              r.p.id === i.p.id
                                ? {
                                    ...r,
                                    qty: Math.max(
                                      1,
                                      Math.min(
                                        n || 1,
                                        r.p.available_stock ?? 0,
                                      ),
                                    ),
                                  }
                                : r,
                            ),
                          );
                        }}
                      />
                      <button
                        aria-label={"Aumentar " + i.p.name}
                        disabled={i.qty >= (i.p.available_stock ?? 0)}
                        onClick={() => add(i.p)}
                      >
                        +
                      </button>
                    </div>
                    <b>{money(i.p.price_cents * i.qty)}</b>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="cart-checkout">
            <span className="small-label">MÉTODO DE PAGO</span>
            <div className="payment-options">
              {Object.entries(payment).map(([value, label]) => {
                const Icon =
                  value === "cash"
                    ? Wallet
                    : value === "card"
                      ? CreditCard
                      : ArrowUpRight;
                return (
                  <button
                    key={value}
                    className={pay === value ? "selected" : ""}
                    onClick={() => setPay(value)}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="cart-total">
              <span>
                Total de la venta
                <small>
                  {cart.reduce((s, i) => s + i.qty, 0)} unidades · PEN
                </small>
              </span>
              <strong>{money(total)}</strong>
            </div>
            {error && <ErrorBox message={error} />}
            <button
              className="button primary checkout-button"
              disabled={!cart.length || busy}
              onClick={() => setConfirm(true)}
            >
              <CheckCircle2 size={18} /> Confirmar venta{" "}
              <ArrowRight size={17} />
            </button>
            <div className="secure-note">
              <ShieldCheck size={13} /> Stock verificado al confirmar la venta
            </div>
          </div>
        </aside>
      </div>
      {cart.length > 0 && (
        <button
          type="button"
          className="mobile-cart-shortcut button primary"
          onClick={() => {
            const receipt = document.getElementById("comprobante");
            receipt?.scrollIntoView({ block: "start" });
            receipt?.focus({ preventScroll: true });
          }}
        >
          <span>Ver comprobante · {money(total)}</span><ArrowDown size={16} />
        </button>
      )}
      {confirm && (
        <Modal
          title="¿Confirmar esta venta?"
          subtitle="Revisa el importe y el método de pago antes de continuar."
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <div className="confirm-sale">
            <span>Total a registrar</span>
            <strong>{money(total)}</strong>
            <p>
              {cart.reduce((s, i) => s + i.qty, 0)} unidades · {payment[pay]}
            </p>
            <div className="info-note">
              La venta descontará las existencias y generará un comprobante
              interno.
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirm(false)}
            >
              Volver
            </button>
            <button className="button primary" disabled={busy} onClick={submit}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Check size={17} />
              )}{" "}
              Registrar venta
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function SalesTable({
  rows,
  openSale,
}: {
  rows: Sale[];
  openSale: (id: number) => void;
}) {
  return rows.length ? (
    <div className="table-wrap">
      <table className="mobile-records" role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader">Comprobante</th>
            <th role="columnheader">Fecha</th>
            <th role="columnheader">Pago</th>
            <th role="columnheader" className="numeric">Importe</th>
            <th role="columnheader">Estado</th>
            <th role="columnheader" />
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((s) => (
            <tr role="row" key={s.id}>
              <td role="cell" data-column="primary">
                <span className="receipt-code">{saleCode(s.id)}</span>
                <small className="table-sub">{s.user?.name}</small>
              </td>
              <td role="cell" data-column="label" data-label="Fecha">{date(s.created_at)}</td>
              <td role="cell" data-column="label" data-label="Pago">{payment[s.payment_method]}</td>
              <td role="cell" data-column="label" data-label="Importe" className="amount">{money(s.total_cents)}</td>
              <td role="cell" data-column="label" data-label="Estado">
                <Status tone={s.status === "completed" ? "teal" : "red"}>
                  {s.status === "completed" ? "Confirmada" : "Anulada"}
                </Status>
              </td>
              <td role="cell" data-column="actions">
                <button
                  className="icon-button"
                  aria-label={"Ver venta " + saleCode(s.id)}
                  onClick={() => openSale(s.id)}
                >
                  <ArrowUpRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="Sin ventas registradas" />
  );
}
function Sales({
  openSale,
  admin,
}: {
  openSale: (id: number) => void;
  admin: boolean;
}) {
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1);
  const { data, loading, error, refresh } = useResource<Page<Sale>>(
    `sales?page=${page}&from=${from}&to=${to}&status=${status}`,
  );
  useEffect(() => setPage(1), [from, to, status]);
  return (
    <>
      <PageTitle
        eyebrow="Registro de caja"
        title="Historial de ventas"
        description={
          admin
            ? "Consulta operaciones, revisa detalles y administra anulaciones."
            : "Consulta tus ventas y sus comprobantes internos."
        }
      />
      <section className="panel sales-register">
        <div className="panel-header">
          <div><h2>Comprobantes internos</h2><p>Filtra por fecha o estado de la operación.</p></div>
          {data && !loading && !error && <span className="record-count">{data.total} en el registro</span>}
        </div>
        <div className="table-toolbar">
          <div className="date-filters">
            <label>
              Desde
              <input
                aria-label="Ventas desde"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              Hasta
              <input
                aria-label="Ventas hasta"
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
          <select
            aria-label="Estado de venta"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="completed">Confirmadas</option>
            <option value="cancelled">Anuladas</option>
          </select>
        </div>
        {error ? (
          <ErrorBox message={error} retry={refresh} />
        ) : loading ? (
          <Loading />
        ) : (
          data && (
            <>
              <SalesTable rows={data.data} openSale={openSale} />
              <Pagination page={data} onPage={setPage} />
            </>
          )
        )}
      </section>
      <div className="table-note">
        <FileText size={15} /> Los comprobantes son documentos internos.
        <Sync refresh={refresh} />
      </div>
    </>
  );
}
function SaleDetail({
  sale: s,
  admin,
  onClose,
  onUpdate,
}: {
  sale: Sale;
  admin: boolean;
  onClose: () => void;
  onUpdate: (s: Sale) => void;
}) {
  const [cancel, setCancel] = useState(false);
  const key = useIdempotency();
  return (
    <Modal
      title={saleCode(s.id)}
      subtitle="Detalle de venta y comprobante interno"
      onClose={onClose}
      wide
    >
      <div className="receipt modal-body">
        <div className="receipt-brand">
          <Logo />
          <div>
            <b>COMPROBANTE INTERNO</b>
            <small>
              {saleCode(s.id)} · {date(s.created_at)}
            </small>
          </div>
        </div>
        <div className="receipt-meta">
          <span>
            Responsable<strong>{s.user?.name}</strong>
          </span>
          <span>
            Método de pago<strong>{payment[s.payment_method]}</strong>
          </span>
          <span>
            Estado
            <Status tone={s.status === "completed" ? "teal" : "red"}>
              {s.status === "completed" ? "Confirmada" : "Anulada"}
            </Status>
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>P. unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {s.items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <strong>{i.product_name}</strong>
                    <small className="table-sub">{i.product_code}</small>
                    <small className="table-sub">
                      {i.allocations
                        .map((a) => a.batch.code + " × " + a.quantity)
                        .join(" · ")}
                    </small>
                  </td>
                  <td>{i.quantity}</td>
                  <td>{money(i.unit_price_cents)}</td>
                  <td className="amount">{money(i.subtotal_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="receipt-total">
          Total registrado <strong>{money(s.total_cents)}</strong>
        </div>
        {s.status === "cancelled" && (
          <div className="cancel-note">
            <XCircle size={18} />
            <div>
              <strong>Venta anulada</strong>
              <p>{s.cancel_reason}</p>
              <small>
                {s.canceller?.name} · {s.cancelled_at && date(s.cancelled_at)}
              </small>
            </div>
          </div>
        )}
        <p className="receipt-disclaimer">
          Documento de control interno. No constituye un comprobante electrónico
          autorizado por SUNAT.
        </p>
        {s.demo && (
          <p className="receipt-disclaimer">Datos ficticios de demostración.</p>
        )}
      </div>
      {cancel ? (
        <div className="cancel-form">
          <h3>Motivo de anulación</h3>
          <Form
            label="Anular y reponer stock"
            onCancel={() => setCancel(false)}
            submit={async (f) => {
              const d = { reason: f.get("reason") };
              const result = await api<{ sale: Sale }>(
                "sales/" + s.id + "/cancel",
                "POST",
                d,
                key(d),
              );
              onUpdate(result.sale);
              setCancel(false);
            }}
          >
            {(errors) => (
              <Field
                label="Describe el motivo (mínimo 5 caracteres)"
                error={errors.reason}
                full
              >
                <textarea
                  name="reason"
                  required
                  minLength={5}
                  maxLength={255}
                  rows={2}
                  placeholder="Ej. Cliente desistió de la compra"
                />
              </Field>
            )}
          </Form>
        </div>
      ) : (
        <div className="modal-footer receipt-actions">
          {admin && s.status === "completed" && (
            <button className="button danger" onClick={() => setCancel(true)}>
              <XCircle size={17} /> Anular venta
            </button>
          )}
          <button className="button secondary" onClick={onClose}>
            Cerrar
          </button>
          <button className="button primary" onClick={() => window.print()}>
            <Printer size={17} /> Imprimir
          </button>
        </div>
      )}
    </Modal>
  );
}
function Movements() {
  const [type, setType] = useState(""),
    [page, setPage] = useState(1);
  const { data, loading, error, refresh } = useResource<Page<Movement>>(
    `movements?page=${page}&type=${type}`,
  );
  return (
    <>
      <PageTitle
        eyebrow="Bitácora de lotes"
        title="Movimientos de inventario"
        description="Cada entrada, ajuste, venta y devolución tiene un registro."
      />
      <section className="panel movement-register">
        <div className="table-toolbar">
          <span className="toolbar-title">
            <Activity size={18} /> Historial de existencias
          </span>
          <select
            aria-label="Tipo de movimiento"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las operaciones</option>
            {Object.entries(movementLabel).map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <ErrorBox message={error} retry={refresh} />
        ) : loading ? (
          <Loading />
        ) : data?.data.length ? (
          <>
            <div className="table-wrap">
              <table className="mobile-records" role="table">
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader">Producto / Lote</th>
                    <th role="columnheader">Operación</th>
                    <th role="columnheader" className="numeric">Unidades</th>
                    <th role="columnheader" className="numeric">Stock del lote</th>
                    <th role="columnheader">Motivo y responsable</th>
                    <th role="columnheader">Fecha</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {data.data.map((m) => (
                    <tr role="row" key={m.id}>
                      <td role="cell" data-column="primary">
                        <strong>{m.batch.product.name}</strong>
                        <small className="table-sub">{m.batch.code}</small>
                      </td>
                      <td role="cell" data-column="label" data-label="Operación">
                        <Status tone={m.quantity > 0 ? "teal" : "neutral"}>
                          {movementLabel[m.type]}
                        </Status>
                      </td>
                      <td role="cell" data-column="label" data-label="Unidades" className={`numeric movement-units ${m.quantity > 0 ? "positive" : "negative"}`}>
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity}
                      </td>
                      <td role="cell" data-column="label" data-label="Stock del lote" className="numeric">{m.stock_after}</td>
                      <td role="cell" data-column="label" data-label="Motivo">
                        {m.reason}
                        <small className="table-sub">
                          {m.user.name}
                          {m.sale_id ? " · " + saleCode(m.sale_id) : ""}
                        </small>
                      </td>
                      <td role="cell" data-column="label" data-label="Fecha">{date(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data} onPage={setPage} />
          </>
        ) : (
          <Empty title="Sin movimientos" />
        )}
      </section>
      <div className="table-note">
        <ShieldCheck size={15} /> Los movimientos se conservan para mantener el
        historial.
        <Sync refresh={refresh} />
      </div>
    </>
  );
}
function AlertPage({
  navigate,
  tab,
  setTab,
}: {
  navigate: (v: View) => void;
  tab: AlertTab;
  setTab: (tab: AlertTab) => void;
}) {
  const { data: d, loading, error, refresh } = useResource<Alerts>("alerts");
  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} retry={refresh} />;
  if (!d) return null;
  const batches = tab === "expired" ? d.expired : d.expiring;
  return (
    <>
      <PageTitle
        eyebrow="Control de existencias"
        title="Centro de alertas"
        description="Prioriza la reposición y revisa qué lotes salen pronto de circulación."
        action={
          <button
            className="button primary"
            onClick={() => navigate("inventory")}
          >
            <PackagePlus size={18} /> Gestionar inventario
          </button>
        }
      />
      <div className="alert-summary" role="group" aria-label="Categorías de alertas">
        <button
          className={tab === "stock" ? "selected" : ""}
          aria-pressed={tab === "stock"}
          onClick={() => setTab("stock")}
        >
          <span className="stat-icon amber">
            <Package size={22} />
          </span>
          <div>
            <strong>{d.low_stock.length}</strong>
            <span>Productos por reponer</span>
          </div>
          <ArrowUpRight size={18} />
        </button>
        <button
          className={tab === "expiring" ? "selected" : ""}
          aria-pressed={tab === "expiring"}
          onClick={() => setTab("expiring")}
        >
          <span className="stat-icon purple">
            <Clock3 size={22} />
          </span>
          <div>
            <strong>{d.expiring.length}</strong>
            <span>Lotes próximos a vencer</span>
          </div>
          <ArrowUpRight size={18} />
        </button>
        <button
          className={tab === "expired" ? "selected" : ""}
          aria-pressed={tab === "expired"}
          onClick={() => setTab("expired")}
        >
          <span className="stat-icon red">
            <TriangleAlert size={22} />
          </span>
          <div>
            <strong>{d.expired.length}</strong>
            <span>Lotes vencidos</span>
          </div>
          <ArrowUpRight size={18} />
        </button>
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              {tab === "stock"
                ? "Reposición de productos"
                : tab === "expiring"
                  ? "Vencimientos en los próximos 30 días"
                  : "Lotes vencidos · venta bloqueada"}
            </h2>
            <p>
              {tab === "stock"
                ? "Productos con disponibilidad igual o inferior al mínimo configurado."
                : "Revisa las existencias y planifica su manejo con el responsable de la botica."}
            </p>
          </div>
          <Sync refresh={refresh} />
        </div>
        {tab === "stock" ? (
          d.low_stock.length ? (
            <div className="table-wrap">
              <table className="mobile-records" role="table">
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader">Producto</th>
                    <th role="columnheader">Disponible</th>
                    <th role="columnheader">Mínimo</th>
                    <th role="columnheader">Estado</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {d.low_stock.map((p) => (
                    <tr role="row" key={p.id}>
                      <td role="cell" data-column="primary">
                        <ProductName p={p} />
                      </td>
                      <td role="cell" data-column="label" data-label="Disponible" className="amount">{p.available_stock ?? 0} uds.</td>
                      <td role="cell" data-column="label" data-label="Mínimo">{p.min_stock} uds.</td>
                      <td role="cell" data-column="label" data-label="Estado">
                        <StockBadge p={p} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Todo está por encima del mínimo"
              text="No hay alertas de reposición en este momento."
            />
          )
        ) : batches.length ? (
          <div className="table-wrap">
            <table className="mobile-records" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader">Producto</th>
                  <th role="columnheader">Lote</th>
                  <th role="columnheader">Vencimiento</th>
                  <th role="columnheader">Existencias</th>
                  <th role="columnheader">Estado</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {batches.map((b) => (
                  <tr role="row" key={b.id}>
                    <td role="cell" data-column="primary">
                      <ProductName p={b.product!} />
                    </td>
                    <td role="cell" data-column="label" data-label="Lote" className="receipt-code">{b.code}</td>
                    <td role="cell" data-column="label" data-label="Vencimiento">{date(b.expires_at)}</td>
                    <td role="cell" data-column="label" data-label="Existencias">{b.quantity} uds.</td>
                    <td role="cell" data-column="label" data-label="Estado">
                      <Status tone={tab === "expired" ? "red" : "amber"}>
                        {tab === "expired" ? "Vencido" : "Próximo a vencer"}
                      </Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Sin alertas de vencimiento"
            text="No hay lotes que coincidan con este estado."
          />
        )}
      </section>
      <div className="info-note">
        <ShieldCheck size={17} /> Las alertas se calculan desde las existencias
        actuales. Los lotes vencidos se excluyen automáticamente de las ventas.
      </div>
    </>
  );
}
function Reports() {
  const initial = new Date();
  initial.setDate(initial.getDate() - 6);
  const [from, setFrom] = useState(initial.toLocaleDateString("en-CA")),
    [to, setTo] = useState(localDay());
  const {
    data: d,
    loading,
    error,
    refresh,
  } = useResource<Report>(`reports?from=${from}&to=${to}`);
  return (
    <>
      <PageTitle
        eyebrow="Análisis de caja"
        title="Reportes de ventas"
        description="Explora las ventas confirmadas del período que necesitas."
        action={
          <a
            className="button primary"
            href={`/api/reports/export?from=${from}&to=${to}`}
            download
          >
            <ArrowDownToLine size={18} /> Exportar CSV
          </a>
        }
      />
      <section className="panel report-filters">
        <div className="date-filters">
          <label>
            Fecha inicial
            <input
              type="date"
              value={from}
              onChange={(e) => {
                if (e.target.value) setFrom(e.target.value);
              }}
            />
          </label>
          <label>
            Fecha final
            <input
              type="date"
              min={from}
              value={to}
              onChange={(e) => {
                if (e.target.value) setTo(e.target.value);
              }}
            />
          </label>
        </div>
        <Sync refresh={refresh} />
      </section>
      {error ? (
        <ErrorBox message={error} retry={refresh} />
      ) : loading ? (
        <Loading />
      ) : (
        d && (
          <>
            <div className="stats-grid reports-stats">
              <Stat
                title="Importe vendido"
                value={money(d.period_cents)}
                note="Ventas confirmadas del período"
              />
              <Stat
                title="Operaciones"
                value={String(d.period_count)}
                note="Ventas que no fueron anuladas"
              />
              <Stat
                title="Ticket promedio"
                value={money(
                  d.period_count
                    ? Math.round(d.period_cents / d.period_count)
                    : 0,
                )}
                note="Importe vendido / operaciones"
              />
            </div>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Ventas por día</h2>
                  <p>
                    {date(d.from)} — {date(d.to)}
                  </p>
                </div>
              </div>
              <Chart data={d.series} bars={d.series.length <= 31} />
            </section>
            <div className="dashboard-middle report-bottom">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Productos más vendidos</h2>
                    <p>Ordenados por unidades del período</p>
                  </div>
                </div>
                {d.top_products.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Unidades</th>
                          <th className="numeric">Importe</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.top_products.map((p) => (
                          <tr key={p.product_id}>
                            <td>{p.name}</td>
                            <td>{p.quantity}</td>
                            <td className="amount">{money(p.total_cents)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty title="Sin ventas en este período" />
                )}
              </section>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2>Detalle diario</h2>
                    <p>La misma información incluida en el CSV</p>
                  </div>
                </div>
                <div className="table-wrap daily-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Ventas</th>
                        <th className="numeric">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.series.map((s) => (
                        <tr key={s.day}>
                          <td>{date(s.day)}</td>
                          <td>{s.count}</td>
                          <td className="amount">{money(s.total_cents)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <div className="info-note">
              <BarChart3 size={17} /> Los importes representan ventas, no
              ganancias. No se incluyen costos ni resultados de rentabilidad.
            </div>
          </>
        )
      )}
    </>
  );
}
function Team({ notify }: { notify: (s: string) => void }) {
  const { data, loading, error, refresh } = useResource<User[]>("users");
  const [edit, setEdit] = useState<User | null | undefined>(undefined);
  return (
    <>
      <PageTitle
        eyebrow="Permisos de operación"
        title="Equipo y accesos"
        description="Administra los accesos y responsabilidades de Nova Salud."
        action={
          <button className="button primary" onClick={() => setEdit(null)}>
            <Plus size={18} /> Nuevo usuario
          </button>
        }
      />
      <section className="panel team-register">
        <div className="panel-header">
          <div><h2>Personal de la botica</h2><p>Roles, estado y acceso al sistema.</p></div>
          {data && !loading && !error && <span className="record-count">{data.filter((member) => member.active).length} con acceso activo</span>}
        </div>
        {error ? (
          <ErrorBox message={error} retry={refresh} />
        ) : loading ? (
          <Loading />
        ) : data?.length ? (
          <div className="table-wrap">
            <table className="mobile-records" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader">Integrante</th>
                  <th role="columnheader">Correo</th>
                  <th role="columnheader">Rol</th>
                  <th role="columnheader">Estado</th>
                  <th role="columnheader" />
                </tr>
              </thead>
              <tbody role="rowgroup">
                {data?.map((u) => (
                  <tr role="row" key={u.id}>
                    <td role="cell" data-column="primary">
                      <div className="team-name">
                        <span className="avatar">{u.name.slice(0, 1)}</span>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td role="cell" data-column="wide" data-label="Correo">{u.email}</td>
                    <td role="cell" data-column="label" data-label="Rol">
                      <span className="category-tag">
                        {u.role === "admin" ? "Administrador" : "Vendedor"}
                      </span>
                    </td>
                    <td role="cell" data-column="label" data-label="Estado">
                      <Status tone={u.active ? "teal" : "neutral"}>
                        {u.active ? "Activo" : "Inactivo"}
                      </Status>
                    </td>
                    <td role="cell" data-column="actions">
                      <button
                        className="text-button"
                        onClick={() => setEdit(u)}
                      >
                        Editar acceso
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty title="No hay integrantes registrados" />}
      </section>
      <div className="permission-grid">
        <div>
          <ShieldCheck size={24} />
          <h3>Administrador</h3>
          <p>
            Gestiona productos, entradas, ajustes, usuarios y anulaciones.
            Consulta reportes y trazabilidad.
          </p>
        </div>
        <div>
          <ShoppingCart size={24} />
          <h3>Vendedor</h3>
          <p>
            Consulta productos y lotes, registra ventas y revisa sus propias
            operaciones.
          </p>
        </div>
      </div>
      {edit !== undefined && (
        <Modal
          title={edit ? "Editar acceso" : "Nuevo integrante"}
          subtitle="Los permisos se aplican también en el servidor."
          onClose={() => setEdit(undefined)}
        >
          <Form
            onCancel={() => setEdit(undefined)}
            submit={async (f) => {
              const d: Record<string, unknown> = {
                ...Object.fromEntries(f),
                active: f.get("active") === "true",
              };
              if (!d.password) delete d.password;
              await api(
                "users" + (edit ? "/" + edit.id : ""),
                edit ? "PUT" : "POST",
                d,
              );
              setEdit(undefined);
              refresh();
              notify("Acceso guardado correctamente.");
            }}
          >
            {(errors) => (
              <>
                <Field label="Nombre" error={errors.name} full>
                  <input
                    name="name"
                    required
                    maxLength={100}
                    defaultValue={edit?.name}
                  />
                </Field>
                <Field label="Correo electrónico" error={errors.email} full>
                  <input
                    name="email"
                    type="email"
                    maxLength={255}
                    required
                    defaultValue={edit?.email}
                  />
                </Field>
                <Field
                  label={
                    edit
                      ? "Nueva contraseña (opcional)"
                      : "Contraseña · mínimo 12 caracteres"
                  }
                  error={errors.password}
                  full
                >
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    maxLength={128}
                    required={!edit}
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Rol" error={errors.role}>
                  <select name="role" defaultValue={edit?.role || "seller"}>
                    <option value="seller">Vendedor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </Field>
                <Field label="Estado" error={errors.active}>
                  <select
                    name="active"
                    defaultValue={String(edit?.active ?? true)}
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </Field>
              </>
            )}
          </Form>
        </Modal>
      )}
    </>
  );
}
function Help({ admin, navigate }: { admin: boolean; navigate: (view: View) => void }) {
  return (
    <>
      <PageTitle
        eyebrow="Manual del mostrador"
        title="Guía de uso"
        description="Sigue el recorrido de un producto, desde el ingreso del lote hasta su venta."
      />
      <div className="help-grid">
        {[
          {
            n: "01",
            view: "inventory" as const,
            icon: Package,
            title: "Prepara el inventario",
            text: admin
              ? "En Inventario, crea productos y registra entradas con código de lote, vencimiento, cantidad y motivo."
              : "En Inventario, busca un producto y consulta sus existencias disponibles y lotes.",
          },
          {
            n: "02",
            view: "pos" as const,
            icon: ShoppingCart,
            title: "Registra una venta",
            text: "Busca productos en Punto de venta, agrégalos al carrito, ajusta cantidades y selecciona el método de pago. Revisa y confirma.",
          },
          {
            n: "03",
            view: "sales" as const,
            icon: ReceiptText,
            title: "Consulta el detalle",
            text: "En Ventas puedes revisar tus operaciones e imprimir un comprobante interno. El detalle conserva los precios originales.",
          },
          {
            n: "04",
            view: admin ? ("alerts" as const) : ("pos" as const),
            icon: ShieldCheck,
            title: "Mantén el control",
            text: admin
              ? "Consulta alertas y reportes. Si anulas una venta, registra el motivo; el stock se devuelve una sola vez."
              : "Las existencias se verifican al confirmar. Si otro vendedor usa las últimas unidades, recibirás un mensaje para revisar el carrito.",
          },
        ].map((c) => (
          <section className="panel help-card" key={c.n}>
            <div>
              <c.icon size={26} />
              <span>{c.n}</span>
            </div>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <button type="button" className="text-button" onClick={() => navigate(c.view)}>
              Ir a {labels[c.view].toLowerCase()} <ArrowRight size={16} />
            </button>
          </section>
        ))}
      </div>
      <div className="help-notes">
        <h2>Detalles que conviene conocer</h2>
        <p>
          <RefreshCw size={18} /> Las vistas consultan cambios cada 30 segundos
          y al volver a la ventana. Puedes actualizarlas antes con el botón de
          actualización.
        </p>
        <p>
          <Clock3 size={18} /> Se priorizan los lotes vigentes con vencimiento
          más cercano. Un lote vencido no se vende.
        </p>
        <p>
          <FileText size={18} /> Los comprobantes son internos y no tienen
          autorización electrónica de SUNAT.
        </p>
        <p>
          <Users size={18} /> Los datos iniciales y las cuentas marcadas como
          Demo son ficticios para la presentación académica.
        </p>
      </div>
    </>
  );
}
