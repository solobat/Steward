import { initConfig, globalData, globalApi } from '../../js/main/main'
import Vue from 'vue';
import App from './App.vue';
import dayjs from 'dayjs';

Vue.config.productionTip = false;
Vue.prototype.$dayjs = dayjs;

const mode = 'newTab';

globalData({ mode, data: {} });
initConfig(mode, false).then(config => {
  globalData({ config });

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
