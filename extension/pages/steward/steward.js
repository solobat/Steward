import { initConfig, globalApi } from '../../js/main/main'
import Vue from 'vue';
import App from './App.vue';

Vue.config.productionTip = false;

initConfig('newTab', false).then(config => {
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
