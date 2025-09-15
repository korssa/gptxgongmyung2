"use client";

import { useEffect } from "react";

export function GoogleTranslateWidget() {
  // ✅ 컴포넌트 안에 선언
  function normalizeCode(code: string): string {
    if (!code) return "";
    const parts = code.split("-");
    if (parts.length === 1) return parts[0].toLowerCase(); 
    return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
  }

  useEffect(() => {
    function buildMaps() {
      const entries: Array<[string, string, string]> = [
  ["en", "-", "English"],
  ["es", "-", "Español"],
 
  ["fr", "-", "Français"],
  ["de", "-", "Deutsch"],
  ["ar", "-", "العربية"],
  ["ru", "-", "Русский"],
  ["pt", "-", "Português"],
  ["ja", "-", "日本語"],
  ["ko", "-", "한국어"],
    ["af", "South Africa", "Afrikaans"],
["am", "Ethiopia", "አማርኛ"],

["az", "Azerbaijan", "Azərbaycan dili"],
["be", "Belarus", "Беларуская"],
["bg", "Bulgaria", "Български"],
["bn", "Bangladesh", "বাংলা"],
["bs", "Bosnia", "Bosanski"],
["ca", "Catalonia", "Català"],
["ceb", "Philippines", "Cebuano"],
["cs", "Czech Republic", "Čeština"],
["cy", "Wales", "Cymraeg"],
["pt-BR", "Brazil", "Português (BR)"],

["el", "Greece", "Ελληνικά"],

["en-GB", "UK", "English"],

["en-au", "Australia", "English"],
["eo", "Esperanto", "Esperanto"],

["es-mx", "Mexico", "Español (México)"],
["et", "Estonia", "Eesti"],
["fa", "Iran", "فارسی"],
["fi", "Finland", "Suomi"],

["fr-ca", "Canada", "Français"],
["fy", "Netherlands", "Frysk"],
["ga", "Ireland", "Gaeilge"],
["gd", "Scotland", "Gàidhlig"],
["gl", "Spain", "Galego"],
["gu", "India", "ગુજરાતી"],
["ha", "Nigeria", "Hausa"],
["haw", "Hawaii", "ʻŌlelo Hawaiʻi"],
["he", "Israel", "עברית"],
["hi", "India", "हिन्दी"],
["hmn", "Hmong", "Hmoob"],
["hr", "Croatia", "Hrvatski"],
["ht", "Haiti", "Kreyòl ayisyen"],
["hu", "Hungary", "Magyar"],
["hy", "Armenia", "Հայերեն"],
["id", "Indonesia", "Bahasa Indonesia"],
["ig", "Nigeria", "Igbo"],
["is", "Iceland", "Íslenska"],
["it", "Italy", "Italiano"],

["jv", "Indonesia", "Jawa"],
["ka", "Georgia", "ქართული"],
["kk", "Kazakhstan", "Қазақ тілі"],
["km", "Cambodia", "ភាសាខ្មែរ"],
["kn", "India", "ಕನ್ನಡ"],

["ku", "Kurdistan", "Kurdî"],
["ky", "Kyrgyzstan", "Кыргызча"],
["la", "Ancient Rome", "Latina"],
["lb", "Luxembourg", "Lëtzebuergesch"],
["lo", "Laos", "ລາວ"],
["lt", "Lithuania", "Lietuvių"],
["lv", "Latvia", "Latviešu"],
["mg", "Madagascar", "Malagasy"],
["mi", "New Zealand", "Māori"],
["mk", "North Macedonia", "Македонски"],
["ml", "India", "മലയാളം"],
["mn", "Mongolia", "Монгол"],
["mr", "India", "मराठी"],
["ms", "Malaysia", "Bahasa Melayu"],
["mt", "Malta", "Malti"],
["my", "Myanmar", "မြန်မာစာ"],
["ne", "Nepal", "नेपाली"],
["nl", "Netherlands", "Nederlands"],
["no", "Norway", "Norsk"],
["ny", "Malawi", "Nyanja"],
["or", "India", "ଓଡ଼ିଆ"],
["pa", "India", "ਪੰਜਾਬੀ"],
["pl", "Poland", "Polski"],
["ps", "Afghanistan", "پښتو"],

["pt-br", "Brazil", "Português (BR)"],
["ro", "Romania", "Română"],

["rw", "Rwanda", "Kinyarwanda"],
["sd", "Pakistan", "سنڌي"],
["si", "Sri Lanka", "සිංහල"],
["sk", "Slovakia", "Slovenčina"],
["sl", "Slovenia", "Slovenščina"],
["sm", "Samoa", "Gagana Samoa"],
["sn", "Zimbabwe", "Shona"],
["so", "Somalia", "Soomaali"],
["sq", "Albania", "Shqip"],
["sr", "Serbia", "Српски"],
["st", "Lesotho", "Sesotho"],
["su", "Indonesia", "Basa Sunda"],
["sv", "Sweden", "Svenska"],
["sw", "East Africa", "Kiswahili"],
["ta", "India", "தமிழ்"],
["te", "India", "తెలుగు"],
["tg", "Tajikistan", "Тоҷикӣ"],
["th", "Thailand", "ไทย"],
["tk", "Turkmenistan", "Türkmençe"],
["tl", "Philippines", "Tagalog"],
["tr", "Turkey", "Türkçe"],
["tt", "Tatarstan", "Татар"],
["ug", "Xinjiang", "ئۇيغۇرچە"],
["uk", "Ukraine", "Українська"],
["ur", "Pakistan", "اردو"],
["uz", "Uzbekistan", "Oʻzbekcha"],
["vi", "Vietnam", "Tiếng Việt"],
["xh", "South Africa", "isiXhosa"],
["yi", "Ashkenazi", "ייִדיש"],
["yo", "Nigeria", "Yorùbá"],
["zu", "South Africa", "isiZulu"],
];

   // 중국어는 별도 매핑 (강제 오버라이드)
     const langLabelMap: Record<string, string> = {
  // === 중국어 계열 ===
  zh: "China - 中文(简体)",
  "zh-CN": "- - 中文(简体)",
  "zh-SG": "Singapore - 中文(简体, 新加坡)",
  "zh-MY": "Malaysia - 中文(简体, 马来西亚)",
  "zh-TW": "Taiwan - 中文(繁體)",
  "zh-HK": "Hong Kong - 中文(繁體, 香港)",
  "zh-MO": "Macau - 中文(繁體, 澳門)",

  // === 영어 계열 ===
  "en-GB": "UK - English",
  "en-CA": "Canada - English",
  "en-AU": "Australia - English",
  "en-IN": "India - English",
  "en-SG": "Singapore - English",
  "en-ZA": "South Africa - English",
  "en-IE": "Ireland - English",
  "en-NZ": "New Zealand - English",

  // === 스페인어 계열 ===
  "es-MX": "Mexico - Español (México)",
  "es-419": "Latin America - Español (LatAm)",

  // === 프랑스어 계열 ===
  "fr-CA": "Canada - Français",

  // === 포르투갈어 계열 ===
  "pt-BR": "Brazil - Português (BR)",

  // === 세르비아 / 우즈벡 / 몽골어 등 스크립트 변형 ===
  "sr-Latn": "Serbia - Srpski (Latin)",
  "uz-Cyrl": "Uzbekistan - Oʻzbekcha (Cyrillic)",
  "mn-Cyrl": "Mongolia - Монгол (Cyrillic)",
};

      const countryByLang: Record<string, string> = {};
      const nativeByLang: Record<string, string> = {};
      const included = new Set<string>();

      for (const [code, country, native] of entries) {
        const normCode = normalizeCode(code); // ✅ 정규화
        const base = normCode.split("-")[0];

        countryByLang[normCode] = country;
        nativeByLang[normCode] = native;

        if (!countryByLang[base]) countryByLang[base] = country;
        if (!nativeByLang[base]) nativeByLang[base] = native;

        included.add(normCode);
      }

      // 중국어 매핑 강제 적용
      for (const code in langLabelMap) {
        const [country, native] = langLabelMap[code].split(" - ");
        countryByLang[code] = country;
        nativeByLang[code] = native;
        included.add(code);
      }

      return {
        countryByLang,
        nativeByLang,
        includedLanguages: Array.from(included).join(","),
      };
    }

    // ====== 2) 콤보 옵션 업데이트 ======
    function updateLanguageOptions() {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (!combo || !combo.options) return;

      const { countryByLang, nativeByLang } = buildMaps();
      const options = Array.from(combo.options);
      const selectedValue = combo.value;

      options.forEach((option) => {
        if (option.dataset.updated === "true") return;

        const code = normalizeCode(option.value);
        const base = code.split("-")[0];

        const country = countryByLang[code] ?? countryByLang[base] ?? base.toUpperCase();
        const native = nativeByLang[code] ?? nativeByLang[base] ?? (option.text.trim() || base);

        option.text = `${country} - ${native}`;
        option.dataset.updated = "true";
        option.value = code; // ✅ 정규화된 코드로 교체
      });

      options.sort((a, b) => a.text.localeCompare(b.text));
      combo.innerHTML = "";
      options.forEach((opt) => combo.appendChild(opt));

      const selectedOption = options.find((opt) => opt.value === normalizeCode(selectedValue));
      if (selectedOption) {
        selectedOption.selected = true;
        combo.value = selectedOption.value;
      }
    }
    function hideFeedbackElements() {
      const feedbackSelectors = [
        ".goog-te-balloon-frame",
        ".goog-te-ftab",
        ".goog-te-ftab-float",
        ".goog-tooltip",
        ".goog-tooltip-popup",
        ".goog-te-banner-frame",
        ".goog-te-spinner-pos",
      ];
      feedbackSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const e = el as HTMLElement;
          e.style.display = "none";
          e.style.visibility = "hidden";
          e.style.opacity = "0";
        });
      });
    }

    function handleAdminModeChange(enabled: boolean) {
      try {
        const saveDraftSafely = () => {
          try {
            const event = new CustomEvent("memo:save-draft");
            window.dispatchEvent(event);
          } catch {
            // no-op
          }
        };
        saveDraftSafely();
      } catch {
        // no-op
      }

      if (enabled) {
        try {
          document.documentElement.setAttribute("translate", "no");
          document.body.setAttribute("translate", "no");

          const elements = document.querySelectorAll(
            ".goog-te-combo, .goog-te-gadget, .skiptranslate, iframe[src*='translate']"
          );
          elements.forEach((el) => {
            const e = el as HTMLElement;
            e.style.display = "none";
            e.style.visibility = "hidden";
            e.style.opacity = "0";
            e.style.pointerEvents = "none";
          });

          if (window.google) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window.google as any).translate = {
              TranslateElement: function () {
                return null;
              },
            };
          }
        } catch {
          // no-op
        }
      } else {
        try {
          document.documentElement.removeAttribute("translate");
          document.body.removeAttribute("translate");

          const elements = document.querySelectorAll(".goog-te-combo, .goog-te-gadget, .skiptranslate");
          elements.forEach((el) => {
            const e = el as HTMLElement;
            e.style.display = "";
            e.style.visibility = "";
            e.style.opacity = "";
            e.style.pointerEvents = "";
          });

          setTimeout(() => {
            if (typeof window.googleTranslateElementInit === "function") {
              window.googleTranslateElementInit();
            }
          }, 500);
        } catch {
          // no-op
        }
      }
    }

    window.adminModeChange = handleAdminModeChange;

    function initializeLanguageMapping() {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (!combo || combo.options.length < 2) return false;

      updateLanguageOptions();
      hideFeedbackElements();

      combo.removeEventListener("change", handleComboChange);
      combo.addEventListener("change", handleComboChange);

      return true;
    }

    // 실시간 피드백 감시 루프 (5초마다 재시도)
    let feedbackLoop: number | undefined;
    function startFeedbackLoop() {
      if (feedbackLoop) window.clearInterval(feedbackLoop);
      feedbackLoop = window.setInterval(() => {
        hideFeedbackElements();
      }, 5000);
    }

    // 번역 피드백 DOM 전담 감시자
    function watchTranslationFeedback() {
      const feedbackObserver = new MutationObserver(() => {
        hideFeedbackElements();
      });

      feedbackObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return feedbackObserver;
    }

    function handlePageRefresh() {
      sessionStorage.setItem("widget-needs-refresh", "true");
    }

   /* function checkAndRefreshWidget() {
      const needsRefresh = sessionStorage.getItem("widget-needs-refresh");
      if (needsRefresh === "true") {
        sessionStorage.removeItem("widget-needs-refresh");
        setTimeout(() => {
          refreshWidget();
        }, 1000);
      }
    } */

    function handleComboChange() {
      setTimeout(() => {
        updateLanguageOptions();
        hideFeedbackElements();
        setTimeout(() => {
          const el = document.getElementById("google_translate_element");
          if (el) (el as HTMLElement).style.opacity = "0";
        }, 1000);
      }, 100);
    }

    function addRefreshButton() {
      const existing = document.querySelector('button[title="Google Translate 위젯 새로고침"]');
      if (existing) return;

      const refreshButton = document.createElement("button");
      refreshButton.textContent = "🔄";
      refreshButton.title = "Google Translate 위젯 새로고침";
      refreshButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 10000;
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 16px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;

      refreshButton.addEventListener("click", () => {
        //refreshWidget();
      });

      document.body.appendChild(refreshButton);
    }

    // Google 번역 스크립트 삽입
    if (!document.querySelector('script[src*="translate.google.com"]')) {
      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.id = "google-translate-script";
      document.head.appendChild(script);
    }

// 콜백 함수 설정 (layout은 조건부로만 추가)
if (typeof window.googleTranslateElementInit !== "function") {
  window.googleTranslateElementInit = () => {
    const target = document.getElementById("google_translate_element");

    if (window.__widget_initialized === true) return;
    if (!target) return;

    window.__widget_initialized = true; // 🎯 초기화 완료 플래그

    if (window.google?.translate?.TranslateElement) {
      const { countryByLang, nativeByLang, includedLanguages } = buildMaps();
    

new window.google.translate.TranslateElement(
  {
    pageLanguage: "en-us",
     includedLanguages,
    multilanguagePage: true,
    autoDisplay: false,
    layout: window.google.translate.TranslateElement?.InlineLayout?.HORIZONTAL || "horizontal",
  },
  "google_translate_element"
);

setTimeout(() => {
  updateLanguageOptions(); // ✅ 이걸 콤보 생성 직후 강제로 실행
}, 300);
// ✅ 초기 진입 시 라벨 매핑을 delay 후 강제 적용
setTimeout(() => {
  initializeLanguageMapping();
}, 800); // 약간의 렌더링 대기 시간

    }
  };
}

    // 옵저버 및 루프 시작
    const initObserver = new MutationObserver(() => {
      if (initializeLanguageMapping()) {
        initObserver.disconnect();
        startFeedbackLoop();
      }
    });

    let feedbackObserver: MutationObserver | null = null;

    const onLoad = () => {
      //checkAndRefreshWidget();
      initObserver.observe(document.body, { childList: true, subtree: true });
      feedbackObserver = watchTranslationFeedback();
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    window.addEventListener("beforeunload", handlePageRefresh);

    if (process.env.NODE_ENV === "development") {
      setTimeout(addRefreshButton, 2000);
    }

    // cleanup
    return () => {
      const existingScript = document.querySelector('script[src*="translate.google.com"]');
      if (existingScript) document.head.removeChild(existingScript);

      initObserver.disconnect();
      window.removeEventListener("beforeunload", handlePageRefresh);
      window.removeEventListener("load", onLoad);

      const refreshButton = document.querySelector('button[title="Google Translate 위젯 새로고침"]');
      if (refreshButton && refreshButton.parentElement) {
        refreshButton.parentElement.removeChild(refreshButton);
      }

      if (feedbackLoop) window.clearInterval(feedbackLoop);
      if (feedbackObserver) {
        feedbackObserver.disconnect();
      }
    };
  }, []);

  return (
    <div
      id="google_translate_element"
      className="translate-widget-horizontal flex-shrink-0"
      suppressHydrationWarning={true}
    />
  );
}
