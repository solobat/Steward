import appInit from '../../js/main/main'
import Vue from 'vue';
import App from './App.vue';

Vue.config.productionTip = false;

appInit('newTab', false).then(config => {
  const app = new Vue({
    el: '#app',
    data: {
      config
    },
    components: { App },
    template: '<App />'
  });

  window.stewardApp = {
    on(eventName, fn) {
      app.$on(eventName, fn);
    },

    emit(...args) {
      const eventName = args[0];
      const params = args.slice(1);

      app.$emit(eventName, ...params);
    }
  };
});