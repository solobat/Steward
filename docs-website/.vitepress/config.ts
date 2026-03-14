import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Steward',
  description: 'Chrome 命令启动器 · Manifest V3 版',
  lang: 'zh-CN',
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '教程', link: '/guide/getting-started' },
      { text: '隐私政策', link: '/privacy' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '快捷键', link: '/guide/shortcuts' },
          ],
        },
        {
          text: '功能',
          items: [
            { text: '命令与触发词', link: '/guide/commands' },
            { text: '搜索', link: '/guide/search' },
            { text: '工作流', link: '/guide/workflows' },
            { text: '外观与设置', link: '/guide/settings' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/solobat/Steward' },
    ],
    footer: {
      message: 'Steward v3 · Chrome 扩展',
      copyright: '© Steward',
    },
    outlineTitle: '本页目录',
  },
  lastUpdated: true,
})
