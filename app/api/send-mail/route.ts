import { NextRequest, NextResponse } from 'next/server';

// SMTP 설정 함수
const createTransporter = async () => {
  const nodemailer = await import('nodemailer');
  return nodemailer.default.createTransport({
    service: 'gmail', // Gmail 사용 (다른 서비스로 변경 가능)
    auth: {
      user: process.env.SMTP_USER, // Gmail 주소
      pass: process.env.SMTP_PASS  // Gmail 앱 비밀번호
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    let name, email, subject, message, type, agreeToMarketing;
    let attachedFile: File | null = null;

    // Content-Type 확인하여 FormData인지 JSON인지 판단
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // FormData 처리 (이미지 첨부 포함)
      const formData = await request.formData();
      name = formData.get('name') as string;
      email = formData.get('email') as string;
      subject = formData.get('subject') as string;
      message = formData.get('message') as string;
      type = formData.get('type') as string;
      agreeToMarketing = formData.get('agreeToMarketing') === 'true';
      
      const file = formData.get('file') as File;
      if (file && file.size > 0) {
        attachedFile = file;
      }
    } else {
      // JSON 처리 (기존 방식)
      const body = await request.json();
      name = body.name;
      email = body.email;
      subject = body.subject;
      message = body.message;
      type = body.type;
      agreeToMarketing = body.agreeToMarketing;
    }

    // 필수 필드 검증
    if (!name || !email || !subject) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Events 타입이 아닐 때만 message 필드 검증
    if (type !== 'events' && !message) {
      return NextResponse.json(
        { error: 'Please fill in all fields.' },
        { status: 400 }
      );
    }

    // 이벤트 타입일 때 체크박스 검증
    if (type === 'events' && !agreeToMarketing) {
      return NextResponse.json(
        { error: 'You need to agree to the terms to receive the gift.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email format.' },
        { status: 400 }
      );
    }

    // SMTP 설정 확인
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { error: 'SMTP configuration is not complete.' },
        { status: 500 }
      );
    }

    // 메일 제목에 타입 정보 추가
    const mailSubject = `[${type.toUpperCase()}] ${subject}`;

    // 메일 내용 구성
    const mailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
          📧 새로운 메시지가 도착했습니다
        </h2>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">📋 메시지 정보</h3>
          <p><strong>타입:</strong> ${type}</p>
          <p><strong>이름:</strong> ${name}</p>
          <p><strong>이메일:</strong> ${email}</p>
          <p><strong>제목:</strong> ${subject}</p>
          ${type === 'events' ? `<p><strong>마케팅 동의:</strong> ${agreeToMarketing ? '동의함' : '동의하지 않음'}</p>` : ''}
        </div>
        
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #374151; margin-top: 0;">💬 메시지 내용</h3>
          <p style="white-space: pre-wrap; line-height: 1.6;">${message || (type === 'events' ? 'No additional message provided.' : '')}</p>
          ${attachedFile ? `<p style="margin-top: 10px;"><strong>📎 첨부 파일:</strong> ${attachedFile.name} (${(attachedFile.size / 1024).toFixed(1)} KB)</p>` : ''}
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 14px; color: #6b7280;">
          <p><strong>전송 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
                     <p><strong>IP 주소:</strong> ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '알 수 없음'}</p>
        </div>
      </div>
    `;

    // transporter 생성
    const transporter = await createTransporter();

    // 메일 전송 옵션 준비
    const mailOptions: {
      from: string;
      to: string;
      subject: string;
      html: string;
      replyTo: string;
      attachments?: Array<{ filename: string; content: Buffer }>;
    } = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // 자신에게 받기 (또는 다른 이메일로 변경)
      subject: mailSubject,
      html: mailContent,
      replyTo: email // 답장 시 발신자에게 답장되도록 설정
    };

    // 첨부 파일이 있으면 추가
    if (attachedFile) {
      mailOptions.attachments = [{
        filename: attachedFile.name,
        content: Buffer.from(await attachedFile.arrayBuffer())
      }];
    }

    await transporter.sendMail(mailOptions);

          // Mail sent successfully

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully!' 
    });

  } catch (error) {
    // Mail sending failed
    
    // 더 자세한 오류 정보 제공
    let errorMessage = 'Failed to send message. Please try again.';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
