import React, { useState } from 'react';
import { Node } from '../type';
import styles from '../styles/m_contextMenu.module.css';

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
            className={styles.contextMenu}
            style={{
                top: y,
                left: x,
            }}
        >
            <div
                className={styles.contextMenuItem}
                onClick={onAddNode}
            >
                노드 추가
            </div>
            <div
                className={styles.contextMenuItem}
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
            className={styles.nodeContextMenu}
            style={{
                top: y,
                left: x,
            }}
        >
            <div className={styles.nodeContextMenuNameItem}>
                <span>노드 {node.id}</span>
                <button
                    onClick={onClose}
                    className={styles.nodeContextMenuButton}
                >
                    ×
                </button>
            </div>

            {isRenaming ? (
                <form onSubmit={handleRenameSubmit} className={styles.nodeContextMenuInput}>
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        autoFocus
                    />
                </form>
            ) : (
                <div className={styles.padding8}>
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