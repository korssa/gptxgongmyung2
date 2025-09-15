"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AppCard } from "./app-card";
import { AppItem, AppStore } from "@/types";
import { useLanguage } from "@/hooks/use-language";
import { blockTranslationFeedback } from "@/lib/translation-utils";

interface AppGalleryProps {
  apps: AppItem[];
  viewMode: "grid" | "list";
  onDeleteApp?: (id: string) => void;
  onEditApp?: (app: AppItem) => void;
  onToggleFeatured?: (id: string) => void;
  onToggleEvent?: (id: string) => void;
  onUpdateAdminStoreUrl?: (id: string, adminStoreUrl: string) => void; // 관리자 링크 업데이트
  showNumbering?: boolean;
  onRefreshData?: () => Promise<void>; // 추가: 데이터 리로드 콜백
  onCleanData?: () => Promise<void>; // 추가: 데이터 정리 콜백
}

export function AppGallery({ apps: initialApps, viewMode, onDeleteApp, onEditApp, onToggleFeatured, onToggleEvent, onUpdateAdminStoreUrl, showNumbering = false, onRefreshData, onCleanData }: AppGalleryProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AppStore>("google-play");
  const [apps, setApps] = useState<AppItem[]>(initialApps);

  // initialApps가 변경될 때마다 업데이트
  useEffect(() => {
    setApps(initialApps);
  }, [initialApps]);

  // 부모 상태(initialApps)를 진실의 원천으로 사용
  // Blob 재로딩으로 부모 상태를 덮어쓰지 않음 (추가/삭제 직후 UI가 되돌아가는 문제 방지)
  useEffect(() => {
    // 초기/갱신 시 부모에서 전달된 상태로 동기화
    setApps(initialApps);
  }, [initialApps]);

  const googlePlayApps = apps.filter(app => app.store === "google-play");
  const appStoreApps = apps.filter(app => app.store === "app-store");

  // 활성 탭 리스트
  const activeAppsList = activeTab === "google-play" ? googlePlayApps : appStoreApps;

  // 가로 스크롤 버전에서는 페이지네이션 제거

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">📱</div>
        <h3 className="text-lg font-medium mb-2">{t("noAppsYet")}</h3>
        <p className="text-muted-foreground">
          {t("firstAppMessage")}
        </p>
      </div>
    );
  }

  const renderAppGrid = (appsToRender: AppItem[]) => {
    if (appsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-4xl mb-4">📱</div>
          <p className="text-muted-foreground">
            {activeTab === "google-play" ? "구글 플레이스토어 앱이 없습니다" :
             "앱스토어 앱이 없습니다"}
          </p>
        </div>
      );
    }

  if (viewMode === "list") {
      return (
        <div className="space-y-4">
          {appsToRender.map((app, index) => (
            <div key={app.id} className="relative">
              {showNumbering && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 event-number text-black font-bold text-2xl w-16 h-16 rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
              )}
              <AppCard 
                app={app} 
                viewMode="list" 
                onDelete={onDeleteApp}
                onEdit={onEditApp}
                onToggleFeatured={onToggleFeatured}
                onToggleEvent={onToggleEvent}
                onUpdateAdminStoreUrl={onUpdateAdminStoreUrl}
                isFeatured={app.isFeatured}
                isEvent={app.isEvent}
                onRefreshData={onRefreshData}
                onCleanData={onCleanData}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-row gap-4 overflow-x-auto py-4 px-2">
        {appsToRender.map((app, index) => (
          <div key={app.id} className="relative">
            {showNumbering && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 event-number text-black font-bold text-2xl w-16 h-16 rounded-full flex items-center justify-center">
                {index + 1}
              </div>
            )}
            <AppCard 
              app={app} 
              viewMode="mini" 
              onDelete={onDeleteApp}
              onEdit={onEditApp}
              onToggleFeatured={onToggleFeatured}
              onToggleEvent={onToggleEvent}
              onUpdateAdminStoreUrl={onUpdateAdminStoreUrl}
              isFeatured={app.isFeatured}
              isEvent={app.isEvent}
              onRefreshData={onRefreshData}
              onCleanData={onCleanData}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppStore)} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="grid grid-cols-2 w-96" style={{ backgroundColor: '#9EA5B1' }}>
          <TabsTrigger value="google-play" className="flex items-center gap-2" translate="yes" onMouseEnter={blockTranslationFeedback}>
            {t("googlePlay")} ({googlePlayApps.length})
          </TabsTrigger>
          <TabsTrigger value="app-store" className="flex items-center gap-2" translate="yes" onMouseEnter={blockTranslationFeedback}>
            {t("appStore")} ({appStoreApps.length})
          </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="google-play" className="mt-0">
          {renderAppGrid(activeAppsList)}
        </TabsContent>

        <TabsContent value="app-store" className="mt-0">
          {renderAppGrid(activeAppsList)}
        </TabsContent>
      </Tabs>

      {/* 가로 스크롤 버전: 페이지네이션/페이지 정보 제거 */}
    </div>
  );
}
