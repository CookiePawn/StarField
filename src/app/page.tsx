'use client';
import React, { useLayoutEffect } from 'react';

export default function Home() {
  useLayoutEffect(() => {
    if (window.innerWidth < 768) {
      window.location.href = '/m/flow';
    } else {
      window.location.href = '/flow';
    }
  }, []);
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '50px', height: '50px', border: '5px solid rgba(255, 255, 255, 0.3)', borderTop: '5px solid rgba(255, 255, 255, 0.8)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 