// Upgraded GoogleTranslateWidget.tsx (타입 선언 포함 버전)
"use client";

import { useEffect } from "react";

// 🌍 글로벌 타입 선언 통합
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: {
          new (
            options: {
              pageLanguage: string;
              layout?: string;
              includedLanguages?: string;
              multilanguagePage?: boolean;
              autoDisplay?: boolean;
            },
            element: string
          ): unknown; 
          InlineLayout?: {
            HORIZONTAL?: string;
          };
        };
      };
    };
    adminModeChange?: (enabled: boolean) => void;
    __widget_initialized?: boolean;
  }
}

export function GoogleTranslateWidget() {
  useEffect(() => {
    const CORE_LANGUAGES = ["en", "zh", "fr", "de", "ar", "ru", "pt", "ja", "ko"];

    function buildMaps() {
      const entries = [
        ["en-gb", "UK", "English"],
        ["en-us", "United States", "English"],
        ["en-ca", "Canada", "English"],
        ["pt-br", "Brazil", "Português (BR)"],
      ];

      const countryByLang: Record<string, string> = {};
      const nativeByLang: Record<string, string> = {};
      const included = new Set<string>();

      for (const [code, country, native] of entries) {
        const c = code.toLowerCase();
        const base = c.split("-")[0];

        countryByLang[c] = country;
        nativeByLang[c] = native;

        if (!countryByLang[base]) countryByLang[base] = country;
        if (!nativeByLang[base]) nativeByLang[base] = native;

        included.add(c);
      }

      return {
        countryByLang,
        nativeByLang,
        includedLanguages: Array.from(included).join(","),
      };
    }

    function updateLanguageOptions() {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (!combo || !combo.options) return;

      const { countryByLang, nativeByLang } = buildMaps();
      const options = Array.from(combo.options);
      const selectedValue = combo.value.toLowerCase();

      options.forEach((option) => {
        if (option.dataset.updated === "true") return;

        const code = option.value.toLowerCase();
        const base = code.split("-")[0];

        const country = countryByLang[code] ?? countryByLang[base] ?? base.toUpperCase();
        const native = nativeByLang[code] ?? nativeByLang[base] ?? (option.text.trim() || base);

        option.text = `${country} - ${native}`;
        option.dataset.updated = "true";
        option.className = CORE_LANGUAGES.includes(base) ? "core-language" : "regional-language";
      });

      options.sort((a, b) => a.text.localeCompare(b.text));
      combo.innerHTML = "";
      options.forEach((opt) => combo.appendChild(opt));

      const selectedOption = options.find((opt) => opt.value.toLowerCase() === selectedValue);
      if (selectedOption) {
        selectedOption.selected = true;
        combo.value = selectedOption.value;
      }
    }

    function initializeLanguageMapping() {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (!combo || combo.options.length < 2) return false;

      updateLanguageOptions();
      return true;
    }

    function hideFeedbackElements() {
      const selectors = [
        ".goog-te-balloon-frame",
        ".goog-te-ftab",
        ".goog-te-ftab-float",
        ".goog-tooltip",
        ".goog-tooltip-popup",
        ".goog-te-banner-frame",
        ".goog-te-spinner-pos",
      ];
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
      });
    }

    const feedbackLoop = setInterval(hideFeedbackElements, 5000);

    const observer = new MutationObserver(() => {
      updateLanguageOptions();
      hideFeedbackElements();
    });

    window.googleTranslateElementInit = () => {
      const el = document.getElementById("google_translate_element");
      if (!el || window.__widget_initialized) return;
      window.__widget_initialized = true;

      const { includedLanguages } = buildMaps();

      if (
        typeof window !== "undefined" &&
        window.google &&
        window.google.translate &&
        typeof window.google.translate.TranslateElement === "function"
      ) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages,
            multilanguagePage: true,
            autoDisplay: false,
            layout: window.google.translate.TranslateElement?.InlineLayout?.HORIZONTAL || "horizontal",
          },
          "google_translate_element"
        );

        setTimeout(() => {
          updateLanguageOptions();
        }, 300);

        setTimeout(() => {
          initializeLanguageMapping();
        }, 800);
      }
    };

    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.head.appendChild(script);
    }

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      clearInterval(feedbackLoop);
    };
  }, []);

  return <div id="google_translate_element" className="translate-widget-horizontal" />;
}
