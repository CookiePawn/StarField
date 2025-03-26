'use client';
import React, { useLayoutEffect } from 'react';

export default function Home() {
  useLayoutEffect(() => {
    window.location.href = '/flow';
  }, []);
  return <div>Home</div>;
} 