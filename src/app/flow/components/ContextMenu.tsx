import React from 'react';
import { NodeContextMenu, Node, Link, CanvasContextMenu } from '../type';

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
    const handleRenameNode = (nodeId: number) => {
        const newLabel = prompt('새로운 노드 이름을 입력하세요:');
        if (newLabel) {
            setNodes(nodes.map(node =>
                node.id === nodeId ? { ...node, label: newLabel } : node
            ));
        }
        setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
    };

    const handleDeleteNode = (nodeId: number) => {
        // 노드와 관련된 모든 링크 삭제
        setLinks(links.filter(link => link.from !== nodeId && link.to !== nodeId));
        // 노드 삭제
        setNodes(nodes.filter(node => node.id !== nodeId));
        setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
      };

    return (
        <div
            style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '4px 0',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 1000,
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                }}
                className="hover:bg-gray-100"
                onClick={() => handleRenameNode(contextMenu.nodeId!)}
            >
                이름 변경
            </div>
            <div
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
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

export const ContextMenu_Canvas: React.FC<{
    contextMenu: CanvasContextMenu;
    setContextMenu: (contextMenu: CanvasContextMenu) => void;
    nodes: Node[];
    setNodes: (nodes: Node[]) => void;
    nodeIdRef: React.MutableRefObject<number>;
}> = ({
    contextMenu,
    setContextMenu,
    nodes,
    setNodes,
    nodeIdRef
  }) => {
    const handleAddNode = () => {
      const newNode = {
        id: nodeIdRef.current++,
        x: contextMenu.x,
        y: contextMenu.y,
        label: `Node ${nodeIdRef.current - 1}`,
      };
      setNodes([...nodes, newNode]);
      setContextMenu({ visible: false, x: 0, y: 0 });
    };
  
    return (
      <div
        style={{
          position: 'fixed',
          top: contextMenu.y,
          left: contextMenu.x,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '4px 0',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          zIndex: 1000,
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          style={{
            padding: '8px 16px',
            cursor: 'pointer',
          }}
          className="hover:bg-gray-100"
          onClick={handleAddNode}
        >
          노드 추가
        </div>
      </div>
    );
  }; 