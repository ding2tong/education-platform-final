import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';
import { beforeEach, describe, it, expect } from 'vitest';

describe('Auth Store', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance and make it active
    // so it's automatically picked up by useAuthStore()
    setActivePinia(createPinia());
  });

  it('isAdmin returns true for an admin user', () => {
    const authStore = useAuthStore();
    authStore.currentUser = { role: 'admin' };
    expect(authStore.isAdmin).toBe(true);
  });

  it('isAdmin returns false for a non-admin user', () => {
    const authStore = useAuthStore();
    authStore.currentUser = { role: 'student' };
    expect(authStore.isAdmin).toBe(false);
  });

  it('isAdmin returns false when currentUser is null', () => {
    const authStore = useAuthStore();
    authStore.currentUser = null;
    expect(authStore.isAdmin).toBe(false);
  });

  it('isLoggedIn returns true when currentUser is set', () => {
    const authStore = useAuthStore();
    authStore.currentUser = { uid: '123' };
    expect(authStore.isLoggedIn).toBe(true);
  });

  it('isLoggedIn returns false when currentUser is null', () => {
    const authStore = useAuthStore();
    authStore.currentUser = null;
    expect(authStore.isLoggedIn).toBe(false);
  });
});
