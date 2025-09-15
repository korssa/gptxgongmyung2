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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, EyeOff, Calendar, User } from "lucide-react";
import { ContentItem, ContentFormData, ContentType } from "@/types";
import { useAdmin } from "@/hooks/use-admin";
import { uploadFile } from "@/lib/storage-adapter";
import { blockTranslationFeedback, createAdminButtonHandler } from "@/lib/translation-utils";
import { loadMemoDraft, saveMemoDraft, clearMemoDraft } from "@/lib/memo-storage";
import SoftGlowStar from "@/components/soft-glow-star";

export default function Memo1Inline() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState<ContentFormData>({
    title: "",
    content: "",
    author: "",
    type: 'memo' as ContentType,
    tags: "",
    isPublished: true,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { isAuthenticated } = useAdmin();

  // 메모 데이터 로드
  const loadContents = async () => {
    try {
      const response = await fetch('/api/memo');
      if (response.ok) {
        const data = await response.json();
        setContents(data);
      }
    } catch (error) {
      console.error('메모 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 메모 저장
  const handleSave = async () => {
    try {
      let imageUrl = "";
      if (selectedImage) {
        imageUrl = await uploadFile(selectedImage, "memo");
      }

      const contentData: ContentItem = {
        id: editingContent?.id || Date.now().toString(),
        title: formData.title,
        content: formData.content,
        author: formData.author,
        publishDate: new Date().toISOString().split('T')[0],
        type: formData.type,
        imageUrl: imageUrl || editingContent?.imageUrl,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        isPublished: formData.isPublished,
      };

      const response = await fetch('/api/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentData),
      });

      if (response.ok) {
        await loadContents();
        handleCloseDialog();
        clearMemoDraft('memo');
      }
    } catch (error) {
      console.error('메모 저장 실패:', error);
    }
  };

  // 메모 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch('/api/memo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await loadContents();
      }
    } catch (error) {
      console.error('메모 삭제 실패:', error);
    }
  };

  // 메모 편집
  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      content: content.content,
      author: content.author,
      type: content.type,
      tags: content.tags?.join(', ') || '',
      isPublished: content.isPublished,
    });
    setImagePreview(content.imageUrl || null);
    setIsDialogOpen(true);
  };

  // 다이얼로그 닫기
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingContent(null);
    setFormData({
      title: "",
      content: "",
      author: "",
      type: 'memo' as ContentType,
      tags: "",
      isPublished: true,
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 이미지 선택
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadContents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">메모를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 밤하늘 애니메이션 */}
      <SoftGlowStar />
      
      <div className="container mx-auto py-8 px-4 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            📝 Memo 1
          </h1>
          <p className="text-gray-400">개인 메모와 아이디어를 기록하세요</p>
        </div>

        {/* 새 메모 작성 버튼 */}
        {isAuthenticated && (
          <div className="text-center mb-8">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
                  onMouseEnter={blockTranslationFeedback}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  새 메모 작성
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-900 text-white">
                <DialogHeader>
                  <DialogTitle>메모 작성</DialogTitle>
                  <DialogDescription>
                    새로운 메모를 작성하거나 기존 메모를 편집하세요.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">제목</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="메모 제목을 입력하세요"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">작성자</label>
                    <Input
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="작성자명을 입력하세요"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">내용</label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="메모 내용을 입력하세요"
                      rows={6}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">태그 (쉼표로 구분)</label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="태그1, 태그2, 태그3"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">이미지</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="미리보기" className="w-32 h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    취소
                  </Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    {editingContent ? '수정' : '저장'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* 메모 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <Card 
              key={content.id} 
              className="bg-gray-900 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => setSelected(content)}
            >
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="truncate">{content.title}</span>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" />
                    {content.publishDate}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {content.content}
                  </p>
                  
                  {content.imageUrl && (
                    <div className="w-full h-32 bg-gray-800 rounded-lg overflow-hidden">
                      <img 
                        src={content.imageUrl} 
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="h-4 w-4" />
                    {content.author}
                  </div>
                  
                  {content.tags && content.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {content.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isAuthenticated && (
                  <div 
                    className="flex items-center gap-2 mt-4" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createAdminButtonHandler(() => handleEdit(content))}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createAdminButtonHandler(() => handleDelete(content.id))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {contents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">아직 작성된 메모가 없습니다.</p>
            {isAuthenticated && (
              <p className="text-gray-500 text-sm mt-2">새 메모를 작성해보세요!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
