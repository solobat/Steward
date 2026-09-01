import type { ResultItem, ResultStateType } from "@/commands/types";

function defaultTitle(type: ResultStateType): string {
  switch (type) {
    case "error":
      return "Something went wrong";
    case "timeout":
      return "Request timed out";
    case "unavailable":
      return "Command unavailable";
    case "empty":
    default:
      return "No results";
  }
}

export function createStateItem(
  type: ResultStateType,
  options?: {
    title?: string;
    desc?: string;
    code?: string;
  }
): ResultItem {
  return {
    id: `state-${type}-${options?.code ?? "default"}`,
    title: options?.title ?? defaultTitle(type),
    desc: options?.desc,
    disabled: true,
    disabledReason: options?.desc,
    stateType: type,
    stateCode: options?.code,
  };
}

export function isStateItem(item: ResultItem | null | undefined): boolean {
  return !!item?.stateType || item?.id === "none" || item?.id === "timeout";
}
