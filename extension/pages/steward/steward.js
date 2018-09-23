import { initConfig, globalData, globalApi } from '../../js/main/main'
import Vue from 'vue';
import App from './App.vue';

Vue.config.productionTip = false;

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
