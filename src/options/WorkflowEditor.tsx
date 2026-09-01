import { useState } from "react";
import { t } from "@/lib/i18n";
import {
  COMMAND_KEYS,
  parseWorkflowSteps,
  stepsToContent,
  type VisualStep,
} from "@/lib/workflowSteps";

const STEP_KINDS: { kind: VisualStep["kind"]; labelKey: string }[] = [
  { kind: "command", labelKey: "wf_step_command" },
  { kind: "wait", labelKey: "wf_step_wait" },
  { kind: "focus", labelKey: "wf_step_focus" },
  { kind: "repeat", labelKey: "wf_step_repeat" },
  { kind: "end", labelKey: "wf_step_end" },
  { kind: "set", labelKey: "wf_step_set" },
  { kind: "if", labelKey: "wf_step_if" },
  { kind: "copy", labelKey: "wf_step_copy" },
  { kind: "note", labelKey: "wf_step_note" },
  { kind: "raw", labelKey: "wf_step_raw" },
];

const IF_OPS = ["==", "!=", "contains", ">", "<", "empty"];

function defaultStep(kind: VisualStep["kind"]): VisualStep {
  switch (kind) {
    case "command":
      return { kind: "command", command: "tab", filter: "", selection: "", shift: false, alt: false };
    case "wait":
      return { kind: "wait", value: "0.5" };
    case "focus":
      return { kind: "focus", index: "1" };
    case "repeat":
      return { kind: "repeat", count: "2" };
    case "end":
      return { kind: "end" };
    case "set":
      return { kind: "set", key: "name", value: "" };
    case "if":
      return { kind: "if", left: "{{clipboard}}", op: "contains", right: "" };
    case "copy":
      return { kind: "copy", text: "" };
    case "note":
      return { kind: "note", text: "" };
    case "raw":
      return { kind: "raw", text: "" };
  }
}

const KIND_BADGE: Record<VisualStep["kind"], string> = {
  command: "badge-primary",
  wait: "badge-info",
  focus: "badge-info",
  repeat: "badge-warning",
  end: "badge-neutral",
  set: "badge-success",
  if: "badge-warning",
  copy: "badge-secondary",
  note: "badge-secondary",
  raw: "badge-ghost",
};

const inputCls = "input input-bordered input-sm w-full";
const checkCls = "checkbox checkbox-sm";

function StepRow({
  step,
  index,
  total,
  onPatch,
  onMove,
  onRemove,
}: {
  step: VisualStep;
  index: number;
  total: number;
  onPatch: (patch: Partial<VisualStep>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-base-content/10 bg-base-100 p-2">
      <span className={`badge badge-sm ${KIND_BADGE[step.kind]} shrink-0`}>
        {t(`wf_step_${step.kind}`)}
      </span>

      {step.kind === "command" && (
        <>
          <input
            className={`${inputCls} w-24 font-mono`}
            list="wf-command-keys"
            placeholder="tab"
            value={step.command}
            onChange={(e) => onPatch({ command: e.target.value })}
          />
          <input
            className={`${inputCls} flex-1 min-w-32 font-mono`}
            placeholder={t("wf_field_filter")}
            value={step.filter}
            onChange={(e) => onPatch({ filter: e.target.value })}
          />
          <input
            className={`${inputCls} w-20 font-mono`}
            placeholder={t("wf_field_selection")}
            title={t("wf_field_selection_hint")}
            value={step.selection}
            onChange={(e) => onPatch({ selection: e.target.value })}
          />
          <label className="flex items-center gap-1 text-xs opacity-70">
            <input
              type="checkbox"
              className={checkCls}
              checked={step.shift}
              onChange={(e) => onPatch({ shift: e.target.checked })}
            />
            shift
          </label>
          <label className="flex items-center gap-1 text-xs opacity-70">
            <input
              type="checkbox"
              className={checkCls}
              checked={step.alt}
              onChange={(e) => onPatch({ alt: e.target.checked })}
            />
            alt
          </label>
          <datalist id="wf-command-keys">
            {COMMAND_KEYS.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
        </>
      )}

      {step.kind === "wait" && (
        <input
          className={`${inputCls} w-28 font-mono`}
          placeholder="0.5"
          title={t("wf_field_wait_hint")}
          value={step.value}
          onChange={(e) => onPatch({ value: e.target.value })}
        />
      )}
      {step.kind === "focus" && (
        <input
          className={`${inputCls} w-24 font-mono`}
          placeholder="1"
          title={t("wf_field_window_hint")}
          value={step.index}
          onChange={(e) => onPatch({ index: e.target.value })}
        />
      )}
      {step.kind === "repeat" && (
        <input
          className={`${inputCls} w-24 font-mono`}
          placeholder="2"
          title={t("wf_field_repeat_hint")}
          value={step.count}
          onChange={(e) => onPatch({ count: e.target.value })}
        />
      )}
      {step.kind === "end" && <span className="text-xs opacity-60">{t("wf_step_end_hint")}</span>}

      {step.kind === "set" && (
        <>
          <input
            className={`${inputCls} w-32 font-mono`}
            placeholder={t("wf_field_var")}
            value={step.key}
            onChange={(e) => onPatch({ key: e.target.value })}
          />
          <span className="text-xs opacity-60">=</span>
          <input
            className={`${inputCls} flex-1 min-w-32 font-mono`}
            placeholder={t("wf_field_value")}
            value={step.value}
            onChange={(e) => onPatch({ value: e.target.value })}
          />
        </>
      )}

      {step.kind === "if" && (
        <>
          <input
            className={`${inputCls} flex-1 min-w-28 font-mono`}
            placeholder="{{\u007bvar\u007d}}"
            value={step.left}
            onChange={(e) => onPatch({ left: e.target.value })}
          />
          <select
            className="select select-bordered select-sm font-mono"
            value={step.op}
            onChange={(e) => onPatch({ op: e.target.value })}
          >
            {IF_OPS.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
          {step.op !== "empty" && (
            <input
              className={`${inputCls} flex-1 min-w-28 font-mono`}
              placeholder={t("wf_field_value")}
              value={step.right}
              onChange={(e) => onPatch({ right: e.target.value })}
            />
          )}
        </>
      )}

      {(step.kind === "copy" || step.kind === "note") && (
        <input
          className={`${inputCls} flex-1 min-w-32`}
          placeholder={t(step.kind === "copy" ? "wf_field_copy_text" : "wf_field_note_text")}
          value={step.text}
          onChange={(e) => onPatch({ text: e.target.value })}
        />
      )}

      {step.kind === "raw" && (
        <input
          className={`${inputCls} flex-1 min-w-32 font-mono`}
          value={step.text}
          onChange={(e) => onPatch({ text: e.target.value })}
        />
      )}

      <span className="flex-1" />
      <button
        type="button"
        className="btn btn-ghost btn-xs"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        title={t("wf_move_up")}
      >
        ↑
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs"
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        title={t("wf_move_down")}
      >
        ↓
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-xs text-error"
        onClick={onRemove}
        title={t("wf_delete")}
      >
        ✕
      </button>
    </div>
  );
}

/**
 * 工作流图形编辑器：把正文解析为步骤卡片（可视化编辑），与源码视图双向同步。
 */
export default function WorkflowEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (content: string) => void;
}) {
  const [mode, setMode] = useState<"visual" | "source">("visual");
  const [steps, setSteps] = useState<VisualStep[]>(() => parseWorkflowSteps(content));
  const [addKind, setAddKind] = useState<VisualStep["kind"]>("command");

  const switchMode = (m: "visual" | "source") => {
    if (m === "visual") {
      // 切回图形视图时重新解析（源码可能被手改过）
      setSteps(parseWorkflowSteps(content));
    }
    setMode(m);
  };

  const updateSteps = (next: VisualStep[]) => {
    setSteps(next);
    onChange(stepsToContent(next));
  };

  const patchStep = (index: number, patch: Partial<VisualStep>) => {
    updateSteps(steps.map((s, i) => (i === index ? ({ ...s, ...patch } as VisualStep) : s)));
  };
  const moveStep = (index: number, dir: -1 | 1) => {
    const next = [...steps];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    updateSteps(next);
  };
  const removeStep = (index: number) => {
    updateSteps(steps.filter((_, i) => i !== index));
  };
  const addStep = () => {
    updateSteps([...steps, defaultStep(addKind)]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="join join-sm">
          <button
            type="button"
            className={`btn btn-sm join-item ${mode === "visual" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => switchMode("visual")}
          >
            {t("wf_mode_visual")}
          </button>
          <button
            type="button"
            className={`btn btn-sm join-item ${mode === "source" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => switchMode("source")}
          >
            {t("wf_mode_source")}
          </button>
        </div>
        {mode === "visual" && (
          <span className="text-xs text-base-content/50">{t("wf_visual_hint")}</span>
        )}
      </div>

      {mode === "visual" ? (
        <div className="space-y-2">
          {steps.length === 0 && (
            <p className="text-sm text-base-content/50 py-2">{t("wf_visual_empty")}</p>
          )}
          {steps.map((step, i) => (
            <StepRow
              key={i}
              step={step}
              index={i}
              total={steps.length}
              onPatch={(patch) => patchStep(i, patch)}
              onMove={(dir) => moveStep(i, dir)}
              onRemove={() => removeStep(i)}
            />
          ))}
          <div className="flex items-center gap-2 pt-1">
            <select
              className="select select-bordered select-sm"
              value={addKind}
              onChange={(e) => setAddKind(e.target.value as VisualStep["kind"])}
            >
              {STEP_KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {t(k.labelKey)}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-sm btn-outline" onClick={addStep}>
              + {t("wf_add_step")}
            </button>
          </div>
        </div>
      ) : (
        <textarea
          className="textarea textarea-bordered font-mono text-sm min-h-40 lg:min-h-56 w-full"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("workflows_placeholder_content")}
          spellCheck={false}
        />
      )}
    </div>
  );
}
