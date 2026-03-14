import type { Command, ExecuteContext } from "../types";

/** 设置：打开扩展选项页 */
export const settings: Command = {
  id: "settings",
  key: "opt",
  title: "Settings",
  desc: "Open options",
  action: "settings",
  execute(ctx: ExecuteContext) {
    ctx.openOptionsPage();
    ctx.close();
  },
};
