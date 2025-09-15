"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FooterButtonRecord {
  id: string;
  buttonText: string;
  clickCount: number;
  lastClicked: string;
  description?: string;
}

interface FooterStore {
  // 버튼 클릭 기록
  buttonRecords: FooterButtonRecord[];
  
  // 액션들
  recordButtonClick: (buttonText: string, description?: string) => void;
  getButtonRecord: (buttonText: string) => FooterButtonRecord | undefined;
  getMostClickedButtons: (limit?: number) => FooterButtonRecord[];
  getRecentButtons: (limit?: number) => FooterButtonRecord[];
  clearRecords: () => void;
  
  // 통계
  getTotalClicks: () => number;
  getUniqueButtons: () => number;
}

export const useFooterStore = create<FooterStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      buttonRecords: [],

      // 버튼 클릭 기록
      recordButtonClick: (buttonText, description) => {
        const now = new Date().toISOString();
        
        set((state) => {
          const existingRecord = state.buttonRecords.find(
            record => record.buttonText === buttonText
          );
          
          if (existingRecord) {
            // 기존 기록 업데이트
            return {
              buttonRecords: state.buttonRecords.map(record =>
                record.buttonText === buttonText
                  ? {
                      ...record,
                      clickCount: record.clickCount + 1,
                      lastClicked: now,
                      description: description || record.description
                    }
                  : record
              )
            };
          } else {
            // 새 기록 추가
            const newRecord: FooterButtonRecord = {
              id: `btn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              buttonText,
              clickCount: 1,
              lastClicked: now,
              description
            };
            
            return {
              buttonRecords: [...state.buttonRecords, newRecord]
            };
          }
        });
      },

      // 특정 버튼 기록 가져오기
      getButtonRecord: (buttonText) => {
        return get().buttonRecords.find(record => record.buttonText === buttonText);
      },

      // 가장 많이 클릭된 버튼들
      getMostClickedButtons: (limit = 5) => {
        return get().buttonRecords
          .sort((a, b) => b.clickCount - a.clickCount)
          .slice(0, limit);
      },

      // 최근 클릭된 버튼들
      getRecentButtons: (limit = 5) => {
        return get().buttonRecords
          .sort((a, b) => new Date(b.lastClicked).getTime() - new Date(a.lastClicked).getTime())
          .slice(0, limit);
      },

      // 기록 초기화
      clearRecords: () => {
        set({ buttonRecords: [] });
      },

      // 총 클릭 수
      getTotalClicks: () => {
        return get().buttonRecords.reduce((total, record) => total + record.clickCount, 0);
      },

      // 고유 버튼 수
      getUniqueButtons: () => {
        return get().buttonRecords.length;
      }
    }),
    {
      name: "footer-store-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // 모든 데이터 persist
      partialize: (state) => ({
        buttonRecords: state.buttonRecords
      })
    }
  )
);
