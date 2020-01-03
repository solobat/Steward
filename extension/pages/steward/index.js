import { initConfig, globalData, globalApi } from '../../js/main/main'
import Vue from 'vue';
import App from './App.vue';
import dayjs from 'dayjs';
import axios from 'axios'
import { registerComponents } from '../../js/helper/componentHelper'

Vue.config.productionTip = false;
Vue.prototype.$dayjs = dayjs;
Vue.prototype.$http = axios;
Vue.prototype.$axios = axios;

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
