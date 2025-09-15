export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Gongmyung's App Gallery",
    "description": "Gongmyung이 직접 제작하고 큐레이션한 독창적인 앱들의 갤러리입니다.",
    "url": "https://gongmyung.com",
    "author": {
      "@type": "Person",
      "name": "Gongmyung"
    },
    "publisher": {
      "@type": "Person",
      "name": "Gongmyung"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://gongmyung.com?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Gongmyung's App Gallery",
    "url": "https://gongmyung.com",
    "logo": "https://gongmyung.com/logo.png",
    "description": "독창적인 앱 개발과 큐레이션을 전문으로 하는 Gongmyung의 앱 갤러리",
    "sameAs": [
      // 소셜 미디어 링크가 있다면 여기에 추가
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "홈",
        "item": "https://gongmyung.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "앱 갤러리",
        "item": "https://gongmyung.com/#all-apps"
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
