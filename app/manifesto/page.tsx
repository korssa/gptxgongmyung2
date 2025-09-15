"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar } from "lucide-react";
import { blockTranslationFeedback } from "@/lib/translation-utils";

export default function ManifestoPage() {
  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 네비게이션 */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          onClick={handleBackToHome}
          className="bg-[#2e2e2e] text-white hover:bg-[#444] border border-gray-700 hover:border-gray-500 transition"
          onMouseEnter={blockTranslationFeedback}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="notranslate" translate="no">← Back to Homepage</span>
        </Button>
      </div>

      {/* 메모장 형식 콘텐츠 - 기존 content-manager 스타일 적용 */}
      <div className="w-full max-w-2xl mx-auto px-8 sm:px-12 lg:px-16 py-16" style={{ maxWidth: '672px' }}>
        {/* 헤더 */}
        <div className="border-b border-gray-600 pb-4 mb-6" onMouseEnter={blockTranslationFeedback}>
          <h1 className="text-3xl font-bold text-white mb-2" translate="no">&ldquo;We&apos;re just. that kind of group!&rdquo;</h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm">
            <span className="flex items-center gap-1"><User className="h-4 w-4" /><span translate="no">Gongmyung Team</span></span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* 본문 - 메모장 스타일 */}
        <article className="prose prose-invert dark:prose-invert" onMouseEnter={blockTranslationFeedback}>
          <pre
            className="text-gray-300 whitespace-pre-wrap leading-relaxed max-w-none font-mono"
            style={{ wordWrap: "break-word" }}
          >
{`🏢 About Gongmyung

We are a creative group that believes in the power of technology to make a difference. 
Our mission is to create innovative solutions that harmoniously blend creativity and purpose.

Founded in 2025, we're just getting started, but we're already making waves in the 
app development world with our unique approach to user experience and design.

💡 Our Philosophy

&ldquo;We&apos;re just. that kind of group!&rdquo; - This isn&apos;t just a slogan, it&apos;s our identity. 
We're the kind of group that:

• Thinks outside the box and challenges conventional wisdom
• Values creativity over conformity
• Believes in the power of collaboration and diverse perspectives
• Is passionate about creating meaningful digital experiences
• Never stops learning and evolving

🚀 What We Do

We specialize in creating innovative mobile applications that solve real-world problems 
while providing exceptional user experiences. Our portfolio includes:

• Mobile app development for iOS and Android
• User experience design and interface development
• Creative problem-solving and innovative solutions
• Community building and user engagement

🎯 Our Mission

To create digital experiences that matter.

We believe technology should enhance human connection, not replace it. 
Every app we create is designed with the user at the center, ensuring that 
our solutions are not just functional, but truly meaningful.

📧 Get in Touch

Want to work with us? Have an idea you'd like to discuss? 
We're always excited to hear from like-minded individuals and organizations.

📧 contact@gongmyung.com
🌐 gongmyung.com

---

© 2025 Gongmyung. All rights reserved.
&ldquo;We&apos;re just. that kind of group!&rdquo; — Since 2025`}
          </pre>
        </article>
      </div>
    </div>
  );
}
