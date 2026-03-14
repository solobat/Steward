/**
 * Steward v3 - Content Script
 * 注入 iframe 命令框，监听 openBox，Esc/点击外部关闭；postMessage 委托给各命令的 content 实现。
 * 与旧版一致：读取屏蔽列表（url），匹配当前页则跳转到替换页或 block 页。
 */
import * as metaContent from "../commands/meta/content";
import * as navContent from "../commands/nav/content";
import * as outlineContent from "../commands/outline/content";
import { request } from "@/lib/portBridge";

const POPUP_PATH = "src/popup/index.html";
const URL_BLOCK_LIST_KEY = "url";
const URL_BLOCK_REPLACE_PAGE_KEY = "urlblock_replace_page";
const BK8_EXPIRE_MS = 8 * 60 * 60 * 1000;

type BlockItem = { id: string | number; type?: string; title: string };

function getEffectiveBlockList(raw: unknown): BlockItem[] {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const now = Date.now();
  return list.filter((x: BlockItem) => {
    if ((x?.type ?? "bk") === "bk") return true;
    if (x?.type === "bk8") {
      const idNum = Number(x.id);
      if (!Number.isNaN(idNum) && now - idNum < BK8_EXPIRE_MS) return true;
    }
    return false;
  });
}

function getReplaceList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") return [raw];
  return [];
}

function isBlockPageUrl(href: string): boolean {
  return href.includes("urlblock.html");
}

function checkAndBlock(): void {
  const href = window.location.href;
  if (isBlockPageUrl(href)) return;

  chrome.storage.sync.get([URL_BLOCK_LIST_KEY, URL_BLOCK_REPLACE_PAGE_KEY], (r) => {
    const blockList = getEffectiveBlockList(r[URL_BLOCK_LIST_KEY]);
    const replaceList = getReplaceList(r[URL_BLOCK_REPLACE_PAGE_KEY]);
    const hit = blockList.find((item) => href.indexOf(item.title) !== -1);
    if (!hit) return;

    if (replaceList.length > 0) {
      const url = replaceList[Math.floor(Math.random() * replaceList.length)];
      window.location.href = url;
    } else {
      const blockPageUrl = chrome.runtime.getURL("src/urlblock.html");
      window.location.href = `${blockPageUrl}?original=${encodeURIComponent(href)}`;
    }
  });
}

function initUrlBlock(): void {
  checkAndBlock();
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && (changes[URL_BLOCK_LIST_KEY] || changes[URL_BLOCK_REPLACE_PAGE_KEY])) {
      checkAndBlock();
    }
  });
}

// 尽早执行：页面加载时根据屏蔽列表跳转
initUrlBlock();

const STEWARD_BOX_ATTR = "data-steward-box";

function getBoxHtml(): string {
  const url = chrome.runtime.getURL(POPUP_PATH);
  return `
    <div id="steward-main" class="steward-main" ${STEWARD_BOX_ATTR}="1" style="display:none;">
      <iframe id="steward-iframe" src="${url}" title="Steward" width="530" height="480" frameborder="0"></iframe>
    </div>
  `;
}

/** 移除页面上所有已存在的 Steward 命令框容器，保证只保留一个实例 */
function removeAllStewardContainers(): void {
  document.querySelectorAll(`[${STEWARD_BOX_ATTR}="1"]`).forEach((node) => node.remove());
}

const state = {
  inited: false,
  isOpen: false,
  container: null as HTMLDivElement | null,
  iframe: null as HTMLIFrameElement | null,
  /** 打开弹窗时锁住背后页面滚动，关闭时恢复 */
  savedOverflow: "",
};

function openBox(): void {
  const all = document.querySelectorAll(`[${STEWARD_BOX_ATTR}="1"]`);
  if (all.length > 1) {
    all.forEach((node) => {
      if (node !== state.container) node.remove();
    });
  }
  if (!state.container || !document.contains(state.container)) {
    state.container = document.getElementById("steward-main") as HTMLDivElement | null;
    state.iframe = state.container?.querySelector("#steward-iframe") as HTMLIFrameElement | null;
  }
  if (!state.container) return;
  state.isOpen = true;
  state.savedOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  state.container.style.display = "";
  state.iframe?.focus();
  chrome.storage.local.set({ stewardFocus: Date.now() });
}

function closeBox(): void {
  if (!state.container) return;
  state.isOpen = false;
  document.body.style.overflow = state.savedOverflow;
  state.container.style.display = "none";
}

function toggleBox(): void {
  if (state.isOpen) closeBox();
  else openBox();
}

function init(): void {
  if (state.inited) return;
  state.inited = true;
  removeAllStewardContainers();
  const wrap = document.createElement("div");
  wrap.innerHTML = getBoxHtml().trim();
  const el = wrap.firstElementChild as HTMLDivElement;
  const iframe = el.querySelector("#steward-iframe") as HTMLIFrameElement;
  document.documentElement.appendChild(el);
  state.container = el;
  state.iframe = iframe;

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBox();
  });
  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    const hitOverlay = target === el;
    const hitOutside = !el.contains(target);
    if (state.isOpen && (hitOverlay || hitOutside)) closeBox();
  });
  window.addEventListener("message", (e) => {
    if (e.data?.action === "CLOSE_BOX") {
      closeBox();
      return;
    }
    if (e.source !== state.iframe?.contentWindow) return;
    const src = e.source as Window;
    if (e.data?.action === metaContent.ACTION_GET_META) {
      metaContent.handleGetMeta(src);
      return;
    }
    if (e.data?.action === navContent.ACTION_QUERY_NAVS) {
      navContent.handleQueryNavs(src);
      return;
    }
    if (e.data?.action === navContent.ACTION_CLICK_NAV && typeof e.data.index === "number") {
      navContent.handleClickNav(e.data.index);
      return;
    }
    if (e.data?.action === outlineContent.ACTION_GEN_OUTLINE) {
      outlineContent.handleGenOutline(src);
      return;
    }
    if (e.data?.action === outlineContent.ACTION_SCROLL_TO_OUTLINE && typeof e.data.index === "number") {
      outlineContent.handleScrollToOutline(e.data.index);
      return;
    }
  });
}

chrome.runtime.onMessage.addListener(
  (msg: { action: string }, _sender: chrome.runtime.MessageSender, sendResponse: (r?: unknown) => void) => {
    if (msg.action === "openBox") {
      if (!state.inited) {
        init();
        setTimeout(() => {
          openBox();
          sendResponse({ ok: true });
        }, 50);
      } else {
        toggleBox();
        sendResponse({ ok: true });
      }
      return true;
    }
    return false;
  }
);

// 根据 config.general.speedFirst：true 则立即注入（打开更快），false 则首次 openBox 再注入
request<{ config?: { general?: { speedFirst?: boolean } } }>({ action: "getData" })
  .then((res) => {
    if (res?.config?.general?.speedFirst) init();
  })
  .catch(() => {});
