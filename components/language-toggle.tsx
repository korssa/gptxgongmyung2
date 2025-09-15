"use client";

import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { languageNames, Language } from "@/lib/i18n/translations";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  // 전체 언어 리스트
  const languageList: Language[] = Object.keys(languageNames) as Language[];

  const toggleLanguage = () => {
    const currentIndex = languageList.indexOf(language);
    const nextIndex = (currentIndex + 1) % languageList.length; // 마지막 → 처음으로 순환
    setLanguage(languageList[nextIndex]);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 px-3 text-white hover:bg-white/20 font-bold text-base flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      {languageNames[language]} {/* 현재 언어 라벨 출력 */}
    </Button>
  );
}
