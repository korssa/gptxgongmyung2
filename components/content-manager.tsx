"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye, ArrowLeft } from "lucide-react";
import { ContentItem, ContentType } from "@/types";
import { uploadFile } from "@/lib/storage-adapter";
import { blockTranslationFeedback, createAdminButtonHandler } from "@/lib/translation-utils";

interface ContentManagerProps {
  type: ContentType;
  title: string;
  description: string;
  onBack?: () => void;
  initialContent?: ContentItem; // ✅ 세부 뷰 바로 진입용
}

export function ContentManager({
  type,
  title,
  description,
  onBack,
  initialContent,
}: ContentManagerProps) {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    initialContent || null
  );
  const [likes, setLikes] = useState<{ [key: string]: number }>({});



  // 콘텐츠 목록 로드
  const loadContents = async () => {
    try {
      const response = await fetch(`/api/content?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        setContents(data.filter((c: ContentItem) => c.isPublished));
      }
    } catch (error) {
      // 콘텐츠 로드 실패
    }
  };

  useEffect(() => {
    loadContents();

    // 좋아요 정보 로드
    const savedLikes = localStorage.getItem(`content-likes-${type}`);
    if (savedLikes) {
      setLikes(JSON.parse(savedLikes));
    }

    // 번역 피드백 차단 함수
    const blockTranslationFeedback = () => {
      try {
        const selectors = [
          '[class*="goog-"]',
          '[id*="goog-"]',
        ];
        selectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            Object.assign((el as HTMLElement).style, {
              display: 'none',
              visibility: 'hidden',
              opacity: '0',
              pointerEvents: 'none',
              position: 'absolute',
              zIndex: '-9999',
              left: '-9999px',
              top: '-9999px',
            });
          });
        });
      } catch {
        // 에러 무시
      }
    };

    // DOM 변화 감지 후 제거
    const observer = new MutationObserver(() => blockTranslationFeedback());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // 최초 실행
    blockTranslationFeedback();

    return () => observer.disconnect();
  }, [type]);

  // 좋아요 핸들러
  const handleLike = (id: string) => {
    setLikes((prev) => {
      const updated = {
        ...prev,
        [id]: (prev[id] || 0) + 1,
      };
      localStorage.setItem(
        `content-likes-${type}`,
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  // ✅ 세부 뷰 먼저 보여주는 경우
  if (selectedContent) {
    return (
      <div className="space-y-6">
        {/* ← Back 버튼 */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedContent(null)}
            className="bg-[#2e2e2e] text-white hover:bg-[#444] border border-gray-700 hover:border-gray-500 transition"
            onMouseEnter={blockTranslationFeedback}
          >
            <span className="notranslate" translate="no">← Back to Homepage</span>
          </Button>
        </div>

                 {/* 콘텐츠 뷰 */}
         <div className="w-full max-w-2xl mx-auto px-8 sm:px-12 lg:px-16" style={{ maxWidth: '672px' }}>
           {/* 헤더 */}
           <div className="border-b border-gray-600 pb-4 mb-6" onMouseEnter={blockTranslationFeedback}>
                          <h1 className="text-3xl font-bold text-white mb-2" translate="no">{selectedContent.title}</h1>
             <div className="flex items-center gap-4 text-gray-400 text-sm">
                              <span className="flex items-center gap-1"><User className="h-4 w-4" /><span translate="no">{selectedContent.author}</span></span>
               <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(selectedContent.publishDate).toLocaleDateString()}</span>
               
               {!selectedContent.isPublished && (
                 <Badge variant="secondary" className="text-xs">임시저장</Badge>
               )}
             </div>
           </div>

          {/* 이미지 */}
          {selectedContent.imageUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={selectedContent.imageUrl}
                alt={selectedContent.title}
                className="w-full max-h-[32rem] object-contain rounded-lg border border-gray-600"
              />
            </div>
          )}

                     {/* 본문 */}
           <article className="prose prose-invert dark:prose-invert" onMouseEnter={blockTranslationFeedback}>
             <pre
               className="text-gray-300 whitespace-pre-wrap leading-relaxed max-w-none font-mono"
               style={{ wordWrap: "break-word" }}
             >
               {selectedContent.content}
             </pre>
           </article>

                     {/* 태그 */}
           {selectedContent.tags && selectedContent.tags.length > 0 && (
             <div className="flex flex-wrap gap-1 mb-2 mt-6" onMouseEnter={blockTranslationFeedback}>
               {selectedContent.tags.map((tag, idx) => (
                 <span key={idx} className="text-xs px-2 py-0 rounded" style={{ backgroundColor: '#fff', color: '#000' }}>
                   {tag}
                 </span>
               ))}
             </div>
           )}

                     {/* 좋아요 */}
           <div className="flex justify-start mt-6 pt-6 border-t border-gray-600" onMouseEnter={blockTranslationFeedback}>
             <button
               onClick={() => handleLike(selectedContent.id)}
               className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 group"
             >
               <span className="text-2xl group-hover:scale-110 transition-transform">👍</span>
               <span className="text-sm font-medium">{likes[selectedContent.id] || 0}</span>
             </button>
           </div>
        </div>
      </div>
    );
  }

  // ✅ 기본 목록 뷰
  return (
    <div className="space-y-6">
      {/* 제목 및 설명 */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-400">{description}</p>
        </div>
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500 border-2 border-yellow-400 hover:border-yellow-300 transition-all duration-200 font-bold shadow-lg hover:shadow-yellow-400/25"
            onMouseEnter={blockTranslationFeedback}
          >
            <span className="notranslate" translate="no">🏠 HOME</span>
          </Button>
        )}
      </div>

      {/* 카드 리스트 */}
      <div className="grid gap-4">
        {contents.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center text-gray-400">
              아직 작성된 {type === "appstory" ? "스토리" : "뉴스"}가 없습니다.
            </CardContent>
          </Card>
        ) : (
                     contents.map((content) => (
             <Card
               key={content.id}
               className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
               onClick={() => setSelectedContent(content)}
               onMouseEnter={blockTranslationFeedback}
             >
              <CardHeader>
                <CardTitle className="text-white" translate="no">{content.title}</CardTitle>
                <CardDescription className="text-gray-400 flex items-center gap-4 mt-2">
                                     <span className="flex items-center gap-1"><User className="h-3 w-3" /><span translate="no">{content.author}</span></span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(content.publishDate).toLocaleDateString()}</span>
                  
                </CardDescription>
              </CardHeader>
              <CardContent>
                {content.imageUrl && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={content.imageUrl}
                      alt={content.title}
                      className="w-1/4 rounded-lg object-contain"
                    />
                  </div>
                )}
                                 <pre className="text-gray-300 whitespace-pre-wrap font-mono">
                   {content.content}
                 </pre>
                {content.tags && content.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {content.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-0 rounded" style={{ backgroundColor: '#fff', color: '#000' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
