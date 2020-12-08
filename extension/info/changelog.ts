const langZh = [
  {
    version: 'v4.1.0',
    detail: '整体重构；新增plugin/组件的参数支持；新增命令框空查询；支持plugin级别的使用频次排序；移除无效的plugins。'
  },
  {
    version: 'v4.0.6',
    detail: '移除一些失效的内置 chrome 页面，以及小优化',
  },
  {
    version: 'v4.0.5',
    detail: '优化及 Bug 修复',
  },
  {
    version: 'v4.0.4',
    detail: '优化及 Bug 修复',
  },
  {
    version: 'v4.0.3',
    detail: 'bugfix',
  },
  {
    version: 'v4.0.2',
    detail:
      '组件支持快捷键显示/隐藏；component plugin 提供 show/hide 命令启动和禁用组件',
  },
  {
    version: 'v4.0.1',
    detail: '搜索结果按使用次数排序；newtab layout 优化; 组件源切换',
  },
  {
    version: 'v4.0.0',
    detail: 'Newtab 组件化，可定制; 设置页重构',
  },
];

const langEn = [
  {
    version: 'v4.1.0',
    detail: 'Refactor; Plugin/Component args supportted; Query onEmpty setting; Plugin level results sorted; Remove some invalid plugins.'
  },
  {
    version: 'v4.0.6',
    detail: 'remove some invalid chrome pages && optimization',
  },
  {
    version: 'v4.0.5',
    detail: 'optimization && bugfix',
  },
  {
    version: 'v4.0.4',
    detail: 'optimization && bugfix',
  },
  {
    version: 'v4.0.3',
    detail: 'bugfix',
  },
  {
    version: 'v4.0.2',
    detail:
      'Use shortcut keys to show components; Provide show / hide command to enable and disable components',
  },
  {
    version: 'v4.0.1',
    detail:
      'Sort search results by number of uses; newtab layout optimization; component source switching',
  },
  {
    version: 'v4.0.0',
    detail: 'Component Newtab page, customizable; refactor the settings page',
  },
];

let results;

if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
  results = langZh;
} else {
  results = langEn;
}

export default results;
