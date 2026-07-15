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
    path: '/board/:category?',
    name: 'board-list',
    component: BoardListView,
    props: route => ({ category: route.params.category || null })
  },
  {
    path: '/board/:category?/:id(\\d+)',
    name: 'post-detail',
    component: PostDetailView,
    props: route => ({ category: route.params.category || null, id: Number(route.params.id) })
  },
  {
    path: '/board/:category?/write',
    name: 'post-write',
    component: PostFormView,
    props: route => ({ category: route.params.category || null })
  },
  {
    path: '/board/:category?/edit/:id(\\d+)',
    name: 'post-edit',
    component: PostFormView,
    props: route => ({ category: route.params.category || null, id: Number(route.params.id) })
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