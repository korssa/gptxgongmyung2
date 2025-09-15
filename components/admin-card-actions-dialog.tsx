"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Heart, Star, Edit, Trash2, Save, Link } from "lucide-react";
import { AppItem } from "@/types";
import React, { useState, useEffect } from "react";
import { blockTranslationFeedback } from "@/lib/translation-utils";


interface AdminCardActionsDialogProps {
  app: AppItem;
  isOpen: boolean;
  onClose: () => void;
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

export function AdminCardActionsDialog({
  app,
  isOpen,
  onClose,
  onDelete,
  onEdit,
  onToggleFeatured,
  onToggleEvent,
  onUpdateAdminStoreUrl,
  isFeatured = false,
  isEvent = false,
  onRefreshData,
  onCleanData
}: AdminCardActionsDialogProps) {
  const [localFeatured, setLocalFeatured] = useState(isFeatured);
  const [localEvent, setLocalEvent] = useState(isEvent);
  const [localAdminStoreUrl, setLocalAdminStoreUrl] = useState(app.adminStoreUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  // props가 변경될 때마다 로컬 상태 동기화
  useEffect(() => {
    setLocalFeatured(isFeatured);
    setLocalEvent(isEvent);
    setLocalAdminStoreUrl(app.adminStoreUrl || '');
  }, [isFeatured, isEvent, app.adminStoreUrl]);

  // 로컬 상태 동기화 - 현재 상태와 반대로 토글
  const handleToggleFeatured = () => {
    setLocalFeatured(!localFeatured);
  };

  const handleToggleEvent = () => {
    setLocalEvent(!localEvent);
  };

  // 저장 버튼 클릭 시 트리거 실행 (최적화된 버전)
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      let hasChanges = false;
      
      // Featured 상태 변경이 있는 경우
      if (localFeatured !== isFeatured && onToggleFeatured) {
        await onToggleFeatured(app.id);
        hasChanges = true;
      }
      
      // Event 상태 변경이 있는 경우
      if (localEvent !== isEvent && onToggleEvent) {
        await onToggleEvent(app.id);
        hasChanges = true;
      }
      
      // 관리자 링크 변경이 있는 경우
      if (localAdminStoreUrl !== (app.adminStoreUrl || '') && onUpdateAdminStoreUrl) {
        await onUpdateAdminStoreUrl(app.id, localAdminStoreUrl);
        hasChanges = true;
      }
      
      // 변경사항이 있는 경우에만 처리 (중복 호출 제거)
      if (hasChanges) {
        // 성공 알림
        alert('변경사항이 성공적으로 저장되었습니다.');
        
        // 다이얼로그 닫기
        onClose();
      } else {
        // 변경사항이 없으면 그냥 닫기
        onClose();
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 편집 버튼 클릭
  const handleEdit = () => {
    if (onEdit) {
      onEdit(app);
      onClose();
    }
  };

  // 삭제 버튼 클릭
  const handleDelete = async () => {
    if (onDelete && confirm(`"${app.name}"을(를) 삭제하시겠습니까?`)) {
      try {
        // 삭제 실행
        onDelete(app.id);
        
        // 성공 알러트
        alert(`"${app.name}"이(가) 성공적으로 삭제되었습니다.`);
        
        // 다이얼로그 닫기
        onClose();
      } catch (error) {
        // 실패 알러트
        alert(`"${app.name}" 삭제 중 오류가 발생했습니다.`);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" onMouseEnter={blockTranslationFeedback}>
            <span>관리자 모드 - {app.name}</span>
            <Badge variant="secondary">{app.status}</Badge>
          </DialogTitle>
          <DialogDescription onMouseEnter={blockTranslationFeedback}>
            앱의 Featured 및 Event 상태를 관리하고 편집/삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 앱 정보 표시 */}
          <div className="p-4 bg-gray-50 rounded-lg" onMouseEnter={blockTranslationFeedback}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                📱
              </div>
              <div>
                <h3 className="font-semibold">{app.name}</h3>
                <p className="text-sm text-gray-600">{app.developer}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{app.description}</p>
          </div>

          {/* 상태 토글 버튼들 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={localFeatured ? "destructive" : "secondary"}
              onClick={handleToggleFeatured}
              className={`h-12 flex flex-col items-center gap-1 ${localFeatured ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'}`}
              onMouseEnter={blockTranslationFeedback}
            >
              <Heart className={`h-5 w-5 ${localFeatured ? 'fill-current text-white' : ''}`} />
              <span className="text-xs text-white">
                {localFeatured ? 'Featured 해제' : 'Featured 설정'}
              </span>
            </Button>
            
            <Button
              variant={localEvent ? "destructive" : "secondary"}
              onClick={handleToggleEvent}
              className={`h-12 flex flex-col items-center gap-1 ${localEvent ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-500 hover:bg-gray-600'}`}
              onMouseEnter={blockTranslationFeedback}
            >
              <Star className={`h-5 w-5 ${localEvent ? 'fill-current text-white' : ''}`} />
              <span className="text-xs text-white">
                {localEvent ? 'Event 해제' : 'Event 설정'}
              </span>
            </Button>
          </div>

          {/* Events 앱용 관리자 링크 입력 필드 */}
          {localEvent && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2" onMouseEnter={blockTranslationFeedback}>
                <Link className="h-4 w-4" />
                관리자 전용 See App 링크 (Events 앱용)
              </label>
              <Input
                type="url"
                value={localAdminStoreUrl}
                onChange={(e) => setLocalAdminStoreUrl(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
                className="text-sm notranslate"
                translate="no"
                onMouseEnter={blockTranslationFeedback}
              />
              <p className="text-xs text-gray-500" onMouseEnter={blockTranslationFeedback}>
                이 링크는 관리자만 볼 수 있으며, Events 앱의 &ldquo;See App&rdquo; 버튼에 사용됩니다.
              </p>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1"
              onMouseEnter={blockTranslationFeedback}
            >
              <Edit className="h-4 w-4 mr-2" />
              편집
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              onMouseEnter={blockTranslationFeedback}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </div>

          {/* 저장 버튼 */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-700"
            onMouseEnter={blockTranslationFeedback}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? '저장 중...' : '변경사항 저장'}
          </Button>

          {/* 데이터 정리 버튼 (개발 모드에서만) */}
          {process.env.NODE_ENV !== 'production' && onCleanData && (
            <Button
              onClick={onCleanData}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
              onMouseEnter={blockTranslationFeedback}
            >
              🧹 앱 데이터 정리 (불린 플래그 제거)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
