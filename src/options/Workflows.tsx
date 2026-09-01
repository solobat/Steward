import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type { Workflow } from "@/types/workflow";
import { request } from "@/lib/portBridge";
import WorkflowEditor from "./WorkflowEditor";

const EMPTY: Workflow = {
  id: "",
  title: "",
  desc: "",
  content: "",
};

const WORKFLOWS_KEY = "workflows";

function loadWorkflows(): Promise<Workflow[]> {
  return request<Workflow[]>({ action: "getWorkflows" }).then((r) => (Array.isArray(r) ? r : []));
}

export default function Workflows() {
  const [list, setList] = useState<Workflow[]>([]);
  const [current, setCurrent] = useState<Workflow>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = () => {
    loadWorkflows().then((arr) => {
      if (Array.isArray(arr)) setList(arr);
    });
  };

  useEffect(() => {
    load();
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "sync" && changes[WORKFLOWS_KEY]) {
        const next = changes[WORKFLOWS_KEY].newValue;
        if (Array.isArray(next)) setList(next);
        else load();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const filtered = search.trim()
    ? list.filter((w) => w.title.toLowerCase().includes(search.trim().toLowerCase()))
    : list;

  const select = (w: Workflow) => setCurrent({ ...w });
  const clearCurrent = () => setCurrent(EMPTY);

  const saveCurrent = () => {
    if (!current.title.trim() || !current.content.trim()) return;
    setError(null);
    if (current.id) {
      request<{ list?: Workflow[]; workflow?: Workflow }>({ action: "updateWorkflow", data: current })
        .then((data) => {
          setSaved(true);
          const hasList = data?.list && Array.isArray(data.list) && data.list.length > 0;
          const hasWorkflow = data?.workflow && typeof data.workflow.id === "string";
          if (hasList) {
            setList(data.list!);
            if (data.workflow) setCurrent(data.workflow);
          } else if (hasWorkflow) {
            setList((prev) => prev.map((w) => (w.id === data!.workflow!.id ? data!.workflow! : w)));
            setCurrent(data!.workflow!);
          }
          setTimeout(() => {
            load();
            setSaved(false);
          }, 400);
        })
        .catch((err) => {
          console.error("updateWorkflow failed", err);
          setError(t("workflows_save_failed"));
        });
    } else {
      request<{ list?: Workflow[]; workflow?: Workflow }>({ action: "createWorkflow", data: current })
        .then((data) => {
          setSaved(true);
          const hasList = data?.list && Array.isArray(data.list) && data.list.length > 0;
          const hasWorkflow = data?.workflow && typeof data.workflow.id === "string";
          if (hasList) {
            setList(data.list!);
            setCurrent(data.workflow ?? data.list![data.list!.length - 1] ?? current);
          } else if (hasWorkflow) {
            setList((prev) => [...prev, data!.workflow!]);
            setCurrent(data!.workflow!);
          }
          setTimeout(() => {
            load();
            setSaved(false);
          }, 400);
        })
        .catch((err) => {
          console.error("createWorkflow failed", err);
          setError(t("workflows_save_failed_storage"));
        });
    }
  };

  const deleteCurrent = () => {
    if (!current.id) return;
    if (!confirm(t("workflows_confirm_delete", current.title))) return;
    const deletedId = current.id;
    clearCurrent();
    request({ action: "removeWorkflow", data: deletedId })
      .then(() => {
        load();
        setTimeout(load, 150);
      })
      .catch(() => {
        load();
      });
  };

  const createNew = () => {
    setCurrent({
      ...EMPTY,
      title: t("workflows_new"),
      desc: "",
      content: "",
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="options-section-title">{t("workflows_title")}</h2>
      <p className="text-sm text-base-content/70 max-w-xl">
        {t("workflows_hint")}
      </p>
      <div className="flex gap-4 flex-col lg:flex-row">
        <div className="w-full lg:w-56 xl:w-64 shrink-0 space-y-2">
          <input
            type="text"
            placeholder={t("workflows_search_placeholder")}
            className="input input-bordered input-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="menu bg-base-200 rounded-lg max-h-48 sm:max-h-64 lg:max-h-[min(24rem,60vh)] overflow-auto">
            {filtered.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  className={current.id === w.id ? "active" : ""}
                  onClick={() => select(w)}
                >
                  {w.title}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-sm btn-outline w-full" onClick={createNew}>
            {t("workflows_new_btn")}
          </button>
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          {current && (current.id || current.title) ? (
            <>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("workflows_label_title")}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={current.title}
                  onChange={(e) => setCurrent((c) => ({ ...c, title: e.target.value }))}
                  placeholder={t("workflows_placeholder_title")}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("workflows_label_desc")}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={current.desc ?? ""}
                  onChange={(e) => setCurrent((c) => ({ ...c, desc: e.target.value }))}
                  placeholder={t("workflows_placeholder_desc")}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("workflows_label_content")}</span>
                </label>
                <WorkflowEditor
                  content={current.content}
                  onChange={(content) => setCurrent((c) => ({ ...c, content }))}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" className="btn btn-primary" onClick={saveCurrent}>
                  {t("btn_save")}
                </button>
                {current.id && (
                  <button type="button" className="btn btn-ghost btn-sm text-error" onClick={deleteCurrent}>
                    {t("btn_delete")}
                  </button>
                )}
                {saved && <span className="text-sm text-success">{t("saved_hint")}</span>}
                {error && <span className="text-sm text-error">{error}</span>}
              </div>
            </>
          ) : (
            <p className="text-base-content/60 text-sm">{t("workflows_select_hint")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
