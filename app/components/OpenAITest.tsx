'use client';

import { useState } from 'react';

export default function OpenAITest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testOpenAI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/test-openai');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API 테스트 실패');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-bold mb-4">OpenAI API 테스트</h2>
      
      <button
        onClick={testOpenAI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? '테스트 중...' : 'API 테스트하기'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          <p className="font-bold">에러 발생:</p>
          <p>{error}</p>
        </div>
      )}

      {result && !error && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          <p className="font-bold">테스트 성공!</p>
          <p className="mt-2">API 응답: {result.response.content}</p>
        </div>
      )}
    </div>
  );
} 