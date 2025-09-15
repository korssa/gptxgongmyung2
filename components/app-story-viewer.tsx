"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Eye, ArrowLeft } from "lucide-react";
import { ContentItem, ContentType } from "@/types";

interface AppStoryViewerProps {
  onBack?: () => void;
}

export function AppStoryViewer({ onBack }: AppStoryViewerProps) {
  const [stories, setStories] = useState<ContentItem[]>([]);
  const [selectedStory, setSelectedStory] = useState<ContentItem | null>(null);
  const [likes, setLikes] = useState<{ [key: string]: number }>({});

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

  // 스토리 로드
  const loadStories = async () => {
    try {
      const response = await fetch(`/api/content?type=appstory`);
      if (response.ok) {
        const data = await response.json();
        setStories(data.filter((story: ContentItem) => story.isPublished));
      }
    } catch (error) {
      // 스토리 로드 오류
    }
  };

  useEffect(() => {
    loadStories();
    // 좋아요 데이터 로드
    const savedLikes = localStorage.getItem('app-story-likes');
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
  }, []);

  // 좋아요 핸들러
  const handleLike = (storyId: string) => {
    setLikes(prev => {
      const newLikes = {
        ...prev,
        [storyId]: (prev[storyId] || 0) + 1
      };
      localStorage.setItem('app-story-likes', JSON.stringify(newLikes));
      return newLikes;
    });
  };

  // 스토리 상세 뷰
  if (selectedStory) {
    return (
      <div className="space-y-6">
        {/* 뒤로가기 버튼 */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedStory(null)}
            className="bg-[#2e2e2e] text-white hover:bg-[#444] border border-gray-700 hover:border-gray-500 transition"
            onMouseEnter={blockTranslationFeedback}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="notranslate" translate="no">Back to Stories</span>
          </Button>
        </div>

        {/* 스토리 상세 내용 - 672px 고정 너비 */}
        <div className="w-full max-w-2xl mx-auto px-8 sm:px-12 lg:px-16" style={{ maxWidth: '672px' }}>
                     {/* 헤더 */}
           <div className="border-b border-gray-600 pb-4 mb-6" onMouseEnter={blockTranslationFeedback}>
             <h1 className="text-3xl font-bold text-white mb-2" translate="no">{selectedStory.title}</h1>
             <div className="flex items-center gap-4 text-gray-400 text-sm">
               <span className="flex items-center gap-1">
                 <User className="h-4 w-4" />
                 <span translate="no">{selectedStory.author}</span>
               </span>
               <span className="flex items-center gap-1">
                 <Calendar className="h-4 w-4" />
                 {new Date(selectedStory.publishDate).toLocaleDateString()}
               </span>

             </div>
           </div>

          {/* 이미지 */}
          {selectedStory.imageUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={selectedStory.imageUrl}
                alt={selectedStory.title}
                className="w-full max-h-[32rem] object-contain rounded-lg border border-gray-600"
              />
            </div>
          )}

                                           {/* 내용 */}
            <article className="prose prose-invert dark:prose-invert" onMouseEnter={blockTranslationFeedback}>
              <pre 
                className="text-gray-300 whitespace-pre-wrap leading-relaxed max-w-none font-mono"
                style={{ maxWidth: '100%', wordWrap: 'break-word' }}
              >
                {selectedStory.content}
              </pre>
            </article>

                     {/* 태그 */}
           {selectedStory.tags && selectedStory.tags.length > 0 && (
             <div className="flex flex-wrap gap-1 mb-2 mt-4" onMouseEnter={blockTranslationFeedback}>
               {selectedStory.tags.map((tag, index) => (
                 <span
                   key={index}
                   className="text-xs px-2 py-0 rounded"
                   style={{ backgroundColor: '#ffffff', color: '#000000' }}
                 >
                   {tag}
                 </span>
               ))}
             </div>
           )}

                     {/* 좋아요 버튼 */}
           <div className="flex justify-start mt-6 pt-6 border-t border-gray-600" onMouseEnter={blockTranslationFeedback}>
             <button
               onClick={() => handleLike(selectedStory.id)}
               className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 group"
             >
               <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                 👍
               </span>
               <span className="text-sm font-medium">
                 {likes[selectedStory.id] || 0}
               </span>
             </button>
           </div>
        </div>
      </div>
    );
  }

  // 스토리 목록 뷰
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">App Story</h2>
          <p className="text-gray-400">앱 개발 과정과 스토리를 확인하세요</p>
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

      {/* 스토리 목록 */}
      <div className="grid gap-4">
        {stories.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">아직 작성된 스토리가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
                     stories.map((story) => (
             <Card 
               key={story.id} 
               className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
               onClick={() => setSelectedStory(story)}
               onMouseEnter={blockTranslationFeedback}
             >
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2" translate="no">
                  {story.title}
                </CardTitle>
                <CardDescription className="text-gray-400 flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span translate="no">{story.author}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(story.publishDate).toLocaleDateString()}
                  </span>
                  
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 썸네일 이미지 */}
                {story.imageUrl && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-1/4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </div>
                )}
                
                                                  {/* 내용 미리보기 */}
                  <div className="prose prose-invert max-w-none">
                    <pre 
                      className="text-gray-300 line-clamp-3 font-mono whitespace-pre-wrap"
                    >
                      {story.content.substring(0, 200) + (story.content.length > 200 ? '...' : '')}
                    </pre>
                  </div>

                {/* 태그 */}
                {story.tags && story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {story.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0 rounded"
                        style={{ backgroundColor: '#ffffff', color: '#000000' }}
                      >
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
