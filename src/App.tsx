import {
  lazy,
  Suspense,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Info,
  Layers3,
  Maximize2,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Search,
  Wind,
  X,
} from "lucide-react";
import {
  ancestors,
  byId,
  children,
  leafIds,
  leaves,
  nodes,
  type AnatomyNode,
} from "./anatomy";
import { initialState, reducer, type PickMode } from "./state";
import type { CameraCommand } from "./Scene";
import ViewMenu from "./ViewMenu";
const Scene = lazy(() => import("./Scene"));
const tour = [
  {
    title: "Meet the lungs",
    text: "Two lungs, five lobes. The model faces you: patient right is on your left.",
    id: "lungs",
    opacity: 1,
  },
  {
    title: "Find a lobe",
    text: "The right upper lobe contains three available segment surfaces. Expand its name in the anatomy list to explore them.",
    id: "FMA7333",
    opacity: 1,
  },
  {
    title: "Look at one segment",
    text: "The apical segment is one source-defined region. Isolation makes its actual tissue boundary visible.",
    id: "FMA7338",
    opacity: 1,
    isolate: true,
  },
  {
    title: "Look beneath the surface",
    text: "Faded tissue reveals the airway tree. Scene clicks now select airways. Select a lobe in the panel to return to surface selection.",
    id: "airways",
    opacity: 0.12,
  },
];
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [about, setAbout] = useState(false);
  const [freeOrbit, setFreeOrbit] = useState(false);
  const [pointerFocused, setPointerFocused] = useState(false);
  const [command, setCommand] = useState<CameraCommand>({
    key: 0,
    direction: "left",
  });
  const panel = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const panelToggle = useRef<HTMLButtonElement>(null);
  const aboutTrigger = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!sidebarOpen) return;
    panel.current?.focus({ preventScroll: true });
    if (window.matchMedia("(max-width: 760px)").matches)
      panel.current?.scrollIntoView({ block: "start" });
  }, [sidebarOpen]);
  const selected = byId[state.selected];
  const visibleCount = leaves.filter(
    (n) => !state.hidden.includes(n.id),
  ).length;
  const allSelectedHidden = leafIds(state.selected).every((id) =>
    state.hidden.includes(id),
  );
  const nothingVisible = leaves.every(
    (n) =>
      state.hidden.includes(n.id) ||
      (n.kind === "segment" && state.opacity === 0),
  );
  function openAbout() {
    aboutTrigger.current = document.activeElement as HTMLElement;
    setAbout(true);
  }
  function closeAbout() {
    setAbout(false);
    requestAnimationFrame(() => aboutTrigger.current?.focus());
  }
  function closePanel(returnToScene = false) {
    setSidebarOpen(false);
    requestAnimationFrame(() => {
      (returnToScene ? stage.current : panelToggle.current)?.focus({
        preventScroll: true,
      });
      if (window.matchMedia("(max-width: 760px)").matches)
        window.scrollTo({ top: 0 });
    });
  }
  function select(id: string) {
    dispatch({ type: "select", id });
    setExpanded((v) => [
      ...new Set([...v, ...ancestors(id).map((n) => n.id), id]),
    ]);
  }
  function reset() {
    dispatch({ type: "reset" });
    setQuery("");
    setTourStep(null);
    setFreeOrbit(false);
    setExpanded([]);
  }
  function step(index: number) {
    setTourStep(index);
    setQuery("");
    const stop = tour[index];
    dispatch({ type: "reset" });
    select(stop.id);
    dispatch({ type: "opacity", value: stop.opacity });
    if (stop.isolate) dispatch({ type: "isolate" });
    setFreeOrbit(false);
  }
  function reveal() {
    if (state.opacity < 1) {
      select("lungs");
      dispatch({ type: "opacity", value: 1 });
    } else {
      dispatch({ type: "restore" });
      select("airways");
      dispatch({ type: "opacity", value: 0.12 });
    }
  }
  function row(n: AnatomyNode, depth = 0) {
    const kids = children(n.id);
    const open = expanded.includes(n.id);
    const hidden = leafIds(n.id).every((id) => state.hidden.includes(id));
    return (
      <li key={n.id}>
        <div
          className={`anatomy-row ${state.selected === n.id ? "selected" : ""} ${hidden ? "is-hidden" : ""}`}
          style={
            { "--depth": depth, "--structure-color": n.color } as CSSProperties
          }
        >
          {kids.length ? (
            <button
              className="expand"
              aria-label={`${open ? "Collapse" : "Expand"} ${n.name}`}
              aria-expanded={open}
              onClick={() =>
                setExpanded((v) =>
                  v.includes(n.id) ? v.filter((x) => x !== n.id) : [...v, n.id],
                )
              }
            >
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
          ) : (
            <span className="tree-indent" />
          )}
          <button
            className="anatomy-select"
            aria-label={`Select ${n.name}`}
            aria-pressed={state.selected === n.id}
            onClick={() => select(n.id)}
          >
            <span className="color-dot" />
            <span>{n.short}</span>
            {hidden ? (
              <EyeOff size={12} />
            ) : kids.length ? (
              <span className="count-tag">{kids.length}</span>
            ) : null}
          </button>
        </div>
        {open && kids.length > 0 && (
          <ul>{kids.map((c) => row(c, depth + 1))}</ul>
        )}
      </li>
    );
  }
  const matches = query.trim()
    ? nodes.filter((n) =>
        `${n.name} ${n.id} ${n.tissue ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      )
    : [];
  return (
    <>
      <div className="app-shell" inert={about || undefined}>
        <button className="skip-link" onClick={() => setSidebarOpen(true)}>
          Skip to anatomy controls
        </button>
        <header className="site-header">
          <a
            href="https://github.com/organui"
            className="brand"
            aria-label="OrganUI on GitHub"
          >
            <Activity size={21} strokeWidth={1.6} className="brand-icon" />
            <span>
              Organ<span className="brand-light">UI</span>
            </span>
            <span className="brand-slash">/</span>
            <h1 className="brand-product">Lungs</h1>
          </a>
          <nav aria-label="Explorer">
            <button
              className="text-button about-button"
              onClick={openAbout}
              aria-label="About this model"
            >
              <Info size={15} />
              <span>About this model</span>
            </button>
            <button
              className="sidebar-toggle"
              ref={panelToggle}
              aria-expanded={sidebarOpen}
              aria-controls="anatomy"
              onClick={() =>
                sidebarOpen ? closePanel() : setSidebarOpen(true)
              }
            >
              {sidebarOpen ? (
                <PanelRightClose size={16} />
              ) : (
                <PanelRightOpen size={16} />
              )}{" "}
              Anatomy
            </button>
          </nav>
        </header>
        <main className={`explorer ${sidebarOpen ? "sidebar-open" : ""}`}>
          <section className="stage" aria-label="3D lung explorer">
            <div
              className="canvas-wrap"
              data-pointer-focused={pointerFocused || undefined}
              ref={stage}
              tabIndex={0}
              role="group"
              aria-label="Interactive lung model"
              aria-describedby="camera-help"
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                setPointerFocused(false);
                const directions = {
                  ArrowLeft: "left",
                  ArrowRight: "right",
                  ArrowUp: "up",
                  ArrowDown: "down",
                } as const;
                if (e.key in directions) {
                  e.preventDefault();
                  setCommand((c) => ({
                    key: c.key + 1,
                    direction: directions[e.key as keyof typeof directions],
                  }));
                } else if (["+", "=", "-"].includes(e.key)) {
                  e.preventDefault();
                  dispatch({
                    type: "zoom",
                    value: e.key === "-" ? 0.85 : 1.18,
                  });
                } else if (e.key === "Home") {
                  e.preventDefault();
                  reset();
                }
              }}
              onPointerDown={(e) => {
                if (e.target instanceof HTMLCanvasElement) {
                  setPointerFocused(true);
                  e.currentTarget.focus({ preventScroll: true });
                }
              }}
              onBlur={() => setPointerFocused(false)}
            >
              <Suspense
                fallback={
                  <div className="scene-message" role="status">
                    Preparing the 3D viewer…
                  </div>
                }
              >
                <Scene
                  state={state}
                  onSelect={select}
                  command={command}
                  onOrbit={() => setFreeOrbit(true)}
                />
              </Suspense>
            </div>
            <div className="scene-status" role="status">
              <span className="status-dot" />
              {state.hidden.length ? (
                <>
                  {visibleCount} of {leaves.length} groups visible{" "}
                  <button onClick={() => dispatch({ type: "restore" })}>
                    Restore all
                  </button>
                </>
              ) : (
                "5 lobes · 17 segment groups"
              )}
            </div>
            {state.selected !== "lungs" && (
              <div className="selection-chip">
                <span
                  className="color-dot"
                  style={{ background: selected.color }}
                />
                <button
                  className="selection-name"
                  onClick={() => setSidebarOpen(true)}
                >
                  {selected.name}
                </button>
                <Check size={12} />
                <button
                  aria-label="Clear selection"
                  onClick={() => select("lungs")}
                >
                  <X size={13} />
                </button>
              </div>
            )}
            {nothingVisible && (
              <div className="empty-scene">
                <p>All structures are hidden.</p>
                <button className="button" onClick={reset}>
                  Reset view
                </button>
              </div>
            )}
            <div className="stage-bottom">
              <div className="camera-toolbar" aria-label="Camera controls">
                <ViewMenu
                  view={freeOrbit ? "Custom view" : state.view}
                  disabled={false}
                  onChange={(value) => {
                    dispatch({ type: "view", value });
                    setFreeOrbit(false);
                  }}
                />
                <div className="camera-actions">
                  <button
                    className="icon-button"
                    aria-label="Zoom out"
                    title="Zoom out"
                    disabled={state.zoom <= 0.65}
                    onClick={() => dispatch({ type: "zoom", value: 0.85 })}
                  >
                    <Minus size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Zoom in"
                    title="Zoom in"
                    disabled={state.zoom >= 2.4}
                    onClick={() => dispatch({ type: "zoom", value: 1.18 })}
                  >
                    <Plus size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={
                      state.opacity < 1
                        ? "Show lung surfaces"
                        : "Reveal airways"
                    }
                    title={
                      state.opacity < 1
                        ? "Show lung surfaces"
                        : "Reveal airways"
                    }
                    aria-pressed={state.opacity < 1}
                    onClick={reveal}
                  >
                    <Wind size={17} />
                  </button>
                  <button
                    className="icon-button reset-button"
                    aria-label="Reset explorer"
                    title="Reset explorer"
                    onClick={reset}
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            </div>
            <p className="canvas-hint">
              Drag to rotate · Scroll to zoom ·{" "}
              {state.opacity < 1
                ? `Click ${state.pick}`
                : freeOrbit
                  ? "Free orbit"
                  : state.view === "Anterior"
                    ? "Patient right on your left"
                    : `${state.view} view`}
            </p>
            <p id="camera-help" className="sr-only">
              Arrow keys rotate. Plus and minus zoom. Home resets. Use Anatomy
              to explore structures with text and keyboard controls.
            </p>
          </section>
          <aside
            className="anatomy-panel"
            id="anatomy"
            ref={panel}
            tabIndex={-1}
            hidden={!sidebarOpen}
            aria-label="Anatomy controls"
            onKeyDown={(e) => {
              if (e.key === "Escape") closePanel();
            }}
          >
            <div className="panel-heading">
              <div>
                <h2>Anatomy</h2>
                <span className="count-tag">20 groups</span>
              </div>
              <button
                className="icon-button"
                aria-label="Close anatomy panel"
                onClick={() => closePanel()}
              >
                <X size={17} />
              </button>
            </div>
            <label className="search-wrap">
              <Search size={15} />
              <input
                type="search"
                aria-label="Search anatomy"
                placeholder="Search anatomy…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="structure-list">
              {query.trim() ? (
                <>
                  <p className="search-count" role="status">
                    {matches.length} matching structures
                  </p>
                  <ul className="search-results">
                    {matches.map((n) => (
                      <li key={n.id}>
                        <button
                          aria-label={`Select ${n.name}`}
                          aria-pressed={state.selected === n.id}
                          onClick={() => select(n.id)}
                        >
                          <span
                            className="color-dot"
                            style={{ background: n.color }}
                          />
                          <span>
                            {n.name}
                            <small>
                              {n.kind} · {n.id}
                            </small>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {matches.length === 0 && (
                    <p className="no-results">
                      No structures found. Try “upper”, “basal”, or “trachea”.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <button
                    className="all-lungs"
                    aria-pressed={state.selected === "lungs"}
                    onClick={() => select("lungs")}
                  >
                    <Layers3 size={14} />
                    Both lungs<span className="count-tag">5 lobes</span>
                  </button>
                  <ul className="anatomy-tree">
                    {row(byId.FMA7309)}
                    {row(byId.FMA7310)}
                  </ul>
                  <ul className="anatomy-tree airway-tree">
                    {row(byId.airways)}
                  </ul>
                </>
              )}
            </div>
            <section className="detail-card" aria-label="Selected structure">
              <div aria-live="polite">
                <nav className="breadcrumbs" aria-label="Selected anatomy path">
                  {ancestors(selected.id).map((n) => (
                    <span key={n.id}>
                      <button onClick={() => select(n.id)}>{n.short}</button>
                      <ChevronRight size={10} />
                    </span>
                  ))}
                </nav>
                <div className="detail-eyebrow">
                  <span className="eyebrow">
                    {selected.kind === "system" ? "Overview" : selected.kind}
                  </span>
                  <span>
                    {selected.id.startsWith("FMA")
                      ? selected.id
                      : "BodyParts3D"}
                  </span>
                </div>
                <h2>{selected.name}</h2>
                <p className="description">{selected.description}</p>
              </div>
              <div className="detail-actions">
                <button
                  className="button primary"
                  disabled={allSelectedHidden}
                  onClick={() => dispatch({ type: "isolate" })}
                >
                  <Maximize2 size={13} />
                  Isolate
                </button>
                <button
                  className="button"
                  disabled={allSelectedHidden}
                  onClick={() => dispatch({ type: "hide" })}
                >
                  <EyeOff size={13} />
                  Hide
                </button>
                {state.hidden.length > 0 && (
                  <button
                    className="restore-detail"
                    onClick={() => dispatch({ type: "restore" })}
                  >
                    Restore all
                  </button>
                )}
              </div>
              {allSelectedHidden && (
                <button
                  className="text-button"
                  onClick={() => select(selected.id)}
                >
                  Show selected structure
                </button>
              )}
              <details className="model-note">
                <summary>Model notes & reference</summary>
                {selected.scope && <p>{selected.scope}</p>}
                <p>Colors distinguish structures; they are illustrative.</p>
                <a href={selected.source} target="_blank" rel="noreferrer">
                  {selected.source.includes("nhlbi")
                    ? "NHLBI · anatomy reference"
                    : "BodyParts3D · source anatomy"}
                  <ArrowUpRight size={12} />
                </a>
              </details>
            </section>
            <details className="display-controls">
              <summary>
                <Wind size={15} />
                Display & selection
                <ChevronDown size={13} />
              </summary>
              <div className="reveal">
                <label htmlFor="opacity">
                  Surface opacity{" "}
                  <output>{Math.round(state.opacity * 100)}%</output>
                </label>
                <input
                  id="opacity"
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(state.opacity * 100)}
                  onChange={(e) =>
                    dispatch({
                      type: "opacity",
                      value: Number(e.target.value) / 100,
                    })
                  }
                />
                <div className="range-labels">
                  <span>Airways</span>
                  <span>Surface</span>
                </div>
                <fieldset>
                  <legend>Scene clicks select</legend>
                  <div className="segmented">
                    {(["lobes", "segments", "airways"] as PickMode[]).map(
                      (value) => (
                        <button
                          key={value}
                          aria-pressed={state.pick === value}
                          onClick={() => dispatch({ type: "pick", value })}
                        >
                          {value}
                        </button>
                      ),
                    )}
                  </div>
                </fieldset>
                <p className="pick-help">
                  {state.pick === "airways"
                    ? "Clicks pass through lung tissue to the visible airway branches."
                    : state.pick === "lobes"
                      ? "Click a surface to select its whole lobe."
                      : "Click a surface to select its source-defined segment."}
                </p>
              </div>
            </details>
            {tourStep === null ? (
              <section className="tour-card" aria-label="Guided exploration">
                <span className="tour-icon">
                  <BookOpen size={18} strokeWidth={1.5} />
                </span>
                <div>
                  <h3>A closer look</h3>
                  <p>4 stops · at your own pace</p>
                </div>
                <button
                  className="tour-start"
                  aria-label="Start guided tour"
                  onClick={() => step(0)}
                >
                  <ArrowRight size={17} />
                </button>
              </section>
            ) : (
              <section
                className="tour-card tour-active"
                aria-label="Guided exploration"
              >
                <div className="tour-top">
                  <span className="eyebrow">
                    Guided tour · {tourStep + 1} / 4
                  </span>
                  <button
                    className="icon-button"
                    aria-label="Close guided tour"
                    onClick={() => setTourStep(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="tour-progress" aria-hidden="true">
                  {tour.map((stop, index) => (
                    <span
                      key={stop.id}
                      className={index <= tourStep ? "complete" : ""}
                    />
                  ))}
                </div>
                <div aria-live="polite">
                  <h3>{tour[tourStep].title}</h3>
                  <p>{tour[tourStep].text}</p>
                </div>
                <div className="tour-controls">
                  <button
                    className="text-button"
                    aria-label="Previous tour stop"
                    disabled={tourStep === 0}
                    onClick={() => step(tourStep - 1)}
                  >
                    <ArrowLeft size={13} />
                    Back
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      tourStep === tour.length - 1
                        ? reset()
                        : step(tourStep + 1)
                    }
                  >
                    {tourStep === tour.length - 1 ? "Finish tour" : "Next stop"}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </section>
            )}
            <p className="review-note">
              <span className="status-dot" />
              Educational demo · Content awaiting expert review
            </p>
            <button
              className="button mobile-return"
              onClick={() => closePanel(true)}
            >
              View in 3D
              <ArrowUpRight size={14} />
            </button>
          </aside>
        </main>
        <footer className="site-footer">
          <span>Educational model</span>
          <button onClick={openAbout}>
            BodyParts3D / DBCLS · Model credits
            <ArrowUpRight size={11} />
          </button>
        </footer>
      </div>
      {about && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAbout();
          }}
        >
          <About close={closeAbout} />
        </div>
      )}
    </>
  );
}
function About({ close }: { close: () => void }) {
  return (
    <div
      className="about"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
        if (e.key === "Tab") {
          const els = e.currentTarget.querySelectorAll<HTMLElement>("button,a");
          const first = els[0],
            last = els[els.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }}
    >
      <button
        className="close-about"
        aria-label="Close model scope"
        autoFocus
        onClick={close}
      >
        <X />
      </button>
      <span className="eyebrow">ABOUT THIS EXPLORER</span>
      <h2 id="about-title">A model, with context.</h2>
      <p>
        Both lungs and five lobes are assembled from 17 named tissue groups (18
        meshes) in BodyParts3D 4.3. Airways use the matching 2014 geometry set.
        Every visible boundary comes from that source.
      </p>
      <p>
        No distinct medial basal surface is supplied. Apicoposterior tissue on
        the left is one group. Some small branches end abruptly or do not
        exactly meet tissue boundaries. No alveoli, breathing, airflow, or
        disease simulation is included.
      </p>
      <p>
        Labels, mappings, and geometry have been inspected during development.
        Independent anatomical and clinical review is pending. This interface is
        not a diagnostic or surgical planning tool.
      </p>
      <h3>Model attribution</h3>
      <p>
        BodyParts3D / Anatomography, © The Database Center for Life Science
        (DBCLS). Model adaptation by OrganUI: selected geometry, reduced mesh
        density, shared coordinate transform, illustrative colors, and GLB
        conversion.
      </p>
      <p>
        These models and their rendered images use{" "}
        <a
          href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en"
          target="_blank"
          rel="noreferrer"
        >
          CC BY-SA 2.1 Japan
        </a>
        , as stated by the original download service. Application code is MIT
        licensed.
      </p>
      <a
        className="reference"
        href="https://github.com/organui/lungs-3d"
        target="_blank"
        rel="noreferrer"
      >
        Source, provenance, and review notes <ArrowUpRight size={14} />
      </a>
      <button className="button primary" onClick={close}>
        Back to exploring
      </button>
    </div>
  );
}
