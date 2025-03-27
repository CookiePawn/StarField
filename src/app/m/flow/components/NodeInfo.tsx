import React from 'react';
import { Node, Link } from '../type';

interface NodeInfoProps {
    node: Node | null;
    links: Link[];
    nodes: Node[];
    onClose: () => void;
}

export const NodeInfo: React.FC<NodeInfoProps> = ({ node, links, nodes, onClose }) => {
    if (!node) return null;

    // 현재 노드와 연결된 노드들 찾기
    const connectedNodes = links
        .filter(link => link.from === node.id || link.to === node.id)
        .map(link => {
            const connectedNodeId = link.from === node.id ? link.to : link.from;
            return nodes.find(n => n.id === connectedNodeId);
        })
        .filter((n): n is Node => n !== undefined);

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '200px',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>노드 정보</h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '0 5px'
                    }}
                >
                    ×
                </button>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <strong>ID:</strong> {node.id}
            </div>
            <div style={{ marginBottom: '10px' }}>
                <strong>라벨:</strong> {node.label}
            </div>
            <div style={{ marginBottom: '10px' }}>
                <strong>위치:</strong> ({Math.round(node.x)}, {Math.round(node.y)})
            </div>
            <div>
                <strong>연결된 노드:</strong>
                {connectedNodes.length > 0 ? (
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '10px' }}>
                        {connectedNodes.map(connectedNode => (
                            <li key={connectedNode.id}>
                                {connectedNode.label} (ID: {connectedNode.id})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>연결된 노드 없음</p>
                )}
            </div>
        </div>
    );
};