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
import { Plus, Edit, Trash2, EyeOff, Eye, Calendar, User, ArrowLeft, Home } from "lucide-react";
import { ContentItem, ContentFormData, ContentType } from "@/types";
import { useAdmin } from "@/hooks/use-admin";
import { uploadFile } from "@/lib/storage-adapter";
import { blockTranslationFeedback, createAdminButtonHandler } from "@/lib/translation-utils";
import { loadMemoDraft, saveMemoDraft, clearMemoDraft } from "@/lib/memo-storage";
import Link from "next/link";
import SoftGlowStar from "@/components/soft-glow-star";
import { GoogleTranslateWidget } from "@/components/google-translate-widget";

export default function MemoPage() {
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

  // 🌌 밤하늘 애니메이션 요소 생성 (Canvas 버전)
  useEffect(() => {
    // ========== Canvas Setup ==========
    const canvas = document.getElementById('skyCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 안전한 devicePixelRatio 처리
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    function resizeCanvas() {
      try {
        if (!ctx) return;
        canvas.width = Math.floor(canvas.clientWidth * dpr);
        canvas.height = Math.floor(canvas.clientHeight * dpr);
        ctx.scale(dpr, dpr);
        updateStarPositions(); // 화면 크기 변경 시 별 위치 업데이트
      } catch (error) {
        console.warn('Canvas resize error:', error);
      }
    }
    
    // 초기화 지연
    setTimeout(() => {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }, 100);

    // ========== Stars (twinkle) - 반응형 + 매우 느린 깜박임 ==========
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    let stars: Array<{
      x: number; y: number; r: number; p: number; twinkleSpeed: number;
      xPercent: number; yPercent: number; // 퍼센트 기반 위치 저장
    }> = [];
    // crossStars 배열 제거됨 - CSS Soft Glow Star로 대체

    // 별과 십자별 초기화 함수
    function initializeStars() {
      stars = Array.from({ length: 300 }, () => {
        const xPercent = Math.random();
        const yPercent = Math.random();
        return {
          x: xPercent * canvas.width,
          y: yPercent * canvas.height,
          r: rand(0.8, 2.2),
          p: Math.random() * Math.PI * 2,
          twinkleSpeed: rand(0.0005, 0.002),
          xPercent,
          yPercent
        };
      });

      // crossStars 초기화 제거됨 - CSS Soft Glow Star로 대체
    }

    // 화면 크기 변경 시 별 위치 재계산
    function updateStarPositions() {
      try {
        stars.forEach(star => {
          star.x = star.xPercent * canvas.width;
          star.y = star.yPercent * canvas.height;
          star.r = rand(0.8, 2.2);
        });

        // crossStars 위치 업데이트 제거됨 - CSS Soft Glow Star로 대체
      } catch (error) {
        console.warn('Star position update error:', error);
      }
    }

    initializeStars();

    // ========== Meteor (크기와 꼬리 개선) ==========
    let meteor: { x: number; y: number; vx: number; vy: number; life: number; trail: Array<{x: number; y: number; life: number}> } | null = null;
    let meteorTimer = 0;

    // ========== Animation Loop ==========
    let lastTime = 0;
    function animate(currentTime: number) {
      if (!ctx || !canvas) return;
      
      // 델타타임 계산 (프레임레이트 독립적)
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const deltaFactor = deltaTime / 16.67; // 60fps 기준 정규화
      
      try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } catch (error) {
        console.warn('Canvas clear error:', error);
        return;
      }
      
      // 일반 별들 그리기 (매우 느린 트윙클)
      try {
        stars.forEach(star => {
          const twinkle = 0.3 + 0.7 * Math.sin(Date.now() * star.twinkleSpeed + star.p);
          ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.9})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fill();
        });
      } catch (error) {
        console.warn('Star drawing error:', error);
      }

      // 십자별은 이제 CSS Soft Glow Star로 대체됨

      // 유성 처리 (크기와 꼬리 개선)
      try {
        meteorTimer += deltaFactor;
        if (meteorTimer > 600 && !meteor) { // 10초마다 유성 생성 (더 느리게, 델타타임 적용)
          meteor = {
            x: canvas.width * 0.9,
            y: -30,
            vx: -6,  // 속도 절반으로 감소
            vy: 4,   // 속도 절반으로 감소
            life: 1,
            trail: []
          };
          meteorTimer = 0;
        }

      if (meteor) {
        // 유성 이동 (델타타임 적용)
        meteor.x += meteor.vx * deltaFactor;
        meteor.y += meteor.vy * deltaFactor;
        meteor.life -= 0.008 * deltaFactor; // 생명력 감소 속도 느리게, 델타타임 적용
        
        // 꼬리 추가 (더 자주, 더 길게)
        meteor.trail.push({ x: meteor.x, y: meteor.y, life: 1 });
        if (meteor.trail.length > 40) meteor.trail.shift(); // 꼬리 길이 증가
        
        // 꼬리 그리기 (더 긴 그라디언트)
        meteor.trail.forEach((point, i) => {
          const alpha = (point.life * i) / meteor!.trail.length;
          const trailLength = 60; // 꼬리 길이 증가
          const gradient = ctx.createLinearGradient(
            point.x, point.y, 
            point.x - trailLength, point.y + trailLength
          );
          gradient.addColorStop(0, `rgba(255,255,255,${alpha * 0.9})`);
          gradient.addColorStop(0.3, `rgba(255,255,255,${alpha * 0.6})`);
          gradient.addColorStop(1, 'rgba(255,255,255,0)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
          point.life -= 0.08 * deltaFactor;
        });
        
        // 유성 머리 그리기 (더 크게)
        const headSize = 6 + (meteor.life * 2); // 크기 증가
        ctx.fillStyle = `rgba(255,255,255,${meteor.life})`;
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, headSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 유성 머리 글로우 효과
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, headSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        if (meteor.life <= 0 || meteor.x < -100) {
          meteor = null;
        }
      }
      } catch (error) {
        console.warn('Meteor drawing error:', error);
      }

      requestAnimationFrame(animate);
    }

    // 애니메이션 시작을 지연시켜 안정성 향상
    setTimeout(() => {
      try {
        animate(performance.now());
      } catch (error) {
        console.warn('Animation start error:', error);
      }
    }, 200);

    // 야광충 삭제됨 - 십자별의 진짜 별 반짝임 효과로 대체

    // 컴포넌트 언마운트 시 정리
    return () => {
      try {
        window.removeEventListener('resize', resizeCanvas);
        document.querySelectorAll('.glowbug').forEach(el => el.remove());
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, []);

  // 위젯 토글 시 메모 저장 브로드캐스트 수신
  useEffect(() => {
    const handler = () => {
      saveMemoDraft('memo', {
        title: formData.title,
        content: formData.content,
        author: formData.author,
        tags: formData.tags,
        isPublished: formData.isPublished,
      });
    };
    window.addEventListener('memo:save-draft', handler);
    return () => window.removeEventListener('memo:save-draft', handler);
  }, [formData.title, formData.content, formData.author, formData.tags, formData.isPublished]);

  // 폼 로컬 캐시 복원
  useEffect(() => {
    const draft = loadMemoDraft('memo');
    if (draft) {
      setFormData(prev => ({
        ...prev,
        title: draft.title ?? prev.title,
        content: draft.content ?? prev.content,
        author: draft.author ?? prev.author,
        tags: draft.tags ?? prev.tags,
        isPublished: typeof draft.isPublished === 'boolean' ? draft.isPublished : prev.isPublished,
      }));
    }
  }, []);

  // 폼 변경 즉시 저장
  useEffect(() => {
    saveMemoDraft('memo', {
      title: formData.title,
      content: formData.content,
      author: formData.author,
      tags: formData.tags,
      isPublished: formData.isPublished,
    });
  }, [formData.title, formData.content, formData.author, formData.tags, formData.isPublished]);

  // Load content list
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // 메모 전용 API에서 콘텐츠 로드
        const res = await fetch(`/api/memo`);
        
        if (res.ok) {
          const data = await res.json();
          const finalContents = isAuthenticated ? data : data.filter((c: ContentItem) => c.isPublished);
          setContents(finalContents);
        } else {
          console.warn('📝 [Memo] Dedicated API load failed');
          setContents([]);
        }
      } catch (err) {
        console.error('📝 [Memo] Failed to load content:', err);
        setContents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    
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
  }, [isAuthenticated]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      author: "",
      type: 'memo' as ContentType,
      tags: "",
      isPublished: true,
    });
    setEditingContent(null);
    setSelectedImage(null);
    setImagePreview(null);
    clearMemoDraft('memo');
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

  // 콘텐츠 저장
  const handleSubmit = async () => {
    try {
      // 필수 필드 검증
      if (!formData.title.trim()) {
        alert('Please enter a title.');
        return;
      }
      if (!formData.author.trim()) {
        alert('Please enter an author.');
        return;
      }
      if (!formData.content.trim()) {
        alert('Please enter content.');
        return;
      }

      let imageUrl = null;

      // 이미지가 선택된 경우 업로드
      if (selectedImage) {
        try {
          imageUrl = await uploadFile(selectedImage, 'content-images');
        } catch {
          throw new Error('Image upload failed.');
        }
      }

      const url = editingContent ? `/api/memo` : `/api/memo`;
      const method = editingContent ? 'PUT' : 'POST';
      const body = editingContent 
        ? { id: editingContent.id, ...formData, imageUrl } 
        : { ...formData, imageUrl };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        resetForm();
        clearMemoDraft('memo');
        
        // 콘텐츠 목록 다시 로드
        try {
          const res = await fetch(`/api/memo`);
          if (res.ok) {
            const data = await res.json();
            setContents(isAuthenticated ? data : data.filter((c: ContentItem) => c.isPublished));
          }
        } catch (error) {
          // 목록 새로고침 실패
        }
        
        alert(editingContent ? 'Memo has been updated.' : 'Memo has been saved.');
      } else {
        let message = 'Failed to save memo.';
        try {
          const err = await response.json();
          if (err?.error) message = `Failed to save memo: ${err.error}`;
          if (err?.details) message += `\nDetails: ${err.details}`;
        } catch {}
        alert(message);
      }
    } catch {
      alert('Failed to save memo.');
    }
  };

  // 콘텐츠 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete?')) return;

    try {
      const response = await fetch(`/api/memo?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 콘텐츠 목록 다시 로드
        try {
          const res = await fetch(`/api/memo`);
          if (res.ok) {
            const data = await res.json();
            setContents(isAuthenticated ? data : data.filter((c: ContentItem) => c.isPublished));
          }
        } catch (error) {
          // 삭제 후 목록 새로고침 실패
        }
        
        alert('Memo has been deleted.');
      }
    } catch {
      // 삭제 실패
    }
  };

  // 편집 모드 시작
  const handleEdit = (content: ContentItem) => {
    setEditingContent(content);
    setFormData({
      title: content.title,
      content: content.content,
      author: content.author,
      type: content.type,
      tags: content.tags?.join(', ') ?? "",
      isPublished: content.isPublished,
    });
    setIsDialogOpen(true);
  };

  // 게시 상태 토글
  const togglePublish = async (content: ContentItem) => {
    try {
      const response = await fetch('/api/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: content.id,
          isPublished: !content.isPublished,
        }),
      });

      if (response.ok) {
        const res = await fetch(`/api/memo`);
        const data = await res.json();
        setContents(isAuthenticated ? data : data.filter((c: ContentItem) => c.isPublished));
      }
    } catch {
      // 토글 실패
    }
  };

  // If content selected, show detail view
  if (selected) {
    return (
      <div className="min-h-screen bg-black text-white relative" style={{ paddingTop: '40px' }}>
        {/* 🌌 GPTXGONGMYUNG MEMO - Night Sky Animation (Canvas ver.) */}
        <style dangerouslySetInnerHTML={{
          __html: `
          /* 🌟 전체 화면 캔버스 영역 */
          #skyCanvas {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 1;
          }
          
          /* 달 제거됨 */

          /* 야광충 삭제됨 - 십자별의 진짜 별 반짝임 효과로 대체 */

          /* 배경 별빛 살짝 (CSS 레이어) */
          body::before{
            content:""; position:fixed; top:0; left:0; width:100vw; height:40vh; z-index:0; pointer-events:none;
            background:
              radial-gradient(circle at 20% 30%, rgba(255,255,255,.08), transparent 55%),
              radial-gradient(circle at 80% 40%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 10% 10%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 50% 70%, rgba(200,255,255,.05), transparent 55%);
          }
          
        `}} />

        <canvas id="skyCanvas"></canvas>
        
        <div className="container mx-auto py-6 max-w-6xl px-4 relative z-10">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/?filter=all"
              className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors notranslate"
              translate="no"
              onMouseEnter={blockTranslationFeedback}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Button 
              onClick={() => {
                setSelected(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              variant="ghost" 
              className="text-white hover:text-amber-400 transition-colors notranslate"
              onMouseEnter={blockTranslationFeedback}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ← Back to List
            </Button>
          </div>

          <div className="w-full flex justify-center">
            <div className="w-full max-w-2xl">
              {/* Header Info */}
              <div className="text-white border-b border-gray-600 pb-4 mb-6" onMouseEnter={blockTranslationFeedback}>
                <h1 className="text-3xl font-bold mb-2" translate="no">{selected.title}</h1>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" /> <span translate="no">{selected.author}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(selected.publishDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Main Content */}
              <article className="text-left text-gray-300 leading-relaxed space-y-6" onMouseEnter={blockTranslationFeedback}>
                {/* Place image at the beginning of content if available */}
                {selected.imageUrl && (
                  <div className="flex justify-start mb-6">
                    <img
                      src={selected.imageUrl}
                      alt={selected.title}
                      className="max-w-xs h-auto rounded shadow-lg"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}

                {/* Main Text */}
                <pre
                  className="whitespace-pre-wrap font-mono preserve-format"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'keep-all',
                    wordWrap: 'break-word',
                    fontFamily: 'monospace'
                  }}
                >
                  {selected.content}
                </pre>
              </article>

              {/* Tags */}
              {selected.tags && selected.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-6 pt-4 border-t border-gray-600" onMouseEnter={blockTranslationFeedback}>
                  {selected.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white text-black rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Navigation */}
              <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-600">
                <Button 
                  onClick={() => {
                    setSelected(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} 
                  variant="ghost" 
                  className="text-white hover:text-amber-400 transition-colors notranslate"
                  onMouseEnter={blockTranslationFeedback}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ← Back to List
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        {/* 🌌 GPTXGONGMYUNG MEMO - Night Sky Animation (Canvas ver.) */}
        <style dangerouslySetInnerHTML={{
          __html: `
          /* 🌟 전체 화면 캔버스 영역 */
          #skyCanvas {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 1;
          }
          
          /* 달 제거됨 */

          /* 야광충 삭제됨 - 십자별의 진짜 별 반짝임 효과로 대체 */

          /* 배경 별빛 살짝 (CSS 레이어) */
          body::before{
            content:""; position:fixed; top:0; left:0; width:100vw; height:40vh; z-index:0; pointer-events:none;
            background:
              radial-gradient(circle at 20% 30%, rgba(255,255,255,.08), transparent 55%),
              radial-gradient(circle at 80% 40%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 10% 10%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 50% 70%, rgba(200,255,255,.05), transparent 55%);
          }
          
        `}} />

        <canvas id="skyCanvas"></canvas>
        <SoftGlowStar />
        
        <div className="container mx-auto py-6 max-w-6xl px-4 relative z-10">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading memos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (contents.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white relative">
        {/* 🌌 GPTXGONGMYUNG MEMO - Night Sky Animation (Canvas ver.) */}
        <style dangerouslySetInnerHTML={{
          __html: `
          /* 🌟 전체 화면 캔버스 영역 */
          #skyCanvas {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 1;
          }
          
          /* 달 제거됨 */

          /* 야광충 삭제됨 - 십자별의 진짜 별 반짝임 효과로 대체 */

          /* 배경 별빛 살짝 (CSS 레이어) */
          body::before{
            content:""; position:fixed; top:0; left:0; width:100vw; height:40vh; z-index:0; pointer-events:none;
            background:
              radial-gradient(circle at 20% 30%, rgba(255,255,255,.08), transparent 55%),
              radial-gradient(circle at 80% 40%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 10% 10%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 50% 70%, rgba(200,255,255,.05), transparent 55%);
          }
          
        `}} />

        <canvas id="skyCanvas"></canvas>
        
        <div className="container mx-auto py-6 max-w-6xl px-4 relative z-10">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/?filter=all"
              className="flex items-center gap-2 text-white hover:text-amber-400 transition-colors"
              onMouseEnter={blockTranslationFeedback}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>

          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No memos yet</h3>
            <p className="text-gray-400 mb-6">New memos will be added soon.</p>
            
            {/* Show add button only in admin mode */}
          {isAuthenticated && (
            <div className="mt-6">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Memo
                  </Button>
                </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingContent ? 'Edit Memo' : 'Create New Memo'}
                      </DialogTitle>
                      <DialogDescription>
                        Create a new memo.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="memo-title" className="block text-sm font-medium mb-2">Title *</label>
                        <Input
                          id="memo-title"
                          name="title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter title"
                        />
                      </div>

                      <div>
                        <label htmlFor="memo-author" className="block text-sm font-medium mb-2">Author *</label>
                        <Input
                          id="memo-author"
                          name="author"
                          value={formData.author}
                          onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                          placeholder="Enter author name"
                        />
                      </div>

                      <div>
                        <label htmlFor="memo-content" className="block text-sm font-medium mb-2">Content *</label>
                        <Textarea
                          id="memo-content"
                          name="content"
                          value={formData.content}
                          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Enter content"
                          rows={10}
                        />
                      </div>

                      <div>
                        <label htmlFor="memo-tags" className="block text-sm font-medium mb-2">Tags</label>
                        <Input
                          id="memo-tags"
                          name="tags"
                          value={formData.tags}
                          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                          placeholder="Enter tags separated by commas"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Featured Image (Optional)</label>
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
                              Select Image
                            </button>
                            {selectedImage && (
                              <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="px-3 py-2 text-sm bg-red-600 border border-red-600 text-white hover:bg-red-700 rounded transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          {imagePreview && (
                            <div className="mt-2">
                              <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isPublished"
                          checked={formData.isPublished}
                          onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                        />
                        <label htmlFor="isPublished" className="text-sm">
                          Publish immediately
                        </label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit}>
                        {editingContent ? 'Update' : 'Save'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (

<div className="min-h-screen bg-black text-white relative" style={{ paddingTop: '40px' }}>
      {/* 🌌 GPTXGONGMYUNG MEMO - Night Sky Animation (Canvas ver.) */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* 🌟 전체 화면 캔버스 영역 */
          #skyCanvas {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 1;
          }
          
          /* 달 제거됨 */

          /* 야광충 삭제됨 - 십자별의 진짜 별 반짝임 효과로 대체 */

          /* 배경 별빛 살짝 (CSS 레이어) */
          body::before{
            content:""; position:fixed; top:0; left:0; width:100vw; height:40vh; z-index:0; pointer-events:none;
            background:
              radial-gradient(circle at 20% 30%, rgba(255,255,255,.08), transparent 55%),
              radial-gradient(circle at 80% 40%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 10% 10%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(circle at 50% 70%, rgba(200,255,255,.05), transparent 55%);
          }
          
        `
      }} />

      <canvas id="skyCanvas"></canvas>
      <div className="moon"></div>

      <div className="container mx-auto py-6 max-w-6xl px-4 relative z-10">
        {/* 구글 번역 위젯 */}
        <div className="flex justify-end mb-6">
          <GoogleTranslateWidget />
        </div>

        {/* 헤더 - App Story 스타일 */}
        <div className="text-center relative z-10 mb-8">
          <div className="text-center relative z-10" style={{ padding: '1rem' }}>
            <h2 className="text-2xl font-bold text-white mb-2 notranslate" translate="no">
              GPTXGONGMYUNG.COM
            </h2>
            <p className="text-gray-400">
              Our 🌿Slogan
            </p>
            <p className="text-gray-400 notranslate" translate="no">
              &ldquo;We&apos;re just. That kind of group!&rdquo;
            </p>
          </div>
          
          {/* HOME 버튼 */}
          <div className="mb-6">
            <Link 
              href="/?filter=all"
              className="inline-flex items-center gap-2 text-white hover:text-amber-400 transition-colors bg-black px-4 py-2 rounded-lg border border-gray-600 hover:border-amber-400 notranslate"
              translate="no"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
        {isAuthenticated && (
          <div className="mt-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { resetForm(); setIsDialogOpen(true); }} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg gap-2"
                  onMouseEnter={blockTranslationFeedback}
                >
                  <Plus className="h-5 w-5" />
                  새 메모 작성
                </Button>
              </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingContent ? 'Edit Memo' : 'Create New Memo'}
                    </DialogTitle>
                    <DialogDescription>
                      Create a new memo.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="memo-title-list" className="block text-sm font-medium mb-2">Title *</label>
                      <Input
                        id="memo-title-list"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter title"
                      />
                    </div>

                    <div>
                      <label htmlFor="memo-author-list" className="block text-sm font-medium mb-2">Author *</label>
                      <Input
                        id="memo-author-list"
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Enter author name"
                      />
                    </div>

                    <div>
                      <label htmlFor="memo-content-list" className="block text-sm font-medium mb-2">Content *</label>
                      <Textarea
                        id="memo-content-list"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Enter content"
                        rows={10}
                      />
                    </div>

                    <div>
                      <label htmlFor="memo-tags-list" className="block text-sm font-medium mb-2">Tags</label>
                      <Input
                        id="memo-tags-list"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="Enter tags separated by commas"
                      />
                    </div>

                    <div>
                      <label htmlFor="memo-image-list" className="block text-sm font-medium mb-2">Featured Image (Optional)</label>
                      <div className="space-y-2">
                        <input
                          id="image-upload-list"
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => document.getElementById('image-upload-list')?.click()}
                            className="px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-300 hover:border-amber-400 rounded transition-colors"
                          >
                            Select Image
                          </button>
                          {selectedImage && (
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-3 py-2 text-sm bg-red-600 border border-red-600 text-white hover:bg-red-700 rounded transition-colors"
                            >
                                Remove
                            </button>
                          )}
                        </div>
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublished"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                      />
                      <label htmlFor="isPublished" className="text-sm">
                        Publish immediately
                      </label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingContent ? 'Update' : 'Save'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <Card
              key={content.id}
              className="bg-gray-800/50 border-2 border-gray-700 hover:border-amber-400/70 hover:bg-gray-800/80 transition-all duration-300 cursor-pointer group"
              onClick={() => {
                setSelected(content);
                blockTranslationFeedback();
              }}
            >
              <CardHeader className="pb-3">
                {content.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={content.imageUrl}
                      alt={content.title}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}
                <CardTitle className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2" translate="no">
                  {content.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span translate="no">{content.author}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(content.publishDate).toLocaleDateString()}
                  </span>
                </div>

                {isAuthenticated && (
                  <div 
                    className="flex items-center gap-2 mt-2" 
                    onClick={(e) => e.stopPropagation()} 
                    onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
                    onMouseEnter={blockTranslationFeedback}
                    role="button"
                    tabIndex={0}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createAdminButtonHandler(() => togglePublish(content))}
                      className="text-gray-400 hover:text-white"
                      onMouseEnter={blockTranslationFeedback}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createAdminButtonHandler(() => handleEdit(content))}
                      className="text-gray-400 hover:text-white"
                      onMouseEnter={blockTranslationFeedback}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={createAdminButtonHandler(() => handleDelete(content.id))}
                      className="text-red-400 hover:text-red-300"
                      onMouseEnter={blockTranslationFeedback}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
