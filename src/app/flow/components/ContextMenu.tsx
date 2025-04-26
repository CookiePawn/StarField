import React from 'react';
import { NodeContextMenu, Node, Link, CanvasContextMenu } from '../type';
import styles from '../styles/contextMunu.module.css';

export const ContextMenu_Node: React.FC<{
    contextMenu: NodeContextMenu;
    setContextMenu: (contextMenu: NodeContextMenu) => void;
    nodes: Node[];
    setNodes: (nodes: Node[]) => void;
    links: Link[];
    setLinks: (links: Link[]) => void;
}> = ({
    contextMenu,
    setContextMenu,
    nodes,
    setNodes,
    links,
    setLinks,
}) => {
        const handleRenameNode = (nodeId: string) => {
            const newLabel = prompt('새로운 노드 이름을 입력하세요:');
            if (newLabel) {
                setNodes(nodes.map(node =>
                    node.id === nodeId ? { ...node, label: newLabel } : node
                ));
            }
            setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
        };

        const handleDeleteNode = (nodeId: string) => {
            // 노드와 관련된 모든 링크 삭제
            setLinks(links.filter(link => link.from !== nodeId && link.to !== nodeId));
            // 노드 삭제
            setNodes(nodes.filter(node => node.id !== nodeId));
            setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
        };

        return (
            <div
                className={styles.contextMenu}
                style={{
                    top: contextMenu.y,
                    left: contextMenu.x,
                }}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div
                    className="hover:bg-gray-100"
                    onClick={() => handleRenameNode(contextMenu.nodeId!)}
                >
                    이름 변경
                </div>
                <div
                    style={{
                        color: 'red',
                    }}
                    className="hover:bg-gray-100"
                    onClick={() => handleDeleteNode(contextMenu.nodeId!)}
                >
                    삭제
                </div>
            </div>
        )
    };

interface ContextMenu_CanvasProps {
    contextMenu: CanvasContextMenu;
    setContextMenu: (menu: CanvasContextMenu) => void;
    nodes: Node[];
    setNodes: (nodes: Node[]) => void;
    nodeIdRef: React.RefObject<string>;
    scale: number;
    offset: { x: number; y: number };
}

export const ContextMenu_Canvas: React.FC<ContextMenu_CanvasProps> = ({
    contextMenu,
    setContextMenu,
    nodes,
    setNodes,
    nodeIdRef,
    scale,
    offset
}) => {
    const handleAddNode = () => {
        if (!nodeIdRef.current) return;

        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // scale과 offset을 고려하여 정확한 위치 계산
        const x = (contextMenu.x - rect.left - offset.x) / scale;
        const y = (contextMenu.y - rect.top - offset.y) / scale;

        const newNode: Node = {
            id: nodeIdRef.current,
            label: `Node ${nodeIdRef.current}`,
            x: x,
            y: y,
            shape: 'circle',
            popup: false
        };

        setNodes([...nodes, newNode]);
        nodeIdRef.current = String(Number(nodeIdRef.current) + 1);
        setContextMenu({ visible: false, x: 0, y: 0 });
    };

    return (
        <div
            className={styles.contextMenu}
            style={{
                left: contextMenu.x,
                top: contextMenu.y,
            }}
        >
            <div className={styles.menuItem} onClick={handleAddNode}>
                노드 추가
            </div>
        </div>
    );
}; 