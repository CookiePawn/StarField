'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DotGrid } from '../components';
import { handleWheel, addNode, onDrag } from '../utils';
import { NodeType, LinkType } from '../Models';

export default function MindMap() {
  /** @description 노드 및 링크 상태 */
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [links, setLinks] = useState<LinkType[]>([]);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const nodeIdRef = useRef(1);

  /** @description 화면 이동 관련 상태 */
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [panOffset, setPanOffset] = useState({ 
    x: window.innerWidth / 2 - 8000,  // 5000의 중앙으로 이동
    y: window.innerHeight / 2 - 8000  
  });
  const panStart = useRef({ x: 0, y: 0 });

  /** @description 줌 비율 및 컨테이너 참조 */
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  /** 스페이스바 눌렀을 때 화면 이동 모드 활성화 */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setIsPanning(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /** 화면 이동 시작 */
  const startPan = (event: React.MouseEvent) => {
    if (!isPanning) return;
    setIsDragging(true);
    panStart.current = { x: event.clientX - panOffset.x, y: event.clientY - panOffset.y };
  };

  /** 화면 이동 중 */
  const onPan = (event: React.MouseEvent) => {
    if (!isDragging) return;
    let newX = event.clientX - panStart.current.x;
    let newY = event.clientY - panStart.current.y;

    // 스케일에 따른 끝점 좌표 계산
    const maxX = (scale - 0.5) * 8000;
    const maxY = -(scale - 0.5) * 8000;

    console.log(maxX, maxY);

    const minX = -(10081 + (scale - 0.5) * 8000);
    const minY = -(11000 + (scale - 0.5) * 8000);

    // 이동 범위 제한
    newX = Math.min(Math.max(newX, minX), maxX);
    newY = Math.min(Math.max(newY, minY), maxY);

    setPanOffset({ x: newX, y: newY }); 
  };

  /** 화면 이동 종료 */
  const stopPan = () => {
    setIsDragging(false);
  };

  /** 노드 드래그 시작 */
  const startDrag = (id: number) => {
    if (isPanning) return;
    setDraggingNode(id);
  };

  /** 드래그 종료 */
  const stopDrag = () => {
    setDraggingNode(null);
  };

  /** 노드 선택 및 연결 */
  const selectNode = (id: number) => {
    if (selectedNode === null) {
      setSelectedNode(id);
    } else {
      setLinks([...links, { from: selectedNode, to: id }]);
      setSelectedNode(null);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        backgroundColor: 'black',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <div
          ref={containerRef}
          onWheel={(e) => handleWheel(e, scale, setScale)}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
            transformOrigin: 'center',
            width: 16000,
            height: 16000,
            position: 'absolute',
            cursor: isPanning ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onMouseDown={startPan}
          onMouseMove={onPan}
          onMouseUp={stopPan}
          onMouseLeave={stopPan}
        >
          <DotGrid />
          <svg
            width="100%"
            height="100%"
            onClick={(e) => {
              if (!isPanning) {
                addNode(e, containerRef, scale, nodes, setNodes, nodeIdRef);
                setSelectedNode(null);
              }
            }}
            onMouseMove={(e) => onDrag(e, draggingNode, containerRef, scale, setNodes)}
            onMouseUp={stopDrag}
            style={{
              border: '1px solid white',
            }}
          >
            {/* 링크(선) 그리기 */}
            {links.map((link, index) => {
              const fromNode = nodes.find((n) => n.id === link.from);
              const toNode = nodes.find((n) => n.id === link.to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={index}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="gray"
                  strokeWidth="2"
                />
              );
            })}

            {/* 노드 그리기 */}
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startDrag(node.id);
                }}
                onClick={(e) => {
                  if (!isPanning) {
                    e.stopPropagation();
                    selectNode(node.id);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="0" cy="0" r="30" style={{ fill: 'white', stroke: selectedNode === node.id ? 'red' : 'none', strokeWidth: 2 }} />
                <text x="0" y="5" fontSize="12" textAnchor="middle" fill="black">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
