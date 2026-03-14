import type { Command, ExecuteContext } from "../types";

/** 关闭命令框 */
export const close: Command = {
  id: "close",
  key: "close",
  title: "Close",
  desc: "Esc",
  action: "close",
  execute(ctx: ExecuteContext) {
    ctx.close();
  },
};
