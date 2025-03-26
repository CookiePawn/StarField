'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
}

interface Link {
  from: number;
  to: number;
}

const FlowPage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const nodeIdRef = useRef(1);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 스페이스바 이벤트 처리
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsGrabbing(true);
        canvas.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsGrabbing(false);
        canvas.style.cursor = 'default';
      }
    };

    // 마우스 이벤트 처리
    const handleMouseDown = (e: MouseEvent) => {
      if (!isGrabbing) {
        // 노드 드래그 시작
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - offset.x) / scale;
        const y = (e.clientY - rect.top - offset.y) / scale;
        
        // 클릭한 위치에 노드가 있는지 확인
        const clickedNode = nodes.find(node => {
          const dx = node.x - x;
          const dy = node.y - y;
          return Math.sqrt(dx * dx + dy * dy) <= 30;
        });

        if (clickedNode) {
          setDraggingNode(clickedNode.id);
          if (selectedNode === null) {
            setSelectedNode(clickedNode.id);
          } else {
            setLinks([...links, { from: selectedNode, to: clickedNode.id }]);
            setSelectedNode(null);
          }
        } else {
          // 새 노드 추가
          const newNode = {
            id: nodeIdRef.current++,
            x,
            y,
            label: `Node ${nodeIdRef.current - 1}`,
          };
          setNodes([...nodes, newNode]);
          setSelectedNode(null);
        }
      } else {
        setIsDragging(true);
        canvas.style.cursor = 'grabbing';
        dragStart.current = {
          x: e.clientX - offset.x,
          y: e.clientY - offset.y
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        if (draggingNode !== null) {
          // 노드 드래그
          const rect = canvas.getBoundingClientRect();
          const newX = (e.clientX - rect.left - offset.x) / scale;
          const newY = (e.clientY - rect.top - offset.y) / scale;
          setNodes(nodes.map(node =>
            node.id === draggingNode ? { ...node, x: newX, y: newY } : node
          ));
        } else {
          // 화면 드래그
          setOffset({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggingNode(null);
      canvas.style.cursor = isGrabbing ? 'grab' : 'default';
    };

    // 휠 이벤트 처리
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 새로운 스케일 계산
      const delta = e.deltaY;
      const newScale = Math.max(0.5, Math.min(2, scale - delta / 1000));

      // 마우스 포인터 위치를 기준으로 offset 조정
      const worldX = (mouseX - offset.x) / scale;
      const worldY = (mouseY - offset.y) / scale;
      const newOffsetX = mouseX - worldX * newScale;
      const newOffsetY = mouseY - worldY * newScale;

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // 캔버스 크기를 화면 크기로 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 배경과 노드 그리기
    const drawBackground = () => {
      // 검은색 배경
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 흰색 점 그리기
      ctx.fillStyle = '#ffffff';
      const dotSize = 1;
      const spacing = 50;

      // 현재 보이는 영역의 점만 그리기
      const startX = Math.floor(-offset.x / (spacing * scale)) * spacing * scale;
      const startY = Math.floor(-offset.y / (spacing * scale)) * spacing * scale;
      const endX = startX + canvas.width + spacing * scale;
      const endY = startY + canvas.height + spacing * scale;

      for (let x = startX; x < endX; x += spacing * scale) {
        for (let y = startY; y < endY; y += spacing * scale) {
          ctx.beginPath();
          ctx.arc(x + offset.x, y + offset.y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 링크 그리기
      ctx.strokeStyle = 'gray';
      ctx.lineWidth = 2;
      links.forEach(link => {
        const fromNode = nodes.find(n => n.id === link.from);
        const toNode = nodes.find(n => n.id === link.to);
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x * scale + offset.x, fromNode.y * scale + offset.y);
          ctx.lineTo(toNode.x * scale + offset.x, toNode.y * scale + offset.y);
          ctx.stroke();
        }
      });

      // 노드 그리기
      nodes.forEach(node => {
        // 노드 배경
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, 30 * scale, 0, Math.PI * 2);
        ctx.fill();

        // 노드 테두리
        if (selectedNode === node.id) {
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // 노드 텍스트
        ctx.fillStyle = 'black';
        ctx.font = `${12 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x * scale + offset.x, node.y * scale + offset.y);
      });
    };

    drawBackground();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isGrabbing, isDragging, offset, scale, nodes, links, selectedNode]);

  return (
    <div 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: '#000000',
        }}
      />
    </div>
  );
};

export default FlowPage;