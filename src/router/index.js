import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
// import WasmDemo from '@/views/WasmDemo'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  }
  // {
  //   path: '/wasm',
  //   name: 'Wasm',
  //   component: WasmDemo
  // }
]

const router = new VueRouter({
  routes
})

export default router
