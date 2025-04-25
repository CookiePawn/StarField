'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EditorSidebar, ZoomSidebar, Header, ContextMenu_Node, ContextMenu_Canvas } from './components';
import { Node, NodeContextMenu, Link, CanvasContextMenu } from './type'
import { useCanvas } from './hooks';
import styles from './styles/flow.module.css';

const FlowPage = () => {
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [draggingNode, setDraggingNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
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
  const nodeIdRef = useRef(1);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const canvasRef = useCanvas({
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
    setCanvasContextMenu
  });

  if (!isMounted) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />
      <EditorSidebar />
      <ZoomSidebar scale={scale} setScale={setScale} />
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onContextMenu={(e) => e.preventDefault()}
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
    </div>
  );
};

export default FlowPage;