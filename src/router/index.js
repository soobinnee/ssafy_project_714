import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BoardListView from '../views/BoardListView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostFormView from '../views/PostFormView.vue'
import DashboardView from '../views/DashboardView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/board/:category',
    name: 'board-list',
    component: BoardListView
  },
  {
    path: '/board/:category/:id',
    name: 'post-detail',
    component: PostDetailView
  },
  {
    path: '/board/:category/write',
    name: 'post-write',
    component: PostFormView
  },
  {
    path: '/board/:category/edit/:id',
    name: 'post-edit',
    component: PostFormView
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router