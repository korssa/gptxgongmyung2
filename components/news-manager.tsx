"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, User, FileText, ArrowLeft } from "lucide-react";
import { ContentItem, ContentFormData, ContentType } from "@/types";
import { useAdmin } from "@/hooks/use-admin";
import { uploadFile } from "@/lib/storage-adapter";
import { blockTranslationFeedback, createAdminButtonHandler } from "@/lib/translation-utils";

interface NewsManagerProps {
  onBack?: () => void;
}

export function NewsManager({ onBack }: NewsManagerProps) {
  const [news, setNews] = useState<ContentItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<ContentItem | null>(null);
  const [selectedNews, setSelectedNews] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState<ContentFormData>({
    title: "",
    content: "",
    author: "",
    type: 'news' as ContentType,
    tags: "",
    isPublished: true, // 기본값을 true로 설정하여 게시되도록 함
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [likes, setLikes] = useState<{ [key: string]: number }>({});

  const { isAuthenticated } = useAdmin();



  // 뉴스 로드
  const loadNews = async () => {
    try {
      const response = await fetch(`/api/content?type=news`);
      if (response.ok) {
        const data = await response.json();
        // 관리자일 경우 전체 뉴스, 일반 사용자는 게시된 뉴스만 표시
        setNews(isAuthenticated ? data : data.filter((c: ContentItem) => c.isPublished));
      }
    } catch {
      
    }
  };

  useEffect(() => {
    loadNews();
    // 좋아요 데이터 로드
    const savedLikes = localStorage.getItem('news-likes');
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

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author: "",
      type: 'news' as ContentType,
      tags: "",
      isPublished: true, // 기본값을 true로 설정
    });
    setEditingNews(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 이미지 선택 핸들러
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // 좋아요 핸들러
  const handleLike = (newsId: string) => {
    setLikes(prev => {
      const newLikes = {
        ...prev,
        [newsId]: (prev[newsId] || 0) + 1
      };
      localStorage.setItem('news-likes', JSON.stringify(newLikes));
      return newLikes;
    });
  };

  // 뉴스 저장
  const handleSubmit = async () => {
    try {
      let imageUrl = null;

      // 이미지가 선택된 경우 업로드
      if (selectedImage) {
        try {
          // 통합 업로드 함수 사용: 클라이언트는 서버 API로 전송하고 서버가 Vercel Blob에 업로드합니다.
          imageUrl = await uploadFile(selectedImage, 'content-images');

        } catch {

          throw new Error('이미지 업로드에 실패했습니다.');
        }
      }

      const url = editingNews ? `/api/content` : `/api/content`;
      const method = editingNews ? 'PUT' : 'POST';
      const body = editingNews 
        ? { id: editingNews.id, ...formData, imageUrl } 
        : { ...formData, imageUrl };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        loadNews();
      }
             } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '뉴스 저장에 실패했습니다.';
      alert(errorMessage);
    }
  };

  // 뉴스 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/content?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadNews();
(`✅ News 삭제 완료: ${id}`);
      } else {
        console.error('News 삭제 실패:', response.statusText);
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('News 삭제 중 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 편집 모드 시작
  const handleEdit = (news: ContentItem) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      content: news.content,
      author: news.author,
      type: news.type,
      tags: news.tags?.join(', ') || "",
      isPublished: news.isPublished,
    });
    setIsDialogOpen(true);
  };

  // 게시 상태 토글
  const togglePublish = async (news: ContentItem) => {
    try {
      const response = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: news.id,
          isPublished: !news.isPublished,
        }),
      });

      if (response.ok) {
        loadNews();
      }
    } catch {
      
    }
  };

  // 뉴스 상세 뷰
  if (selectedNews) {
    return (
      <div className="space-y-6">
        {/* 뒤로가기 버튼 */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedNews(null)}
            className="bg-[#2e2e2e] text-white hover:bg-[#444] border border-gray-700 hover:border-gray-500 transition"
            onMouseEnter={blockTranslationFeedback}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="notranslate" translate="no">Back to News</span>
          </Button>
        </div>

        {/* 뉴스 상세 내용 - 672px 고정 너비 */}
        <div className="w-full max-w-2xl mx-auto px-8 sm:px-12 lg:px-16" style={{ maxWidth: '672px' }}>
          {/* 헤더 */}
          <div className="border-b border-gray-600 pb-4 mb-6" onMouseEnter={blockTranslationFeedback}>
            <h1 className="text-3xl font-bold text-white mb-2" translate="no">{selectedNews.title}</h1>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span translate="no">{selectedNews.author}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(selectedNews.publishDate).toLocaleDateString()}
              </span>
              
              {!selectedNews.isPublished && (
                <Badge variant="secondary" className="text-xs">
                  임시저장
                </Badge>
              )}
            </div>
          </div>

          {/* 이미지 */}
          {selectedNews.imageUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={selectedNews.imageUrl}
                alt={selectedNews.title}
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
               {selectedNews.content}
             </pre>
           </article>

          {/* 태그 */}
          {selectedNews.tags && selectedNews.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 mt-4" onMouseEnter={blockTranslationFeedback}>
              {selectedNews.tags.map((tag, index) => (
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
              onClick={() => handleLike(selectedNews.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                👍
              </span>
              <span className="text-sm font-medium">
                {likes[selectedNews.id] || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">News</h2>
          <p className="text-gray-400">회사 소식과 업데이트를 관리하세요</p>
        </div>
        <div className="flex gap-2">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500 border-2 border-yellow-400 hover:border-yellow-300 transition-all duration-200 font-bold shadow-lg hover:shadow-yellow-400/25"
            >
              <span className="notranslate" translate="no">🏠 HOME</span>
            </Button>
          )}
          {isAuthenticated && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  새 뉴스 작성
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingNews ? '뉴스 수정' : '새 뉴스 작성'}
                  </DialogTitle>
                  <DialogDescription>
                    회사 소식과 업데이트를 작성하세요.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="제목을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">작성자 *</label>
                    <Input
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="작성자명을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">내용 *</label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="내용을 입력하세요 (마크다운 지원)"
                      rows={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">태그</label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="태그를 쉼표로 구분하여 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">대표 이미지 (선택사항)</label>
                    <div className="space-y-2">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          className="px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-300 hover:border-amber-400 rounded transition-colors"
                        >
                          이미지 선택
                        </button>
                        {selectedImage && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="px-3 py-2 text-sm bg-red-600 border border-red-600 text-white hover:bg-red-700 rounded transition-colors"
                          >
                            제거
                          </button>
                        )}
                      </div>
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="미리보기"
                            className="w-32 h-32 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                                     <div className="flex items-center space-x-2 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                     <input
                       type="checkbox"
                       id="isPublished"
                       checked={formData.isPublished}
                       onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                       className="w-4 h-4 text-amber-400 bg-gray-800 border-gray-600 rounded focus:ring-amber-400 focus:ring-2"
                     />
                     <label htmlFor="isPublished" className="text-sm font-medium text-white">
                       게시하기 (체크 시 News 목록에 표시)
                     </label>
                   </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingNews ? '수정' : '저장'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* 뉴스 목록 */}
      <div className="grid gap-4">
        {news.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">아직 작성된 뉴스가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          news.map((item) => (
                         <Card 
               key={item.id} 
               className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
               onClick={() => setSelectedNews(item)}
               onMouseEnter={blockTranslationFeedback}
             >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                                         <CardTitle className="text-white flex items-center gap-2" translate="no">
                       <FileText className="h-5 w-5 text-amber-400" />
                       {item.title}
                       {!item.isPublished && (
                         <Badge variant="secondary" className="text-xs">
                           임시저장
                         </Badge>
                       )}
                     </CardTitle>
                                         <CardDescription className="text-gray-400 flex items-center gap-4 mt-2">
                       <span className="flex items-center gap-1">
                         <User className="h-3 w-3" />
                         <span translate="no">{item.author}</span>
                       </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.publishDate).toLocaleDateString()}
                      </span>
                      
                    </CardDescription>
                  </div>
                  {isAuthenticated && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onMouseEnter={blockTranslationFeedback}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={createAdminButtonHandler(() => togglePublish(item))}
                        className="text-gray-400 hover:text-white"
                        onMouseEnter={blockTranslationFeedback}
                      >
                        {item.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={createAdminButtonHandler(() => handleEdit(item))}
                        className="text-gray-400 hover:text-white"
                        onMouseEnter={blockTranslationFeedback}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={createAdminButtonHandler(() => handleDelete(item.id))}
                        className="text-red-400 hover:text-red-300"
                        onMouseEnter={blockTranslationFeedback}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {item.imageUrl && (
                  <div className="mb-4 flex justify-center">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-1/4 rounded-lg"
                    />
                  </div>
                )}
                                                                   <div className="prose prose-invert max-w-none">
                    <pre 
                      className="text-gray-300 whitespace-pre-wrap font-mono"
                    >
                      {item.content}
                    </pre>
                  </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((tag, index) => (
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
