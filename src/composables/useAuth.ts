import { ref, computed } from 'vue';
import type { User } from '../types';
import { loginApi, fetchMe, logoutApi, setAuthToken } from '../api/client';

const user = ref<User | null>(null);
const token = ref<string | null>(null);
const initialized = ref(false);

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value && !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isStaff = computed(() => user.value?.role === 'staff');

  async function initAuth() {
    if (initialized.value) return;
    const savedToken = localStorage.getItem('wms_token');
    const savedUser = localStorage.getItem('wms_user');

    if (savedToken && savedUser) {
      token.value = savedToken;
      setAuthToken(savedToken);
      try {
        user.value = JSON.parse(savedUser) as User;
      } catch {
        user.value = null;
        token.value = null;
        setAuthToken(null);
      }
    }
    initialized.value = true;
  }

  async function login(email: string, password: string) {
    const res = await loginApi(email, password);
    token.value = res.token;
    user.value = res.user;

    setAuthToken(res.token);
    localStorage.setItem('wms_token', res.token);
    localStorage.setItem('wms_user', JSON.stringify(res.user));
  }

  async function logout() {
    try {
      await logoutApi();
    } catch {}
    token.value = null;
    user.value = null;
    setAuthToken(null);
    localStorage.removeItem('wms_token');
    localStorage.removeItem('wms_user');
  }

  return {
    user,
    token,
    initialized,
    isAuthenticated,
    isAdmin,
    isStaff,
    initAuth,
    login,
    logout,
  };
}
