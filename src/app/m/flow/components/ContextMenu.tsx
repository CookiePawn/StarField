import React, { useState } from 'react';
import { Node } from '../type';

interface ContextMenuProps {
    visible: boolean;
    x: number;
    y: number;
    onClose: () => void;
    onAddNode: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
    visible,
    x,
    y,
    onClose,
    onAddNode
}) => {
    if (!visible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: y,
                left: x,
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                padding: '8px',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
                onClick={onAddNode}
            >
                노드 추가
            </div>
            <div
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
                onClick={onClose}
            >
                취소
            </div>
        </div>
    );
}; 





interface NodeContextMenuProps {
    visible: boolean;
    x: number;
    y: number;
    node: Node | null;
    onClose: () => void;
    onDelete: () => void;
    onRename: (newLabel: string) => void;
    onConnect: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
    visible,
    x,
    y,
    node,
    onClose,
    onDelete,
    onRename,
    onConnect
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newLabel, setNewLabel] = useState(node?.label || '');
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    if (!visible || !node) return null;

    const handleRenameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRename(newLabel);
        setIsRenaming(false);
    };

    const menuItemStyle = (item: string) => ({
        padding: '8px',
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: hoveredItem === item ? '#404040' : 'transparent',
        transition: 'background-color 0.2s'
    });

    return (
        <div
            style={{
                position: 'fixed',
                top: y,
                left: x,
                backgroundColor: '#2d2d2d',
                borderRadius: '8px',
                padding: '8px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                minWidth: '200px',
                color: 'white'
            }}
        >
            <div style={{ 
                padding: '8px', 
                borderBottom: '1px solid #404040',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>노드 {node.id}</span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#808080',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '0 4px'
                    }}
                >
                    ×
                </button>
            </div>

            {isRenaming ? (
                <form onSubmit={handleRenameSubmit} style={{ padding: '8px' }}>
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '4px',
                            background: '#404040',
                            border: '1px solid #505050',
                            borderRadius: '4px',
                            color: 'white'
                        }}
                        autoFocus
                    />
                </form>
            ) : (
                <div style={{ padding: '8px' }}>
                    <div
                        onClick={() => setIsRenaming(true)}
                        onMouseEnter={() => setHoveredItem('rename')}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={menuItemStyle('rename')}
                    >
                        이름 변경
                    </div>
                    <div
                        onClick={onConnect}
                        onMouseEnter={() => setHoveredItem('connect')}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={menuItemStyle('connect')}
                    >
                        링크 연결
                    </div>
                    <div
                        onClick={onDelete}
                        onMouseEnter={() => setHoveredItem('delete')}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                            ...menuItemStyle('delete'),
                            color: '#ff4444'
                        }}
                    >
                        노드 삭제
                    </div>
                </div>
            )}
        </div>
    );
};