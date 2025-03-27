'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ZoomSidebar, ContextMenu, NodeInfo, NodeContextMenu } from './components';
import { Node, Link, ContextMenu as ContextMenuType, NodeContextMenuState } from './type';
import { useCanvas } from './hooks/useCanvas';
import { handleAddNode, handleNodeDelete, handleNodeRename, handleNodeConnect } from './utils/canvas';

const FlowPage = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingNode, setIsDraggingNode] = useState(false);
    const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [contextMenu, setContextMenu] = useState<ContextMenuType>({
        visible: false,
        x: 0,
        y: 0
    });
    const [nodeContextMenu, setNodeContextMenu] = useState<NodeContextMenuState>({
        visible: false,
        x: 0,
        y: 0,
        node: null
    });
    const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
    const nodeIdRef = useRef(1);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const canvasRef = useCanvas({
        isMounted,
        offset,
        scale,
        isDragging,
        isDraggingNode,
        draggingNodeId,
        nodes,
        links,
        selectedNode,
        connectingFrom,
        mousePosition,
        setOffset,
        setNodes,
        setSelectedNode,
        setIsDragging,
        setIsDraggingNode,
        setDraggingNodeId,
        setConnectingFrom,
        setMousePosition,
        setLinks,
        setNodeContextMenu,
        setContextMenu
    });

    if (!isMounted) {
        return null;
    }

    return (
        <div
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                position: 'relative',
                top: 0,
                left: 0,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <ZoomSidebar scale={scale} setScale={setScale} />
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000000',
                    cursor: isDraggingNode ? 'grabbing' : isDragging ? 'grabbing' : 'grab',
                }}
            />
            <ContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
                onAddNode={() => handleAddNode(canvasRef, contextMenu, offset, scale, setNodes, setContextMenu, nodes, nodeIdRef)}
            />
            <NodeContextMenu
                visible={nodeContextMenu.visible}
                x={nodeContextMenu.x}
                y={nodeContextMenu.y}
                node={nodeContextMenu.node}
                onClose={() => setNodeContextMenu({ visible: false, x: 0, y: 0, node: null })}
                onDelete={() => handleNodeDelete(nodeContextMenu, setNodes, setNodeContextMenu, nodes)}
                onRename={(newLabel) => handleNodeRename(nodeContextMenu, setNodes, setNodeContextMenu, nodes, newLabel)}
                onConnect={() => handleNodeConnect(nodeContextMenu, setConnectingFrom, setSelectedNode, setNodeContextMenu, nodes)}
            />
            <NodeInfo
                node={selectedNode}
                links={links}
                nodes={nodes}
                onClose={() => setSelectedNode(null)}
            />
        </div>
    );
};

export default FlowPage;
