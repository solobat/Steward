import { initConfig, globalData, globalApi } from '../../main/main'
import Vue from 'vue';
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import App from './App.vue';
import dayjs from 'dayjs';
import axios from 'axios'
import { Loading } from 'element-ui'
import { registerComponents } from 'helper/component.helper'

Vue.use(ElementUI);
Vue.config.productionTip = false;
Vue.config.devtools = true;
Vue.prototype.$dayjs = dayjs;
Vue.prototype.$http = axios;
Vue.use(Loading.directive)
Vue.prototype.$axios = axios;
Vue.prototype.$notify = function notify(title, body) {
  Notification.requestPermission( function(status) {
    if (status === 'granted') {
     new Notification(title, { body });
    }
  });
}

const mode = 'newTab';

globalData({ mode, data: {} });
initConfig(mode, false).then(config => {
  globalData({ config });
  registerComponents(Vue, config.components);

  const app = new Vue({
    el: '#app',
    data: {
      config
    },
    components: { App },
    template: '<App />'
  });

  globalApi(app);
});
