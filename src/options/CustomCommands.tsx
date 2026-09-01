import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import type {
  AppConfig,
  BuiltinSourceKind,
  CustomCommand,
  CustomCommandAction,
  CustomCommandItem,
  CustomCommandResultTemplate,
  CustomCommandSource,
  CustomCommandVariable,
} from "@/types/config";
import { DEFAULT_CONFIG } from "@/types/config";
import { normalizeAppConfig } from "@/lib/configRuntime";
import { request } from "@/lib/portBridge";
import type { Workflow } from "@/types/workflow";

const defaultSource: CustomCommandSource = { type: "static", items: [] };
const defaultAction: CustomCommandAction = { type: "openUrl" };
const defaultResultTemplate: CustomCommandResultTemplate = {};

export default function CustomCommands() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [editing, setEditing] = useState<CustomCommand | null>(null);
  const [isNew, setIsNew] = useState(false);

  const list = config.customCommands?.list ?? [];

  useEffect(() => {
    request<Partial<AppConfig>>({ action: "getConfig" })
      .then((c) => setConfig(normalizeAppConfig(c ?? null)))
      .catch(() => setConfig(normalizeAppConfig(null)));
    request<Workflow[]>({ action: "getWorkflows" })
      .then((r) => setWorkflows(Array.isArray(r) ? r : []))
      .catch(() => setWorkflows([]));
  }, []);

  const setList = (next: CustomCommand[]) => {
    setConfig((prev) => ({
      ...prev,
      customCommands: { list: next },
    }));
    setSaved(false);
  };

  const add = () => {
    setIsNew(true);
    setEditing({
      id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      key: "",
      title: "",
      desc: "",
      variables: [],
      rememberLastQuery: false,
      resultTemplate: defaultResultTemplate,
      source: defaultSource,
      action: defaultAction,
    });
  };

  const edit = (c: CustomCommand) => {
    setIsNew(false);
    setEditing({
      ...c,
      variables: [...(c.variables ?? [])],
      resultTemplate: { ...(c.resultTemplate ?? {}) },
      source: c.source.type === "static"
        ? { ...c.source, items: c.source.items.map((item) => ({ ...item })) }
        : c.source.type === "url"
          ? { ...c.source, responseMap: { ...(c.source.responseMap ?? {}) } }
          : { ...c.source, params: { ...(c.source.params ?? {}) } },
      action: { ...c.action },
    });
  };

  const remove = (id: string) => {
    const newList = list.filter((x) => x.id !== id);
    setList(newList);
    if (editing?.id === id) setEditing(null);
    request({ action: "saveConfig", data: { ...config, customCommands: { list: newList } } })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  const save = () => {
    request({ action: "saveConfig", data: config })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  const applyEdit = (patch: Partial<CustomCommand>) => {
    if (!editing) return;
    setEditing({ ...editing, ...patch });
  };

  const submitEdit = () => {
    if (!editing || !editing.key.trim() || !editing.title.trim()) return;
    const newList = isNew ? [...list, editing] : list.map((x) => (x.id === editing.id ? editing : x));
    setConfig((prev) => ({ ...prev, customCommands: { list: newList } }));
    setEditing(null);
    setIsNew(false);
    request({ action: "saveConfig", data: { ...config, customCommands: { list: newList } } })
      .then(() => setSaved(true))
      .catch(() => {});
  };

  const cancelEdit = () => {
    setEditing(null);
    setIsNew(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="options-section-title">{t("custom_commands_title")}</h2>
      <p className="text-sm text-base-content/70">{t("custom_commands_hint")}</p>

      {editing ? (
        <CustomCommandForm
          cmd={editing}
          workflows={workflows}
          onChange={applyEdit}
          onSave={submitEdit}
          onCancel={cancelEdit}
          isNew={isNew}
        />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={add}>
              {t("custom_commands_add")}
            </button>
          </div>
          <ul className="space-y-2">
            {list.length === 0 ? (
              <li className="text-sm text-base-content/50">{t("custom_commands_empty")}</li>
            ) : (
              list.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-base-content/10 bg-base-200/50 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-primary font-medium">{c.key}</span>
                    <span className="mx-2 text-base-content/50">·</span>
                    <span className="text-base-content/90">{c.title}</span>
                    {c.desc && (
                      <p className="text-sm text-base-content/55 truncate mt-0.5">{c.desc}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" className="btn btn-ghost btn-xs" onClick={() => edit(c)}>
                      {t("btn_edit")}
                    </button>
                    <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => remove(c.id)}>
                      {t("btn_delete")}
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </>
      )}

      {!editing && (
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-primary" onClick={save}>
            {t("btn_save")}
          </button>
          {saved && <span className="text-sm text-success">{t("saved_hint")}</span>}
        </div>
      )}
    </div>
  );
}

function CustomCommandForm({
  cmd,
  workflows,
  onChange,
  onSave,
  onCancel,
  isNew,
}: {
  cmd: CustomCommand;
  workflows: Workflow[];
  onChange: (patch: Partial<CustomCommand>) => void;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const source = cmd.source;
  const action = cmd.action;

  return (
    <div className="rounded-lg border border-primary/20 bg-base-200/30 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label py-0">
            <span className="label-text">{t("custom_commands_key")}</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full font-mono"
            placeholder="e.g. my"
            value={cmd.key}
            onChange={(e) => onChange({ key: e.target.value.trim() || e.target.value })}
          />
        </div>
        <div>
          <label className="label py-0">
            <span className="label-text">{t("custom_commands_title_label")}</span>
          </label>
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={cmd.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="label py-0">
          <span className="label-text">{t("custom_commands_desc")}</span>
        </label>
        <input
          type="text"
          className="input input-bordered input-sm w-full"
          value={cmd.desc ?? ""}
          onChange={(e) => onChange({ desc: e.target.value || undefined })}
        />
      </div>

      <div className="rounded-lg border border-base-content/10 bg-base-200/30 p-3 space-y-3">
        <div>
          <span className="label-text font-medium">{t("custom_commands_templates_title")}</span>
          <p className="text-xs text-base-content/55 mt-1">{t("custom_commands_templates_hint")}</p>
        </div>

        <CommandVariablesEditor
          variables={cmd.variables ?? []}
          onChange={(variables) => onChange({ variables })}
        />

        <label className="label cursor-pointer justify-start gap-3 py-0">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={cmd.rememberLastQuery === true}
            onChange={(e) => onChange({ rememberLastQuery: e.target.checked })}
          />
          <div>
            <span className="label-text">{t("custom_commands_remember_last_query")}</span>
            <p className="text-xs text-base-content/55">{t("custom_commands_remember_last_query_hint")}</p>
          </div>
        </label>

        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            className="input input-bordered input-sm font-mono"
            placeholder={t("custom_commands_result_title_placeholder")}
            value={cmd.resultTemplate?.titleTemplate ?? ""}
            onChange={(e) =>
              onChange({
                resultTemplate: {
                  ...(cmd.resultTemplate ?? defaultResultTemplate),
                  titleTemplate: e.target.value || undefined,
                },
              })
            }
          />
          <span className="text-xs text-base-content/50">{t("custom_commands_result_title_hint")}</span>
          <input
            type="text"
            className="input input-bordered input-sm font-mono"
            placeholder={t("custom_commands_result_desc_placeholder")}
            value={cmd.resultTemplate?.descTemplate ?? ""}
            onChange={(e) =>
              onChange({
                resultTemplate: {
                  ...(cmd.resultTemplate ?? defaultResultTemplate),
                  descTemplate: e.target.value || undefined,
                },
              })
            }
          />
          <span className="text-xs text-base-content/50">{t("custom_commands_result_desc_hint")}</span>
          <input
            type="text"
            className="input input-bordered input-sm font-mono"
            placeholder={t("custom_commands_result_url_placeholder")}
            value={cmd.resultTemplate?.urlTemplate ?? ""}
            onChange={(e) =>
              onChange({
                resultTemplate: {
                  ...(cmd.resultTemplate ?? defaultResultTemplate),
                  urlTemplate: e.target.value || undefined,
                },
              })
            }
          />
          <span className="text-xs text-base-content/50">{t("custom_commands_result_url_hint")}</span>
        </div>
      </div>

      <div>
        <label className="label py-0">
          <span className="label-text">{t("custom_commands_source")}</span>
        </label>
        <select
          className="select select-bordered select-sm w-full max-w-xs"
          value={source.type}
          onChange={(e) => {
            const type = e.target.value as "static" | "url" | "builtin";
            if (type === "url") onChange({ source: { type: "url", urlTemplate: "https://api.example.com?q={query}" } });
            else if (type === "builtin") onChange({ source: { type: "builtin", builtin: "tabs" } });
            else onChange({ source: { type: "static", items: [] } });
          }}
        >
          <option value="static">{t("custom_commands_source_static")}</option>
          <option value="url">{t("custom_commands_source_url")}</option>
          <option value="builtin">{t("custom_commands_source_builtin")}</option>
        </select>
        {source.type === "builtin" && (
          <div className="mt-2 space-y-2">
            <select
              className="select select-bordered select-sm w-full max-w-xs"
              value={source.builtin ?? "tabs"}
              onChange={(e) => onChange({ source: { ...source, type: "builtin", builtin: e.target.value as BuiltinSourceKind } })}
            >
              <option value="tabs">{t("custom_commands_builtin_tabs")}</option>
              <option value="history">{t("custom_commands_builtin_history")}</option>
              <option value="bookmarks_recent">{t("custom_commands_builtin_bookmarks_recent")}</option>
              <option value="bookmarks_folder">{t("custom_commands_builtin_bookmarks_folder")}</option>
              <option value="topSites">{t("custom_commands_builtin_topSites")}</option>
              <option value="downloads">{t("custom_commands_builtin_downloads")}</option>
              <option value="extensions">{t("custom_commands_builtin_extensions")}</option>
            </select>
            {source.builtin === "bookmarks_folder" && (
              <input
                type="text"
                className="input input-bordered input-sm w-full max-w-xs font-mono"
                placeholder="1 / 2"
                value={source.params?.folderId ?? ""}
                onChange={(e) => onChange({ source: { ...source, type: "builtin", params: { ...source.params, folderId: e.target.value || undefined } } })}
              />
            )}
            {source.builtin === "downloads" && (
              <input
                type="number"
                className="input input-bordered input-sm w-24"
                placeholder="30"
                min={1}
                max={100}
                value={source.params?.limit ?? ""}
                onChange={(e) => onChange({ source: { ...source, type: "builtin", params: { ...source.params, limit: e.target.value ? Number(e.target.value) : undefined } } })}
              />
            )}
            {source.builtin === "extensions" && (
              <label className="label cursor-pointer gap-2 py-0">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={source.params?.enabled ?? false}
                  onChange={(e) => onChange({ source: { ...source, type: "builtin", params: { ...source.params, enabled: e.target.checked ? true : undefined } } })}
                />
                <span className="label-text text-sm">{t("custom_commands_builtin_extensions_enabled_only")}</span>
              </label>
            )}
          </div>
        )}
        {source.type === "url" && (
          <>
            <input
              type="text"
              className="input input-bordered input-sm w-full mt-2 font-mono text-sm"
              placeholder="https://...?q={query}"
              value={source.urlTemplate}
              onChange={(e) => onChange({ source: { ...source, type: "url", urlTemplate: e.target.value } })}
            />
            <div className="mt-2 p-2 bg-base-300/40 rounded text-sm">
              <span className="label-text text-base-content/70">{t("custom_commands_response_map")}</span>
              <p className="text-xs text-base-content/50 mt-0.5">{t("custom_commands_response_map_hint")}</p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <input
                  type="text"
                  className="input input-bordered input-sm font-mono"
                  placeholder={t("custom_commands_array_path")}
                  value={source.responseMap?.arrayPath ?? ""}
                  onChange={(e) => onChange({ source: { ...source, type: "url", responseMap: { ...source.responseMap, arrayPath: e.target.value || undefined } } })}
                />
                <span className="text-xs text-base-content/50">{t("custom_commands_array_path_placeholder")}</span>
                <input
                  type="text"
                  className="input input-bordered input-sm font-mono"
                  placeholder="{title}"
                  value={source.responseMap?.titleTemplate ?? ""}
                  onChange={(e) => onChange({ source: { ...source, type: "url", responseMap: { ...source.responseMap, titleTemplate: e.target.value || undefined } } })}
                />
                <span className="text-xs text-base-content/50">{t("custom_commands_title_template_hint")}</span>
                <input
                  type="text"
                  className="input input-bordered input-sm font-mono"
                  placeholder="{desc}"
                  value={source.responseMap?.descTemplate ?? ""}
                  onChange={(e) => onChange({ source: { ...source, type: "url", responseMap: { ...source.responseMap, descTemplate: e.target.value || undefined } } })}
                />
                <span className="text-xs text-base-content/50">{t("custom_commands_desc_template_hint")}</span>
                <input
                  type="text"
                  className="input input-bordered input-sm font-mono"
                  placeholder="{url}"
                  value={source.responseMap?.urlTemplate ?? ""}
                  onChange={(e) => onChange({ source: { ...source, type: "url", responseMap: { ...source.responseMap, urlTemplate: e.target.value || undefined } } })}
                />
                <span className="text-xs text-base-content/50">{t("custom_commands_url_template_hint")}</span>
              </div>
            </div>
          </>
        )}
        {source.type === "static" && (
          <StaticItemsEditor
            items={source.items}
            onChange={(items) => onChange({ source: { type: "static", items } })}
          />
        )}
      </div>

      <div>
        <label className="label py-0">
          <span className="label-text">{t("custom_commands_action")}</span>
        </label>
        <select
          className="select select-bordered select-sm w-full max-w-xs"
          value={action.type}
          onChange={(e) => {
            const type = e.target.value as "openUrl" | "copy" | "workflow";
            if (type === "openUrl") onChange({ action: { type: "openUrl" } });
            else if (type === "copy") onChange({ action: { type: "copy" } });
            else onChange({ action: { type: "workflow", workflowId: workflows[0]?.id ?? "" } });
          }}
        >
          <option value="openUrl">{t("custom_commands_action_open_url")}</option>
          <option value="copy">{t("custom_commands_action_copy")}</option>
          <option value="workflow">{t("custom_commands_action_workflow")}</option>
        </select>
        {action.type === "openUrl" && (
          <>
            <input
              type="text"
              className="input input-bordered input-sm w-full mt-2 font-mono text-sm"
              placeholder="{url} or https://...?q={query}&title={title}"
              value={action.urlTemplate ?? ""}
              onChange={(e) => onChange({ action: { type: "openUrl", urlTemplate: e.target.value || undefined } })}
            />
            <p className="text-xs text-base-content/50 mt-1">{t("custom_commands_action_template_hint")}</p>
          </>
        )}
        {action.type === "copy" && (
          <>
            <input
              type="text"
              className="input input-bordered input-sm w-full mt-2 font-mono text-sm"
              placeholder="{title} or custom text"
              value={action.template ?? ""}
              onChange={(e) => onChange({ action: { type: "copy", template: e.target.value || undefined } })}
            />
            <p className="text-xs text-base-content/50 mt-1">{t("custom_commands_action_template_hint")}</p>
          </>
        )}
        {action.type === "workflow" && (
          <select
            className="select select-bordered select-sm w-full mt-2 max-w-xs"
            value={action.workflowId}
            onChange={(e) => onChange({ action: { type: "workflow", workflowId: e.target.value } })}
          >
            {workflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title || w.id}
              </option>
            ))}
            {workflows.length === 0 && <option value="">—</option>}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={onSave}>
          {isNew ? t("custom_commands_add") : t("btn_save")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          {t("btn_cancel")}
        </button>
      </div>
    </div>
  );
}

function StaticItemsEditor({
  items,
  onChange,
}: {
  items: CustomCommandItem[];
  onChange: (items: CustomCommandItem[]) => void;
}) {
  const add = () => {
    onChange([...items, { title: "", desc: "", url: "" }]);
  };
  const update = (index: number, patch: Partial<CustomCommandItem>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-base-content/60">{t("custom_commands_static_items")}</span>
        <button type="button" className="btn btn-ghost btn-xs" onClick={add}>
          + {t("custom_commands_add_item")}
        </button>
      </div>
      <ul className="space-y-2 max-h-48 overflow-auto">
        {items.map((it, i) => (
          <li key={i} className="flex flex-wrap gap-2 items-start p-2 bg-base-300/50 rounded">
            <input
              type="text"
              className="input input-bordered input-sm flex-1 min-w-[120px]"
              placeholder={t("custom_commands_item_title")}
              value={it.title}
              onChange={(e) => update(i, { title: e.target.value })}
            />
            <input
              type="text"
              className="input input-bordered input-sm flex-1 min-w-[100px]"
              placeholder={t("custom_commands_item_desc")}
              value={it.desc ?? ""}
              onChange={(e) => update(i, { desc: e.target.value || undefined })}
            />
            <input
              type="text"
              className="input input-bordered input-sm flex-1 min-w-[120px] font-mono text-xs"
              placeholder="URL"
              value={it.url ?? ""}
              onChange={(e) => update(i, { url: e.target.value || undefined })}
            />
            <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => remove(i)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommandVariablesEditor({
  variables,
  onChange,
}: {
  variables: CustomCommandVariable[];
  onChange: (variables: CustomCommandVariable[]) => void;
}) {
  const add = () => onChange([...variables, { key: "", value: "" }]);
  const update = (index: number, patch: Partial<CustomCommandVariable>) => {
    onChange(variables.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };
  const remove = (index: number) => onChange(variables.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-base-content/60">{t("custom_commands_variables_title")}</span>
        <button type="button" className="btn btn-ghost btn-xs" onClick={add}>
          + {t("custom_commands_add_item")}
        </button>
      </div>
      <p className="text-xs text-base-content/50">{t("custom_commands_variables_hint")}</p>
      {variables.length > 0 && (
        <ul className="space-y-2">
          {variables.map((item, index) => (
            <li key={index} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                className="input input-bordered input-sm w-36 font-mono"
                placeholder={t("custom_commands_variable_key")}
                value={item.key}
                onChange={(e) => update(index, { key: e.target.value })}
              />
              <input
                type="text"
                className="input input-bordered input-sm flex-1 min-w-[160px] font-mono"
                placeholder={t("custom_commands_variable_value")}
                value={item.value}
                onChange={(e) => update(index, { value: e.target.value })}
              />
              <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => remove(index)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
