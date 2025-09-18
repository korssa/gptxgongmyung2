"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Download } from "lucide-react";
import { useState } from "react";
import { AppItem } from "@/types";
import { useLanguage } from "@/hooks/use-language";
import { useAdmin } from "@/hooks/use-admin";
import { blockTranslationFeedback } from "@/lib/translation-utils";
import { AdminCardActionsDialog } from "./admin-card-actions-dialog";
import Image from "next/image";

interface AppCardProps {
  app: AppItem;
  viewMode: "grid" | "list" | "mini";
  onDelete?: (id: string) => void;
  onEdit?: (app: AppItem) => void;
  onToggleFeatured?: (id: string) => void;
  onToggleEvent?: (id: string) => void;
  onUpdateAdminStoreUrl?: (id: string, adminStoreUrl: string) => void; // 관리자 링크 업데이트
  isFeatured?: boolean;
  isEvent?: boolean;
  onRefreshData?: () => Promise<void>; // 추가: 데이터 리로드 콜백
  onCleanData?: () => Promise<void>; // 추가: 데이터 정리 콜백
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "bg-green-500";
    case "in-review":
      return "bg-yellow-500";
    case "development":
      return "bg-blue-500";
    default:
      return "bg-gray-500";
  }
};

export function AppCard({ app, viewMode, onDelete, onEdit, onToggleFeatured, onToggleEvent, onUpdateAdminStoreUrl, isFeatured = false, isEvent = false, onRefreshData, onCleanData }: AppCardProps) {
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const { t } = useLanguage();
  const { isAuthenticated } = useAdmin();

  const isBlobUrl = (url?: string) => {
    return !!url && (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com'));
  };

  const handleStoreView = () => {
    // Events 앱이면 memo2로 이동, 아니면 기존 로직 사용
    if (isEvent) {
      // 모든 이벤트 카드는 memo2로 연결
      window.location.href = '/memo2';
    } else {
      // 일반 앱은 기존 로직 사용
      const urlToUse = app.storeUrl;
      if (urlToUse) {
        window.open(urlToUse, '_blank');
      }
    }
  };

  // 버튼 텍스트 결정 함수
  const getButtonText = () => {
    if (app.status === "published") {
      return "Download";
    }
    if (isEvent) {
      return "📝 Memo 2";
    }
    return "Download";
  };
  // Mini view: compact horizontal card for scrollers
  if (viewMode === "mini") {
    return (
      <>
        <Card
          className="w-[150px] sm:w-[170px] aspect-[3/4] flex-shrink-0 p-2 shadow group overflow-hidden bg-black sm:bg-[#D1E2EA] text-white sm:text-black"
          onMouseEnter={blockTranslationFeedback}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-center">
              <Image
                src={app.iconUrl}
                alt={app.name}
                width={72}
                height={72}
                unoptimized={isBlobUrl(app.iconUrl)}
                className="rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmM2Y0ZjYiLz48cGF0aCBkPSJNMzkgMjhDMzQuNzggMjggMzEgMzEuNzggMzEgMzZDMzEgNDAuMjIgMzQuNzggNDQgMzkgNDRDNDUuNjYgNDQgNTEgMzguNjYgNTEgMzJDNTEgMjUuMzQgNDUuNjYgMjAgMzkgMjBaIiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+";
                }}
              />
            </div>
            <h3 className="text-xs sm:text-xl font-bold text-center mt-2 truncate notranslate app-name-fixed text-sky-400" translate="no">{app.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground text-center truncate notranslate app-developer-fixed" translate="no">{app.developer}</p>
            <div className="mt-auto flex flex-col items-center gap-1">
              {app.status === "published" ? (
                <Button
                  size="sm"
                  className="w-[90%] h-7 mt-2 text-[12px] sm:text-xs bg-green-700 hover:bg-green-800 text-white flex items-center justify-center gap-1 mx-auto"
                  onClick={handleStoreView}
                >
                  <Download className="h-3 w-3" />
                  {getButtonText()}
                </Button>
              ) : (
                <Button size="sm" className="w-[90%] h-7 mt-2 text-[12px] sm:text-xs bg-gray-500 text-white mx-auto" disabled>
                  Coming soon
                </Button>
              )}
              {/* 스토어 뱃지 중앙 정렬 */}
              <div className="flex justify-center w-full mt-1">
                <Image
                  src={app.store === "google-play" ? "/google-play-badge.png" : "/app-store-badge.png"}
                  alt="스토어 배지"
                  width={100}
                  height={28}
                  className="h-7 object-contain mx-auto"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 관리자 모드 다이얼로그 */}
        <AdminCardActionsDialog
          app={app}
          isOpen={isAdminDialogOpen}
          onClose={() => setIsAdminDialogOpen(false)}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleFeatured={onToggleFeatured}
          onToggleEvent={onToggleEvent}
          onUpdateAdminStoreUrl={onUpdateAdminStoreUrl}
          isFeatured={isFeatured}
          isEvent={isEvent}
          onRefreshData={onRefreshData}
          onCleanData={onCleanData}
        />
      </>
    );
  }


  // 호버 심볼 클릭 시 관리자 다이얼로그 열기
  const handleAdminActions = () => {
    setIsAdminDialogOpen(true);
  };

  if (viewMode === "list") {
    return (
      <>
        <Card
          className="flex flex-row overflow-hidden hover:shadow-lg transition-shadow bg-black sm:bg-[#D1E2EA] text-white sm:text-black"
          onMouseEnter={blockTranslationFeedback}
        >
          {/* App Icon */}
          <div className="w-24 h-24 flex-shrink-0 p-3">
            <Image
              src={app.iconUrl}
              alt={app.name}
              width={96}
              height={96}
              unoptimized={isBlobUrl(app.iconUrl)}
              className="w-full h-full object-cover object-center rounded-xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiA2QzEwLjM0IDYgOSA3LjM0IDkgOUM5IDEwLjY2IDEwLjM0IDEyIDEyIDEyQzEzLjY2IDEyIDE1IDEwLjY2IDE1IDlDMTUgNy4zNCAxMy42NiA2IDEyIDZaTTEyIDRDMTQuNzYgNCAxNyA2LjI0IDE3IDlDMTcgMTEuNzYgMTQuNzYgMTQgMTIgMTRNOS4yNCAxNCA3IDExLjc2IDcgOUM3IDYuMjQgOS4yNCA0IDEyIDRaTTEyIDE2QzEwLjM0IDE2IDkgMTcuMzQgOSAxOUg3QzcgMTYuMjQgOS4yNCAxNCAxMiAxNEMxNC43NiAxNCAxNyAxNi4yNCAxNyAxOUgxNUMxNSAxNy4zNCAxMy42NiAxNiAxMiAxNloiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+";
              }}
            />
          </div>

          <CardContent className="flex-1 px-2 py-0 bg-black sm:bg-[#D1E2EA] text-white sm:text-black">
            <div className="flex justify-between items-start h-full">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-xs sm:text-lg notranslate app-name-fixed text-sky-400" translate="no">{app.name}</h3>
                  {/* 상태/스토어 배지 */}
                  <Badge className={`text-xs ${getStatusColor(app.status)} text-white`}>
                    {app.status}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  {t("author")}: <span className="notranslate app-developer-fixed" translate="no">{app.developer}</span>
                </p>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {app.description}
                </p>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{app.rating}</span>
                  </div>
                  <span>{app.downloads}</span>
                  <span>{app.version}</span>
                  <span>{app.uploadDate?.includes('T') ? app.uploadDate.split('T')[0] : app.uploadDate}</span>
                </div>

                {app.tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {app.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 관리자 모드에서만 관리자 액션 버튼 표시 */}
              {isAuthenticated && (
                <div className="flex flex-col items-end space-y-2 ml-4" onMouseEnter={blockTranslationFeedback}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAdminActions}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    title="관리자 모드 열기"
                    onMouseEnter={blockTranslationFeedback}
                  >
                    ⚙️ 관리자 모드
                  </Button>
                </div>
              )}
            </div>
          </CardContent>

          <div className="w-full bg-[#84CC9A] border-t border-gray-300 px-4 py-3">
            {/* 하단 2줄 - 다운로드 버튼 */}
            <div className="flex flex-col items-start space-y-2">
              <div className="w-full">
                {app.status === "published" ? (
                  <Button
                    size="sm"
                    className="h-8 px-4 text-sm bg-green-700 hover:bg-green-800 text-white flex items-center gap-1 whitespace-nowrap min-w-[140px] justify-start"
                    onClick={handleStoreView}
                  >
                    <Download className="h-4 w-4" />
                    {getButtonText()}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-8 px-4 text-sm bg-gray-500 text-white flex items-center gap-1 min-w-[140px] justify-start"
                    disabled
                  >
                    Coming soon
                  </Button>
                )}
              </div>

              {/* 하단 1줄 - 스토어 배지 */}
              <div className="h-9">
                <Image
                  src={app.store === "google-play" ? "/google-play-badge.png" : "/app-store-badge.png"}
                  alt="스토어 배지"
                  width={120}
                  height={28}
                  className="h-9 object-contain"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 관리자 모드 다이얼로그 */}
        <AdminCardActionsDialog
          app={app}
          isOpen={isAdminDialogOpen}
          onClose={() => setIsAdminDialogOpen(false)}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggleFeatured={onToggleFeatured}
          onToggleEvent={onToggleEvent}
          onUpdateAdminStoreUrl={onUpdateAdminStoreUrl}
          isFeatured={isFeatured}
          isEvent={isEvent}
          onRefreshData={onRefreshData}
          onCleanData={onCleanData}
        />
      </>
    );
  }

  return (
    <>
      <Card
        className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 w-[220px] sm:w-[256px] md:w-[280px] lg:w-[320px] flex-none bg-black sm:bg-[#D1E2EA] text-white sm:text-black"
        onMouseEnter={blockTranslationFeedback}
      >
        <div className="relative">
          {/* Screenshot/App Preview (match New Release: fixed 310x310 box) */}
          <div className="relative pt-1">
            <div className="mx-auto w-[206px] h-[206px] sm:w-[240px] sm:h-[240px] md:w-[280px] md:h-[280px] lg:w-[310px] lg:h-[310px] rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 p-[3px]">
              <div className="relative w-full h-full overflow-hidden rounded-lg">
                {app.screenshotUrls && app.screenshotUrls.length > 0 ? (
                  <Image
                    src={app.screenshotUrls[0]}
                    alt={app.name}
                    fill
                    unoptimized={isBlobUrl(app.screenshotUrls?.[0])}
                    className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center text-6xl">
                    📱
                  </div>
                )}
                <div className="absolute bottom-1 left-1">
                  <Badge className={`${getStatusColor(app.status)} text-white text-xs`}>
                    {app.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions Button - 호버 시 표시 */}
          {isAuthenticated && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" onMouseEnter={blockTranslationFeedback}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAdminActions}
                className="h-8 w-8 p-0 shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
                title="관리자 모드 열기"
                onMouseEnter={blockTranslationFeedback}
              >
                ⚙️
              </Button>
            </div>
          )}
        </div>

  <div className="mx-auto w-[206px] sm:w-[240px] md:w-[280px] lg:w-[310px]">
  <CardContent className="p-[6px] bg-black sm:bg-[#D1E2EA] text-white sm:text-black">
          {/* App Icon and Basic Info */}
          <div className="flex items-start space-x-4 mb-2">
            <Image
              src={app.iconUrl}
              alt={app.name}
              width={54}
              height={54}
              className="w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px] rounded-xl object-cover object-center flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiA2QzEwLjM0IDYgOSA3LjM0IDkgOUM5IDEwLjY2IDEwLjM0IDEyIDEyIDEyQzEzLjY2IDEyIDE1IDEwLjY2IDE1IDlDMTUgNy4zNCAxMy42NiA2IDEyIDZaTTEyIDRDMTQuNzYgNCAxNyA2LjI0IDE3IDlDMTcgMTEuNzYgMTQuNzYgMTQgMTIgMTRNOS4yNCAxNCA3IDExLjc2IDcgOUM3IDYuMjQgOS4yNCA0IDEyIDRaTTEyIDE2QzEwLjM0IDE2IDkgMTcuMzQgOSAxOUg3QzcgMTYuMjQgOS4yNCAxNCAxMiAxNEMxNC43NiAxNCAxNyAxNi4yNCAxNyAxOUgxNUMxNSAxNy4zNCAxMy42NiAxNiAxMiAxNloiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+";
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs sm:text-xl md:text-xl mb-1 truncate notranslate app-name-fixed text-sky-400" translate="no">{app.name}</h3>
              <p className="text-sm sm:text-base md:text-base text-muted-foreground truncate notranslate app-developer-fixed" translate="no">{app.developer}</p>
            </div>
          </div>

          {/* Rating and Stats */}
          <div className="flex items-center justify-between text-base text-muted-foreground mb-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{app.rating}</span>
              </div>
              <span>{app.downloads}</span>
            </div>
            <span>{app.version}</span>
          </div>

          {/* Tags */}
          {app.tags && app.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {app.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-base px-3 py-1">
                  {tag}
                </Badge>
              ))}
              {app.tags.length > 2 && (
                <span className="text-base text-muted-foreground">
                  +{app.tags.length - 2}
                </span>
              )}
            </div>
          )}
  </CardContent>

        {/* Download Section - align with New Release */}
  <div className="w-full bg-[#84CC9A] border-t border-gray-300 px-2 py-1.5">
          <div className="flex flex-col items-start sm:items-center space-y-0 sm:space-y-1">
            {/* 하단 2줄 - 다운로드 버튼 */}
            <div className="w-full sm:w-auto">
              {app.status === "published" ? (
                <Button
                  size="sm"
                  className="h-9 px-5 text-base sm:h-6 sm:px-3 sm:text-sm bg-green-700 hover:bg-green-800 text-white flex items-center gap-1 whitespace-nowrap min-w-[140px] sm:min-w-[120px] justify-start"
                  onClick={handleStoreView}
                >
                  <Download className="h-4 w-4" />
                  {getButtonText()}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-9 px-5 text-base sm:h-6 sm:px-3 sm:text-sm bg-gray-500 text-white flex items-center gap-1 min-w-[140px] sm:min-w-[120px] justify-start"
                  disabled
                >
                  Coming soon
                </Button>
              )}
            </div>

            {/* 하단 1줄 - 스토어 배지 */}
            <div className="h-10 sm:h-6">
              <Image
                src={app.store === "google-play" ? "/google-play-badge.png" : "/app-store-badge.png"}
                alt="스토어 배지"
                width={140}
                height={32}
                className="h-10 sm:h-6 object-contain"
              />
            </div>
          </div>
        </div>
        </div>
      </Card>

      {/* 관리자 모드 다이얼로그 */}
      <AdminCardActionsDialog
        app={app}
        isOpen={isAdminDialogOpen}
        onClose={() => setIsAdminDialogOpen(false)}
        onDelete={onDelete}
        onEdit={onEdit}
        onToggleFeatured={onToggleFeatured}
        onToggleEvent={onToggleEvent}
        onUpdateAdminStoreUrl={onUpdateAdminStoreUrl}
        isFeatured={isFeatured}
        isEvent={isEvent}
        onRefreshData={onRefreshData}
        onCleanData={onCleanData}
      />
    </>
  );
}
