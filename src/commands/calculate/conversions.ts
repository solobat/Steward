/**
 * 单位/货币换算：calc 的扩展能力（对标 Spotlight / Raycast 的换算）。
 * 语法：<数值> <单位> in|to|-> <目标单位>，如 "5ft in cm"、"100 usd to cny"、"32 c in f"。
 * 货币使用实时汇率（open.er-api.com），不可用时退回静态参考表。
 */
import { request } from "@/lib/portBridge";

type UnitCategory = "length" | "weight" | "volume" | "data" | "time" | "speed" | "currency" | "temperature";

interface UnitDef {
  /** 相对基准单位的系数 */
  factor: number;
  category: UnitCategory;
  /** 展示名 */
  name: string;
}

/** 单位表：factor = 相对该类别基准单位 */
const UNITS: Record<string, UnitDef> = {
  // 长度（基准 m）
  m: { factor: 1, category: "length", name: "米" },
  km: { factor: 1000, category: "length", name: "千米" },
  cm: { factor: 0.01, category: "length", name: "厘米" },
  mm: { factor: 0.001, category: "length", name: "毫米" },
  in: { factor: 0.0254, category: "length", name: "英寸" },
  ft: { factor: 0.3048, category: "length", name: "英尺" },
  yd: { factor: 0.9144, category: "length", name: "码" },
  mile: { factor: 1609.344, category: "length", name: "英里" },
  nmi: { factor: 1852, category: "length", name: "海里" },
  米: { factor: 1, category: "length", name: "米" },
  千米: { factor: 1000, category: "length", name: "千米" },
  公里: { factor: 1000, category: "length", name: "公里" },
  厘米: { factor: 0.01, category: "length", name: "厘米" },
  毫米: { factor: 0.001, category: "length", name: "毫米" },
  英寸: { factor: 0.0254, category: "length", name: "英寸" },
  英尺: { factor: 0.3048, category: "length", name: "英尺" },
  码: { factor: 0.9144, category: "length", name: "码" },
  英里: { factor: 1609.344, category: "length", name: "英里" },
  海里: { factor: 1852, category: "length", name: "海里" },
  里: { factor: 500, category: "length", name: "里" },
  // 重量（基准 kg）
  kg: { factor: 1, category: "weight", name: "千克" },
  g: { factor: 0.001, category: "weight", name: "克" },
  mg: { factor: 1e-6, category: "weight", name: "毫克" },
  t: { factor: 1000, category: "weight", name: "吨" },
  lb: { factor: 0.45359237, category: "weight", name: "磅" },
  oz: { factor: 0.028349523, category: "weight", name: "盎司" },
  千克: { factor: 1, category: "weight", name: "千克" },
  公斤: { factor: 1, category: "weight", name: "公斤" },
  克: { factor: 0.001, category: "weight", name: "克" },
  毫克: { factor: 1e-6, category: "weight", name: "毫克" },
  吨: { factor: 1000, category: "weight", name: "吨" },
  磅: { factor: 0.45359237, category: "weight", name: "磅" },
  盎司: { factor: 0.028349523, category: "weight", name: "盎司" },
  斤: { factor: 0.5, category: "weight", name: "斤" },
  两: { factor: 0.05, category: "weight", name: "两" },
  // 体积（基准 L）
  l: { factor: 1, category: "volume", name: "升" },
  ml: { factor: 0.001, category: "volume", name: "毫升" },
  m3: { factor: 1000, category: "volume", name: "立方米" },
  gal: { factor: 3.785411784, category: "volume", name: "加仑" },
  qt: { factor: 0.946352946, category: "volume", name: "夸脱" },
  cup: { factor: 0.24, category: "volume", name: "杯" },
  升: { factor: 1, category: "volume", name: "升" },
  毫升: { factor: 0.001, category: "volume", name: "毫升" },
  立方米: { factor: 1000, category: "volume", name: "立方米" },
  加仑: { factor: 3.785411784, category: "volume", name: "加仑" },
  // 数据（基准 B）
  b: { factor: 1, category: "data", name: "字节" },
  kb: { factor: 1024, category: "data", name: "KB" },
  mb: { factor: 1024 ** 2, category: "data", name: "MB" },
  gb: { factor: 1024 ** 3, category: "data", name: "GB" },
  tb: { factor: 1024 ** 4, category: "data", name: "TB" },
  pb: { factor: 1024 ** 5, category: "data", name: "PB" },
  字节: { factor: 1, category: "data", name: "字节" },
  // 时间（基准 s）
  s: { factor: 1, category: "time", name: "秒" },
  ms: { factor: 0.001, category: "time", name: "毫秒" },
  min: { factor: 60, category: "time", name: "分钟" },
  h: { factor: 3600, category: "time", name: "小时" },
  day: { factor: 86400, category: "time", name: "天" },
  week: { factor: 604800, category: "time", name: "周" },
  秒: { factor: 1, category: "time", name: "秒" },
  毫秒: { factor: 0.001, category: "time", name: "毫秒" },
  分钟: { factor: 60, category: "time", name: "分钟" },
  小时: { factor: 3600, category: "time", name: "小时" },
  天: { factor: 86400, category: "time", name: "天" },
  周: { factor: 604800, category: "time", name: "周" },
  // 速度（基准 m/s）
  "m/s": { factor: 1, category: "speed", name: "米/秒" },
  "km/h": { factor: 0.2777777778, category: "speed", name: "千米/小时" },
  mph: { factor: 0.44704, category: "speed", name: "英里/小时" },
  // 货币（基准 USD，2025 年参考汇率，仅做估算）
  usd: { factor: 1, category: "currency", name: "美元" },
  cny: { factor: 0.13793103448275862, category: "currency", name: "人民币" },
  eur: { factor: 1.0869565217391304, category: "currency", name: "欧元" },
  jpy: { factor: 0.00641025641025641, category: "currency", name: "日元" },
  gbp: { factor: 1.2658227848101264, category: "currency", name: "英镑" },
  hkd: { factor: 0.12820512820512822, category: "currency", name: "港币" },
  krw: { factor: 0.0007246376811594203, category: "currency", name: "韩元" },
  twd: { factor: 0.0308641975308642, category: "currency", name: "新台币" },
  rub: { factor: 0.010869565217391304, category: "currency", name: "卢布" },
  inr: { factor: 0.011961722488038277, category: "currency", name: "印度卢比" },
  cad: { factor: 0.7299270072992701, category: "currency", name: "加元" },
  aud: { factor: 0.6535947712418301, category: "currency", name: "澳元" },
  chf: { factor: 1.1235955056179776, category: "currency", name: "瑞士法郎" },
  sgd: { factor: 0.7407407407407407, category: "currency", name: "新加坡元" },
  myr: { factor: 0.2127659574468085, category: "currency", name: "马币" },
  thb: { factor: 0.0273972602739726, category: "currency", name: "泰铢" },
  美元: { factor: 1, category: "currency", name: "美元" },
  人民币: { factor: 7.25, category: "currency", name: "人民币" },
  元: { factor: 7.25, category: "currency", name: "人民币" },
  欧元: { factor: 0.92, category: "currency", name: "欧元" },
  日元: { factor: 156, category: "currency", name: "日元" },
  英镑: { factor: 0.79, category: "currency", name: "英镑" },
  港币: { factor: 7.8, category: "currency", name: "港币" },
  韩元: { factor: 1380, category: "currency", name: "韩元" },
  卢布: { factor: 92, category: "currency", name: "卢布" },
  // 温度（特殊公式）
  c: { factor: 1, category: "temperature", name: "摄氏度" },
  "°c": { factor: 1, category: "temperature", name: "摄氏度" },
  f: { factor: 1, category: "temperature", name: "华氏度" },
  "°f": { factor: 1, category: "temperature", name: "华氏度" },
  k: { factor: 1, category: "temperature", name: "开尔文" },
  摄氏度: { factor: 1, category: "temperature", name: "摄氏度" },
  摄氏: { factor: 1, category: "temperature", name: "摄氏度" },
  华氏度: { factor: 1, category: "temperature", name: "华氏度" },
  华氏: { factor: 1, category: "temperature", name: "华氏度" },
  开尔文: { factor: 1, category: "temperature", name: "开尔文" },
  开: { factor: 1, category: "temperature", name: "开尔文" },
};

function temperatureToCelsius(value: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "f" || u === "°f" || u === "华氏" || u === "华氏度") return ((value - 32) * 5) / 9;
  if (u === "k" || u === "开" || u === "开尔文") return value - 273.15;
  return value;
}

function celsiusToTemperature(celsius: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "f" || u === "°f" || u === "华氏" || u === "华氏度") return (celsius * 9) / 5 + 32;
  if (u === "k" || u === "开" || u === "开尔文") return celsius + 273.15;
  return celsius;
}

const CONVERSION_REG = /^([\d.]+)\s*(.+?)\s+(?:in|to|->|等于|→)\s*([a-z°\u4e00-\u9fa5/]+)$/i;

/** 已知的物理单位简写（3 字母，避免被误判为 ISO 货币） */
const PHYSICAL_3LETTER = new Set(["in", "ft", "yd", "oz", "t", "b", "s", "h", "k", "c", "f", "gal", "cup", "day", "week", "mil"]);

function lookupUnit(raw: string): UnitDef | undefined {
  const key = raw.trim().toLowerCase();
  const def = UNITS[key];
  if (def) return def;
  // 3 字母 ISO 货币代码（如 brl/zar/sar，实时汇率表里都有）
  if (/^[a-z]{3}$/.test(key) && !PHYSICAL_3LETTER.has(key)) {
    return { factor: 1, category: "currency", name: key.toUpperCase() };
  }
  return undefined;
}

export interface ConversionResult {
  value: string;
  desc: string;
  /** 是否使用实时汇率（仅货币） */
  live?: boolean;
}

/**
 * 解析换算表达式：<数值> <单位> in|to|-> <目标单位>
 * 物理单位用固定系数；货币单位用实时汇率（open.er-api.com，失败时退回静态表）。
 */
function parseConversion(input: string): { num: number; from: UnitDef; to: UnitDef; fromKey: string; toKey: string } | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(CONVERSION_REG);
  if (!m) return null;
  const num = Number(m[1]);
  if (!Number.isFinite(num)) return null;
  const from = lookupUnit(m[2]);
  const to = lookupUnit(m[3]);
  if (!from || !to || from.category !== to.category) return null;
  return { num, from, to, fromKey: m[2].trim(), toKey: m[3].trim() };
}

/** 单位别名 → ISO 货币代码（拉丁小写或中文名） */
const CURRENCY_ISO: Record<string, string> = {
  usd: "USD", 美元: "USD",
  cny: "CNY", 人民币: "CNY", 元: "CNY",
  eur: "EUR", 欧元: "EUR",
  jpy: "JPY", 日元: "JPY",
  gbp: "GBP", 英镑: "GBP",
  hkd: "HKD", 港币: "HKD",
  krw: "KRW", 韩元: "KRW",
  twd: "TWD", 新台币: "TWD",
  rub: "RUB", 卢布: "RUB",
  inr: "INR", 印度卢比: "INR",
  cad: "CAD", 加元: "CAD",
  aud: "AUD", 澳元: "AUD",
  chf: "CHF", 瑞士法郎: "CHF",
  sgd: "SGD", 新加坡元: "SGD",
  myr: "MYR", 马币: "MYR",
  thb: "THB", 泰铢: "THB",
};

/** 通过 background 读取实时汇率（storage 缓存 1 小时） */
async function fetchLiveRates(): Promise<Record<string, number> | null> {
  try {
    const res = await request<{ rates?: Record<string, number> } | null>({ action: "getExchangeRates" });
    return res && typeof res.rates === "object" && res.rates ? res.rates : null;
  } catch {
    return null;
  }
}

/** 尝试换算（异步：货币走实时汇率）。返回 null 表示不是可换算表达式 */
export async function convertUnit(input: string): Promise<ConversionResult | null> {
  const p = parseConversion(input);
  if (!p) return null;
  const { num, from, to } = p;

  let result: number;
  let live = false;
  if (from.category === "temperature") {
    const celsius = temperatureToCelsius(num, p.fromKey);
    result = celsiusToTemperature(celsius, p.toKey);
  } else if (from.category === "currency") {
    const rates = await fetchLiveRates();
    const fromIso = CURRENCY_ISO[p.fromKey.toLowerCase()] ?? p.fromKey.toUpperCase();
    const toIso = CURRENCY_ISO[p.toKey.toLowerCase()] ?? p.toKey.toUpperCase();
    const fromRate = rates ? rates[fromIso] : undefined;
    const toRate = rates ? rates[toIso] : undefined;
    if (typeof fromRate === "number" && fromRate > 0 && typeof toRate === "number") {
      // rates 为「1 USD = X 单位」，换算：num × toRate / fromRate
      result = (num * toRate) / fromRate;
      live = true;
    } else {
      // 实时汇率不可用：退回静态参考表
      result = (num * from.factor) / to.factor;
    }
  } else {
    result = (num * from.factor) / to.factor;
  }
  if (!Number.isFinite(result)) return null;

  const value = formatNumber(result);
  const note = from.category === "currency" ? (live ? " · 实时汇率" : " · 参考汇率") : "";
  const desc = `${formatNumber(num)} ${from.name} = ${value} ${to.name}${note}`;
  return { value, desc, live };
}

export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const rounded = Math.round(n * 1e6) / 1e6;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

/** 判断是否为换算表达式（同步，不依赖网络） */
export function isConversionExpression(s: string): boolean {
  return parseConversion(s) !== null;
}
