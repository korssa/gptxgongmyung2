"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Edit, Star, Download, User } from "lucide-react";
import { blockTranslationFeedback, createAdminButtonHandler } from "@/lib/translation-utils";
import { AdminFeaturedUploadDialog } from "./admin-featured-upload-dialog";
import { AdminEventsUploadDialog } from "./admin-events-upload-dialog";
import { AppItem } from "@/types";
import Image from "next/image";

interface GalleryManagerProps {
  type: "gallery" | "featured" | "events" | "normal";
  title: string;
  description: string;
  onBack?: () => void;
  isAdmin?: boolean;
}

export function GalleryManager({
  type,
  title,
  description,
  onBack,
  isAdmin = false,
}: GalleryManagerProps) {
  const [items, setItems] = useState<AppItem[]>([]);
  // Horizontal scroller: no pagination
  // Admin upload dialog states (featured/events 전용)
  const [isFeaturedDialogOpen, setFeaturedDialogOpen] = useState(false);
  const [isEventsDialogOpen, setEventsDialogOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimRef = useRef<number | null>(null);
  const scrollStateRef = useRef<{
    start: number;
    from: number;
    to: number;
    duration: number;
    lastTs?: number;
  } | null>(null);

  // Cancel any ongoing RAF scroll animation
  const cancelScrollAnimation = () => {
    if (scrollAnimRef.current != null) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }
    scrollStateRef.current = null;
  };

  // Scroll helper with delta-time based animation for smooth and consistent speed
  // mobile (<640px) -> one card per click; otherwise ~viewport width
  const scrollByStep = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;

    // Determine distance to travel
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    let amount = 0;
    if (isMobile) {
      const firstItem = el.firstElementChild as HTMLElement | null;
      const itemWidth = firstItem?.offsetWidth ?? 170; // fallback to our card width
     const styles = getComputedStyle(el) as CSSStyleDeclaration;
const gapStr = (styles.columnGap || styles.gap || "0").toString();
const gap = parseFloat(gapStr);

      amount = itemWidth + (Number.isFinite(gap) ? gap : 0);
    } else {
      amount = Math.max(320, Math.floor(el.clientWidth * 0.9));
    }

    // Set up animation state
    const from = el.scrollLeft;
    const to = from + dir * amount;

    // Cancel prior animation if any
    cancelScrollAnimation();

    // Duration tuned by distance (px per second ~ 1600)
    const pxPerSecond = 1600; // adjust for preferred speed
    const duration = Math.max(220, Math.min(600, Math.abs(amount) / pxPerSecond * 1000));

    scrollStateRef.current = {
      start: performance.now(),
      from,
      to,
      duration,
    };

    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const step = (ts: number) => {
      if (!scrollStateRef.current) return;
      const { start, from, to, duration } = scrollStateRef.current;
      // deltaTime in ms (not strictly needed for absolute-time easing, but kept for clarity)
      const dt = scrollStateRef.current.lastTs != null ? ts - scrollStateRef.current.lastTs : 0;
      scrollStateRef.current.lastTs = ts;

      const elapsed = ts - start;
      const t = Math.max(0, Math.min(1, elapsed / duration));
      const eased = easeInOutQuad(t);
      const value = from + (to - from) * eased;
      el.scrollLeft = value;

      if (t < 1) {
        scrollAnimRef.current = requestAnimationFrame(step);
      } else {
        cancelScrollAnimation();
      }
    };

    scrollAnimRef.current = requestAnimationFrame(step);
  };

  const loadItems = useCallback(async () => {
    try {
      // 'normal' 뷰는 실제로 gallery-gallery 폴더에서 관리되므로 API는 gallery로 조회
      const queryType = type === "normal" ? "gallery" : type;
      const response = await fetch(`/api/gallery?type=${queryType}`);
      if (response.ok) {
        const data = await response.json();
        if (queryType === "gallery") {
          setItems(
            data.filter(
              (item: AppItem) =>
                item.status === "published" ||
                item.status === "in-review" ||
                item.status === "development"
            )
          );
        } else {
          setItems(data.filter((item: AppItem) => item.status === "published"));
        }
      }
    } catch {
      // noop
    }
  }, [type]);

  useEffect(() => {
    loadItems();
  }, [type, loadItems]);

  // delete handler for admin actions
  const handleDelete = (itemId: string) => {
    createAdminButtonHandler(async () => {
      const item = items.find((i) => i.id === itemId);
      if (confirm(`"${item?.name}"을(를) 삭제하시겠습니까?`)) {
        try {
          const response = await fetch(`/api/gallery?type=${type}&id=${itemId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          });
          if (response.ok) {
            setItems((prev) => prev.filter((i) => i.id !== itemId));
          } else {
            alert("삭제에 실패했습니다.");
          }
        } catch {
          alert("삭제 중 오류가 발생했습니다.");
        }
      }
    })();
  };

  // pagination removed; render all items in a horizontal scroller

  return (
    <div className="space-y-6">
      {/* 제목/설명 (normal이면 숨김) */}
      {type !== "normal" && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-gray-400" onMouseEnter={blockTranslationFeedback}>
              {description}
            </p>
          </div>
        </div>
      )}

      {/* Admin: featured / events 업로드 버튼 (gallery/normal은 숨김) */}
      {isAdmin && (type === "featured" || type === "events") && (
        <div className="flex justify-end">
          {type === "featured" ? (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setFeaturedDialogOpen(true)}
              onMouseEnter={blockTranslationFeedback}
            >
              + Add Featured
            </Button>
          ) : (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setEventsDialogOpen(true)}
              onMouseEnter={blockTranslationFeedback}
            >
              + Add Event
            </Button>
          )}
        </div>
      )}

      {onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-[#2e2e2e] text-white hover:bg-[#444] border border-gray-700 hover:border-gray-500 transition"
          onMouseEnter={blockTranslationFeedback}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
      )}

      {/* 가로 스크롤 카드 행 (전체 필드 포함) */}
      <div ref={scrollerRef} className="flex flex-row gap-4 overflow-x-auto py-4 px-2">
        {items.length === 0 ? (
          type !== "normal" && (
            <div className="col-span-full">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center text-gray-400">
                  {"아직 업로드된 갤러리 아이템이 없습니다."}
                </CardContent>
              </Card>
            </div>
          )
        ) : (
          items.map((item, index) => (
            <Card
              key={item.id}
              className={`group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 w-[170px] flex-shrink-0 ${
                type === "featured"
                  ? "relative featured-glow-card"
                  : type === "events"
                  ? ""
                  : "relative allapps-glow-card"
              }`}
              style={{ backgroundColor: "#D1E2EA" }}
              onMouseEnter={blockTranslationFeedback}
            >
              <div className="relative">
                {/* Screenshot/App Preview */}
                <div className="w-full mx-auto">
                  <div className="aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 relative">
                    {/* Numbering overlay for events */}
                    {type === "events" && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/95 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-lg border-2 border-white">
                          {index + 1}
                        </div>
                      </div>
                    )}
                    {item.screenshotUrls && item.screenshotUrls.length > 0 ? (
                      <Image
                        src={item.screenshotUrls[0]}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-6xl">
                        📱
                      </div>
                    )}

                    {/* Status Badge (overlay on screenshot) */}
                    <div className="absolute bottom-1 left-1">
                      <Badge
                        className={`text-white text-[10px] px-1 py-0.5 ${
                          item.status === "published"
                            ? "bg-green-500"
                            : item.status === "in-review"
                            ? "bg-orange-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Admin 버튼 */}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                      onClick={() => console.log("Edit:", item.id)}
                      onMouseEnter={blockTranslationFeedback}
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => handleDelete(item.id)}
                      onMouseEnter={blockTranslationFeedback}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                )}
              </div>

              <CardContent className="px-1.5 py-0" style={{ backgroundColor: "#D1E2EA" }}>
                {/* App Icon and Basic Info */}
                <div className="flex items-start space-x-2 mb-2">
                  <Image
                    src={item.iconUrl}
                    alt={item.name}
                    width={64}
                    height={64}
                    unoptimized
                    className="w-16 h-16 rounded-xl object-cover object-center flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMiA2QzEwLjM0IDYgOSA3LjM0IDkgOUM5IDEwLjY2IDEwLjM0IDEyIDEyIDEyQzEzLjY2IDEyIDE1IDEwLjY2IDE1IDlDMTUgNy4zNCAxMy42NiA2IDEyIDZaTTEyIDRDMTQuNzYgNCAxNyA2LjI0IDE3IDlDMTcgMTEuNzYgMTQuNzYgMTQgMTIgMTRDOS4yNCAxNCA3IDExLjc2IDcgOUM3IDYuMjQgOS4yNCA0IDEyIDRaTTEyIDE2QzEwLjM0IDE2IDkgMTcuMzQgOSAxOUg3QzcgMTYuMjQgOS4yNCAxNCAxMiAxNEMxNC43NiAxNCAxNyAxNi4yNCAxNyAxOUgxNUMxNSAxNy4zNCAxMy42NiAxNiAxMiAxNloiIGZpbGw9IiM5Y2EzYWYiLz4KPC9zdmc+";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate notranslate" translate="no">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate notranslate" translate="no">
                      {item.developer}
                    </p>
                  </div>
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating}</span>
                    </div>
                    <span>{item.downloads}</span>
                  </div>
                  <span>{item.version}</span>
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {item.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-sm px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-sm text-muted-foreground">+{item.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </CardContent>

              {/* Download Section */}
              <CardFooter className="w-full bg-[#84CC9A] border-t border-gray-300 px-2 py-2">
                <div className="flex flex-col items-start space-y-1 w-full">
                  {/* Download Button */}
                  <div className="w-full">
                    {item.status === "published" ? (
                      type === "events" ? (
                        <Button
                          size="sm"
                          className="h-8 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 whitespace-nowrap min-w-[120px] justify-start"
                          onClick={() => {
                            if (item.storeUrl) {
                              window.open(item.storeUrl, "_blank");
                            }
                          }}
                        >
                          <User className="h-4 w-4" />
                          See App
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 px-4 text-sm bg-green-700 hover:bg-green-800 text-white flex items-center gap-1 whitespace-nowrap min-w-[120px] justify-start"
                          onClick={() => {
                            if (item.storeUrl) {
                              window.open(item.storeUrl, "_blank");
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 px-4 text-sm bg-gray-500 text-white flex items-center gap-1 min-w-[120px] justify-start"
                        disabled
                      >
                        Coming soon
                      </Button>
                    )}
                  </div>

                  {/* Store Badge */}
                  <div className="h-9">
                    <Image
                      src={item.store === "google-play" ? "/google-play-badge.png" : "/app-store-badge.png"}
                      alt="스토어 배지"
                      width={120}
                      height={28}
                      className="h-9 object-contain"
                    />
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* 하단 금색 방향키 (< >) */}
      <div className="flex items-center justify-center gap-4 -mt-2">
        <Button
          aria-label="왼쪽으로 스크롤"
          className="rounded-full px-4 py-2 text-xl font-bold bg-[#D4AF37] text-black hover:bg-[#B9931E] focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          onClick={() => scrollByStep(-1)}
        >
          &lt;
        </Button>
        <Button
          aria-label="오른쪽으로 스크롤"
          className="rounded-full px-4 py-2 text-xl font-bold bg-[#D4AF37] text-black hover:bg-[#B9931E] focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
          onClick={() => scrollByStep(1)}
        >
          &gt;
        </Button>
      </div>

      {/* pagination removed for horizontal scroller */}

      {/* 업로드 다이얼로그 (admin 전용): featured/events에서만 동작 */}
      {isAdmin && type === "featured" && (
        <AdminFeaturedUploadDialog
          isOpen={isFeaturedDialogOpen}
          onClose={() => setFeaturedDialogOpen(false)}
          onUploadSuccess={() => {
            setFeaturedDialogOpen(false);
            loadItems();
          }}
          targetGallery={type}
        />
      )}
      {isAdmin && type === "events" && (
        <AdminEventsUploadDialog
          isOpen={isEventsDialogOpen}
          onClose={() => setEventsDialogOpen(false)}
          onUploadSuccess={() => {
            setEventsDialogOpen(false);
            loadItems();
          }}
          targetGallery={type}
        />
      )}
    </div>
  );
}
export default GalleryManager;
