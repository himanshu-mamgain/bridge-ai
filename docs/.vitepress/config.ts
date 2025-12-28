import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Bridge AI SDK",
  description: "Unified AI SDK for OpenAI, Gemini, Claude, Perplexity, and DeepSeek",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
          ]
        },
        {
          text: 'Usage',
          items: [
            { text: 'Command Pattern', link: '/guide/command-pattern' },
            { text: 'Environment Variables', link: '/guide/env-vars' },
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/himanshu-mamgain/bridge-ai' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Himanshu Mamgain'
    }
  }
})
