'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorSidebar, ZoomSidebar, Header, ContextMenu_Node, ContextMenu_Canvas } from './components';
import { Node, NodeContextMenu, Link, CanvasContextMenu, Group } from './type'
import { useCanvas } from './hooks';
import styles from './styles/flow.module.css';
import { GroupNameInput } from './components/GroupNameInput';
import { NodeModal } from './components/NodeModal';

const FlowPage = () => {
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<NodeContextMenu>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: null
  });
  const [canvasContextMenu, setCanvasContextMenu] = useState<CanvasContextMenu>({
    visible: false,
    x: 0,
    y: 0
  });
  const nodeIdRef = useRef('1');
  const dragStart = useRef({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [dotColor, setDotColor] = useState('#777777');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const NODE_RADIUS = 30;
  const NODE_SPACING = NODE_RADIUS * 3;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { 
    canvasRef, 
    handleGroupNameUpdate, 
    handleGroupNameFinish,
    popupNode,
    popupTab,
    setPopupTab,
    inputText,
    setInputText,
    outputText,
    handleRun,
    setPopupNode
  } = useCanvas({
    isMounted,
    isGrabbing,
    isDragging,
    offset,
    scale,
    nodes,
    links,
    selectedNode,
    draggingNode,
    isConnecting,
    connectingFrom,
    mousePosition,
    setIsDragging,
    setDraggingNode,
    setSelectedNode,
    setNodes,
    setLinks,
    setOffset,
    setScale,
    setMousePosition,
    setIsGrabbing,
    setIsConnecting,
    setConnectingFrom,
    dragStart,
    setContextMenu,
    setCanvasContextMenu,
    dotColor,
    setEditingGroup
  });

  const getViewportCenter = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 화면 중앙의 캔버스 좌표 계산
    const centerX = (viewportWidth / 2 - offset.x) / scale;
    const centerY = (viewportHeight / 2 - offset.y) / scale;
    
    return { x: centerX, y: centerY };
  };

  const isPositionValid = (x: number, y: number, existingNodes: Node[]) => {
    return !existingNodes.some(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < NODE_SPACING;
    });
  };

  const findEmptyPosition = (existingNodes: Node[]) => {
    const center = getViewportCenter();
    let radius = 0;
    let angle = 0;
    const angleStep = Math.PI / 8; // 22.5도씩 회전

    // 나선형으로 검색하여 빈 공간 찾기
    while (radius < Math.min(window.innerWidth, window.innerHeight) / scale) {
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);

      if (isPositionValid(x, y, existingNodes)) {
        return { x, y };
      }

      angle += angleStep;
      if (angle >= Math.PI * 2) {
        angle = 0;
        radius += NODE_SPACING;
      }
    }

    // 적절한 위치를 못찾으면 중앙에 생성
    return center;
  };

  const handleAddNode = () => {
    const { x, y } = findEmptyPosition(nodes);
    const newNode: Node = {
        id: `node-${Date.now()}`,
        x,
        y,
        label: 'New Node',
        shape: 'circle',
        popup: false
    };
    setNodes([...nodes, newNode]);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setIsConnecting(true);
      setConnectingFrom(nodeId);
      return;
    }
    // 일반 드래그 모드일 때만 노드 이동
    if (!isConnecting) {
      setIsDragging(true);
      setDraggingNode(nodeId);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
    if (isConnecting && connectingFrom && connectingFrom !== nodeId) {
      // 새로운 링크 생성
      const newLink: Link = {
        id: `link-${Date.now()}`,
        from: connectingFrom,
        to: nodeId
      };
      setLinks([...links, newLink]);
    }
    setIsConnecting(false);
    setConnectingFrom(null);
    setIsDragging(false);
    setDraggingNode(null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isConnecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: (e.clientX - rect.left - offset.x) / scale,
          y: (e.clientY - rect.top - offset.y) / scale
        });
      }
    } else if (isDragging && draggingNode) {
      // 노드 드래그 로직
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      
      setNodes(nodes.map(node => {
        if (node.id === draggingNode) {
          return {
            ...node,
            x: node.x + dx,
            y: node.y + dy
          };
        }
        return node;
      }));
      
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggingNode(null);
    setIsConnecting(false);
    setConnectingFrom(null);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />
      <EditorSidebar onAddNode={handleAddNode} />
      <ZoomSidebar 
        scale={scale} 
        setScale={setScale} 
        dotColor={dotColor}
        setDotColor={setDotColor}
      />
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onContextMenu={(e) => e.preventDefault()}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      />
      {contextMenu.visible && contextMenu.nodeId !== null && (
        <ContextMenu_Node
          contextMenu={contextMenu}
          setContextMenu={setContextMenu}
          nodes={nodes}
          setNodes={setNodes}
          links={links}
          setLinks={setLinks}
        />
      )}
      {canvasContextMenu.visible && (
        <ContextMenu_Canvas
          contextMenu={canvasContextMenu}
          setContextMenu={setCanvasContextMenu}
          nodes={nodes}
          setNodes={setNodes}
          nodeIdRef={nodeIdRef}
          scale={scale}
          offset={offset}
        />
      )}
      {editingGroup && (
        <GroupNameInput
          group={editingGroup}
          scale={scale}
          offset={offset}
          onUpdate={handleGroupNameUpdate}
          onFinish={handleGroupNameFinish}
        />
      )}
      {popupNode && (
        <NodeModal
          x={popupNode.x * scale + offset.x - 250 * scale}
          y={popupNode.y * scale + offset.y + 60 * scale}
          scale={scale}
          setScale={setScale}
          tab={popupTab}
          onTabChange={setPopupTab}
          inputText={inputText}
          onInputTextChange={setInputText}
          onClose={() => setPopupNode(null)}
          onRun={handleRun}
          outputText={outputText}
        />
      )}
    </div>
  );
};

export default FlowPage;