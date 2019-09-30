import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';
import dayjs from 'dayjs';
import VueTour from 'vue-tour';
// tslint:disable-next-line:no-var-requires
require('vue-tour/dist/vue-tour.css');


Vue.config.productionTip = false;
Vue.use(ElementUI);
Vue.use(VueTour);
Vue.prototype.$dayjs = dayjs;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
