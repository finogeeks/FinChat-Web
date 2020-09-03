import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
// import Login from './views/Login.vue'
const Login = () => import('./views/Login/Index.vue');
// import Chat from './views/Chat/Index.vue'
const Chat = () => import('./views/Chat/Index.vue');
// import Consult from './views/Chat/Consult.vue';
const Consult = () => import('./views/Chat/Consult.vue');
const Test = () => import('./views/About.vue');

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (about.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    // },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/chat',
      name: 'chat',
      component: Chat
    }
    // {
    //   path: '/test',
    //   name: 'test',
    //   component: Test
    // }
  ]
})
