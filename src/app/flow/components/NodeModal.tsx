import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

interface NodeModalProps {
  x: number;
  y: number;
  scale: number;
  setScale: Dispatch<SetStateAction<number>>;
  tab: 'input' | 'results' | 'settings';
  onTabChange: (tab: 'input' | 'results' | 'settings') => void;
  inputText: string;
  onInputTextChange: (v: string) => void;
  onClose: () => void;
  onRun: (inputText: string, instruction: string) => void;
  outputText: string;
}

export const callGeminiAPI = async (inputText: string, instruction?: string) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  const API_URL = process.env.GEMINI_API_URL + '?key=' + API_KEY;

  const prompt = instruction ? `${instruction}\n\n${inputText}` : inputText;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 호출 실패 상세:', errorText);
      throw new Error('API 호출 실패: ' + errorText);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text || '응답이 없습니다.';
  } catch (error) {
    console.error('API 호출 중 오류 발생:', error);
    throw error;
  }
};

export function NodeModal({
  x, y, scale, setScale, tab, onTabChange, inputText, onInputTextChange, onRun, outputText
}: NodeModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setScale(prev => Math.max(0.1, Math.min(3, prev + delta)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setScale]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 500 * scale,
        background: '#1e1e1e',
        border: '2px solid #444',
        borderRadius: 16 * scale,
        zIndex: 1000,
        color: 'white',
        padding: 24 * scale,
        boxShadow: `0 ${8 * scale}px ${32 * scale}px rgba(0,0,0,0.25)`,
        fontSize: 16 * scale
      }}
    >
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', marginRight: 24 }}>
          <button onClick={() => onTabChange('input')} style={{ marginBottom: 8 * scale, background: tab === 'input' ? '#333' : '#222', color: 'white', border: 'none', borderRadius: 8 * scale, fontSize: 22 * scale, width: 48 * scale, height: 48 * scale }}>✏️</button>
          <button onClick={() => onTabChange('results')} style={{ marginBottom: 8 * scale, background: tab === 'results' ? '#333' : '#222', color: 'white', border: 'none', borderRadius: 8 * scale, fontSize: 22 * scale, width: 48 * scale, height: 48 * scale }}>📄</button>
          <button onClick={() => onTabChange('settings')} style={{ background: tab === 'settings' ? '#333' : '#222', color: 'white', border: 'none', borderRadius: 8 * scale, fontSize: 22 * scale, width: 48 * scale, height: 48 * scale }}>⚙️</button>
        </div>
        <div style={{ flex: 1 }}>
          {tab === 'input' && (
            <>
              <textarea
                value={inputText}
                onChange={e => onInputTextChange(e.target.value)}
                style={{ width: '100%', height: 120 * scale, background: '#222', color: 'white', borderRadius: 8 * scale, border: '1px solid #555', fontSize: 16 * scale, padding: 12 * scale }}
                placeholder="여기에 텍스트를 입력하세요..."
              />
              <button
                style={{
                  marginTop: 12 * scale,
                  width: '100%',
                  padding: 12 * scale,
                  fontSize: 16 * scale,
                  borderRadius: 8 * scale,
                  background: '#4a8cff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => onRun(inputText, instruction)}
              >
                실행
              </button>
            </>
          )}
          {tab === 'results' && (
            <div style={{ padding: 16 * scale, color: '#ccc', fontSize: 16 * scale, whiteSpace: 'pre-wrap' }}>{outputText}</div>
          )}
          {tab === 'settings' && (
            <div style={{ padding: 8 * scale }}>
              <div style={{ marginBottom: 12 * scale }}>
                <label style={{ fontWeight: 600, fontSize: 16 * scale }}>API 모델</label>
                <select style={{ marginLeft: 12 * scale, background: '#222', color: 'white', borderRadius: 6 * scale, border: '1px solid #555', fontSize: 16 * scale }}>
                  <option>gpt-3.5-turbo</option>
                  <option>gpt-4</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 * scale }}>
                <label style={{ fontWeight: 600, fontSize: 16 * scale }}>Max Token</label>
                <input type="range" min={10} max={4000} defaultValue={1000} style={{ width: 200 * scale, marginLeft: 12 * scale }} />
              </div>
              <div style={{ marginBottom: 12 * scale }}>
                <label style={{ fontWeight: 600, fontSize: 16 * scale }}>온도</label>
                <input type="range" min={0} max={2} step={0.01} defaultValue={1} style={{ width: 200 * scale, marginLeft: 12 * scale }} />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: 16 * scale }}>지침(룰)</label>
                <textarea 
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  style={{ width: '100%', height: 60 * scale, background: '#222', color: 'white', borderRadius: 8 * scale, border: '1px solid #555', fontSize: 14 * scale, padding: 8 * scale, marginTop: 4 * scale }} 
                  placeholder="지침을 입력하세요..." 
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 