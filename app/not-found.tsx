'use client';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - 페이지를 찾을 수 없습니다</h1>
        <p className="text-gray-600 mb-4">요청하신 페이지가 존재하지 않습니다.</p>
        <a href="/" className="text-blue-500 hover:text-blue-600">
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
} 