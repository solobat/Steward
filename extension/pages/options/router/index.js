import Vue from 'vue'
import VueRouter from 'vue-router'
import General from '@/pages/options/views/General.vue'
import Plugins from '@/pages/options/views/Plugins.vue'
import Workflows from '@/pages/options/views/Workflows.vue'
import Websites from '@/pages/options/views/Websites.vue'
import Newtabcomponents from '@/pages/options/views/Newtabcomponents.vue'
import Wallpapers from '@/pages/options/views/Wallpapers.vue'
import Appearance from '@/pages/options/views/Appearance.vue'
import Advanced from '@/pages/options/views/Advanced.vue'
import Help from '@/pages/options/views/Help.vue'
import Update from '@/pages/options/views/Update.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'General',
    component: General,
    meta: {
    }
  },
  {
    path: '/plugins',
    name: 'Plugins',
    component: Plugins,
    meta: {
    }
  },
  {
    path: '/workflows',
    name: 'Workflows',
    component: Workflows,
    meta: {
    }
  },
  {
    path: '/websites',
    name: 'Websites',
    component: Websites,
    meta: {
    }
  },
  {
    path: '/newtabcomponents',
    name: 'Newtabcomponents',
    component: Newtabcomponents,
    meta: {
    }
  },
  {
    path: '/wallpapers',
    name: 'Wallpapers',
    component: Wallpapers,
    meta: {
    }
  },
  {
    path: '/appearance',
    name: 'Appearance',
    component: Appearance,
    meta: {
    }
  },
  {
    path: '/advanced',
    name: 'Advanced',
    component: Advanced,
    meta: {
    }
  },
  {
    path: '/help',
    name: 'Help',
    component: Help,
    meta: {
    }
  },
  {
    path: '/update',
    name: 'Update',
    component: Update,
    meta: {
    }
  },
  { path: '*', redirect: '/' }
]

const router = new VueRouter({
  mode: 'hash',
  routes
})

export default router
