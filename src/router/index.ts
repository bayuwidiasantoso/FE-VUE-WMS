import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

import DashboardView from '../views/DashboardView.vue';
import BarangView from '../views/BarangView.vue';
import TransaksiView from '../views/TransaksiView.vue';
import LaporanView from '../views/LaporanView.vue';
import BarangDetailView from '../views/BarangDetailView.vue';
import ActivityLogView from '../views/ActivityLogView.vue';
import LoginView from '../views/LoginView.vue';
import { useAuth } from '../composables/useAuth';


// const routes: RouteRecordRaw[] = [
//   { path: '/', name: 'dashboard', component: DashboardView },
//   { path: '/barang', name: 'barang', component: BarangView },
//   { path: '/barang/:id', name: 'barang-detail', component: BarangDetailView, props: true }, 
//   { path: '/transaksi', name: 'transaksi', component: TransaksiView },
//   { path: '/laporan', name: 'laporan', component: LaporanView },
//   { path: '/logs', name: 'logs', component: ActivityLogView },
// ];

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, roles: ['admin', 'staff'] },
  },
  {
    path: '/barang',
    name: 'barang',
    component: BarangView,
    meta: { requiresAuth: true, roles: ['admin'] }, // admin-only
  },
  { 
    path: '/barang/:id', 
    name: 'barang-detail',
    component: BarangDetailView, 
    meta: { requiresAuth: true, roles: ['admin', 'staff'] },
    props: true 
  }, 
  {
    path: '/transaksi',
    name: 'transaksi',
    component: TransaksiView,
    meta: { requiresAuth: true, roles: ['admin', 'staff'] },
  },
  {
    path: '/laporan',
    name: 'laporan',
    component: LaporanView,
    meta: { requiresAuth: true, roles: ['admin', 'staff'] },
  },
  {
    path: '/logs',
    name: 'logs',
    component: ActivityLogView,
    meta: { requiresAuth: true, roles: ['admin'] }, // admin-only
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const { initAuth, isAuthenticated, user } = useAuth();
  await initAuth();

  if (to.meta.guestOnly && isAuthenticated.value) {
    return next({ name: 'dashboard' });
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (to.meta.requiresAuth && to.meta.roles && user.value) {
    const roles = to.meta.roles as string[];
    if (!roles.includes(user.value.role)) {
      // role tidak diizinkan → lempar ke dashboard
      return next({ name: 'dashboard' });
    }
  }

  return next();
});

export default router;
