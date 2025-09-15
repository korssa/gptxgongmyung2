"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Badge 제거 - 사용하지 않음
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// Select 컴포넌트 제거 - 버튼으로 대체
import { Edit, Image as ImageIcon, X } from "lucide-react";
import { AppItem, AppFormData, AppStore, AppStatus } from "@/types";

// saveFileToLocal 제거 - 사용하지 않음
import { createURLManager, registerManager, unregisterManager } from "@/lib/url-manager";
import { blockTranslationFeedback, createAdminButtonHandler } from "@/lib/translation-utils";
// select-protection 제거 - 버튼으로 대체

// 관리자용 영어 텍스트 (번역 불필요) 
const adminTexts = {
  editApp: "Edit App",
  editDescription: "Edit app details and information.",
  store: "Store",
  status: "Status",
  googlePlay: "Google Play Store",
  appStore: "App Store",
  published: "Published", 
  inReview: "In Review",
  development: "Development",
  currentIcon: "Current Icon",
  newIcon: "New Icon (Optional)",
  selectNewIcon: "Select New Icon",
  currentScreenshots: "Current Screenshots", 
  newScreenshots: "New Screenshots (Optional)",
  selectScreenshots: "Select Screenshots",
  cancel: "Cancel",
  saveChanges: "Save Changes"
};

interface EditAppDialogProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (appId: string, data: AppFormData, files?: { icon?: File; screenshots?: File[] }) => void;
}

export function EditAppDialog({ app, isOpen, onClose, onUpdate }: EditAppDialogProps) {
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [urlManager] = useState(() => createURLManager());
  
  // URL 매니저 등록 및 정리
  useEffect(() => {
    registerManager(urlManager);
    
    return () => {
      unregisterManager(urlManager);
      urlManager.dispose();
    };
  }, [urlManager]);
  
  const [formData, setFormData] = useState<AppFormData>({
    name: "",
    developer: "",
    description: "",
    store: "google-play",
    status: "development",
    tags: "",
    rating: 4.5,
    downloads: "1K+",
    version: "1.0.0",
    size: "50MB",
    category: "",
    storeUrl: "",
  });



  // 안전한 아이콘 URL 관리
  useEffect(() => {
    // 이전 URL 정리
    if (iconUrl) {
      urlManager.revokeObjectURL(iconUrl);
      setIconUrl(null);
    }

    // 새 URL 생성
    if (iconFile && !urlManager.isDisposed()) {
      const url = urlManager.createObjectURL(iconFile);
      if (url) {
        setIconUrl(url);
      }
    }
  }, [iconFile, urlManager]);

  // 안전한 스크린샷 URLs 관리
  useEffect(() => {
    // 이전 URLs 정리
    screenshotUrls.forEach(url => {
      if (url) {
        urlManager.revokeObjectURL(url);
      }
    });
    setScreenshotUrls([]);
    
    // 새 URLs 생성
    if (screenshotFiles.length > 0 && !urlManager.isDisposed()) {
      const urls = screenshotFiles
        .map(file => urlManager.createObjectURL(file))
        .filter(url => url !== null) as string[];
      
      setScreenshotUrls(urls);
    }
  }, [screenshotFiles, urlManager]);



  // 앱 데이터로 폼 초기화
  useEffect(() => {
    if (app) {
      setFormData({
        name: app.name,
        developer: app.developer,
        description: app.description,
        store: app.store,
        status: app.status,
        tags: app.tags?.join(', ') || "",
        rating: app.rating,
        downloads: app.downloads,
        version: app.version || "1.0.0",
        size: app.size || "50MB",
        category: app.category || "",
        storeUrl: app.storeUrl || "",
      });
      setIconFile(null);
      setScreenshotFiles([]);
    }
  }, [app]);

  const handleIconSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIconFile(file);
    }
  };

  const handleScreenshotsSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setScreenshotFiles(files);
  };

  const removeScreenshot = (index: number) => {
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!app) return;

    const files: { icon?: File; screenshots?: File[] } = {};
    if (iconFile) files.icon = iconFile;
    if (screenshotFiles.length > 0) files.screenshots = screenshotFiles;

    onUpdate(app.id, formData, files);
    onClose();
  };

  const handleClose = () => {
    setIconFile(null);
    setScreenshotFiles([]);
    onClose();
  };

  if (!app) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
{adminTexts.editApp}: {app.name}
          </DialogTitle>
          <DialogDescription>
{adminTexts.editDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                앱 이름 *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="앱 이름을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                개발자 *
              </label>
              <Input
                value={formData.developer}
                onChange={(e) => setFormData(prev => ({ ...prev, developer: e.target.value }))}
                placeholder="개발자명을 입력하세요"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              설명
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="앱 설명을 입력하세요"
            />
          </div>

          {/* Store and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                             <label className="block text-sm font-medium mb-2">
                 <span className="notranslate" translate="no">{adminTexts.store}</span>
               </label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 bg-white hover:bg-gray-50 border border-gray-200"
                onClick={() => {
                  try {
                    // 번역 피드백 방지
                    blockTranslationFeedback();
                    
                    const stores: AppStore[] = ["google-play", "app-store"];
                    const currentIndex = stores.indexOf(formData.store);
                    const nextIndex = (currentIndex + 1) % stores.length;
                    const newStore = stores[nextIndex];
                    setFormData(prev => ({ ...prev, store: newStore }));
                        } catch (error) {
        // Store change error
      }
                }}
                onMouseEnter={blockTranslationFeedback}
              >
                {formData.store === "google-play" ? "🤖" : "🍎"} {" "}
                {formData.store === "google-play" ? adminTexts.googlePlay : adminTexts.appStore}
              </Button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {adminTexts.status}
              </label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-10 bg-white hover:bg-gray-50 border border-gray-200"
                onClick={() => {
                  try {
                    // 번역 피드백 방지
                    blockTranslationFeedback();
                    
                    const statuses: AppStatus[] = ["published", "in-review", "development"];
                    const currentIndex = statuses.indexOf(formData.status);
                    const nextIndex = (currentIndex + 1) % statuses.length;
                    const newStatus = statuses[nextIndex];
                    setFormData(prev => ({ ...prev, status: newStatus }));
                        } catch (error) {
        // Status change error
      }
                }}
                onMouseEnter={blockTranslationFeedback}
              >
                {formData.status === "published" && "✅ " + adminTexts.published}
                {formData.status === "in-review" && "⏳ " + adminTexts.inReview}
                {formData.status === "development" && "🚧 " + adminTexts.development}
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                평점
              </label>
              <Input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                다운로드
              </label>
              <Input
                value={formData.downloads}
                onChange={(e) => setFormData(prev => ({ ...prev, downloads: e.target.value }))}
                placeholder="1K+, 10K+, 1M+"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                버전
              </label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                크기
              </label>
              <Input
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                placeholder="50MB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                스토어 URL
              </label>
              <Input
                value={formData.storeUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, storeUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Current App Icon */}
          <div>
            <label className="block text-sm font-medium mb-2">
{adminTexts.currentIcon}
            </label>
            <div className="flex items-center gap-4 mb-2">
              <img
                src={app.iconUrl}
                alt="Current icon"
                className="w-16 h-16 rounded-lg object-cover border"
              />
              <div className="text-sm text-muted-foreground">
Select a new icon below to upload
              </div>
            </div>
          </div>

          {/* New App Icon */}
          <div>
            <label className="block text-sm font-medium mb-2">
{adminTexts.newIcon}
            </label>
            <label
              htmlFor="icon-upload"
              className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {iconFile && iconUrl ? (
                <div className="flex items-center gap-2">
                  <img
                    src={iconUrl}
                    alt="New icon preview"
                    className="w-12 h-12 rounded object-cover"
                  />
                  <span className="text-sm">{iconFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon className="w-6 h-6 mb-1 text-gray-400" />
                  <p className="text-sm text-gray-500">{adminTexts.selectNewIcon}</p>
                </div>
              )}
              <input
                id="icon-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIconSelect}
              />
            </label>
          </div>

          {/* Current Screenshots */}
          {app.screenshotUrls && app.screenshotUrls.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
{adminTexts.currentScreenshots}
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {app.screenshotUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Current screenshot ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* New Screenshots */}
          <div>
            <label className="block text-sm font-medium mb-2">
{adminTexts.newScreenshots}
            </label>
            <label
              htmlFor="screenshots-upload"
              className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center">
                <ImageIcon className="w-6 h-6 mb-1 text-gray-400" />
                <p className="text-sm text-gray-500">{adminTexts.selectScreenshots}</p>
              </div>
              <input
                id="screenshots-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleScreenshotsSelect}
              />
            </label>

            {screenshotFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {screenshotFiles.map((file, index) => (
                  screenshotUrls[index] ? (
                    <div key={index} className="relative group">
                      <img
                        src={screenshotUrls[index]}
                        alt={`New screenshot ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeScreenshot(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              태그
            </label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="태그를 쉼표로 구분하여 입력하세요"
            />
            <p className="text-xs text-gray-500 mt-1">
              예: 생산성, 유틸리티, 게임
            </p>
          </div>
        </div>

        <DialogFooter onMouseEnter={blockTranslationFeedback}>
          <Button 
            variant="outline" 
            onClick={createAdminButtonHandler(handleClose)}
            onMouseEnter={blockTranslationFeedback}
          >
{adminTexts.cancel}
          </Button>
          <Button 
            onClick={createAdminButtonHandler(handleSubmit)} 
            disabled={!formData.name.trim() || !formData.developer.trim()}
            onMouseEnter={blockTranslationFeedback}
          >
{adminTexts.saveChanges}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
