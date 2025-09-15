"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminStore {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

// 실제 환경에서는 환경변수나 더 안전한 방법을 사용해야 합니다
const ADMIN_PASSWORD = "gongmyung2024!";

export const useAdmin = create<AdminStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (password: string) => {
        if (password === ADMIN_PASSWORD) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'admin-storage',
    }
  )
);

// 개발용: 관리자 모드 강제 활성화 (테스트 후 제거)
// Note: Removed development-only auto-login to prevent admin mode being enabled on initial page load.
// If you need a development shortcut, enable it explicitly during testing only.
