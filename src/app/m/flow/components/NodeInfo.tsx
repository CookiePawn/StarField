import React from 'react';
import { Node, Link } from '../type';
import styles from '../styles/m_nodeInfo.module.css';
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
        <div className={styles.container}>
            <div className={styles.nodeInfo}>
                <h3>노드 정보</h3>
                <button
                    onClick={onClose}
                    className={styles.nodeInfoButton}
                >
                    ×
                </button>
            </div>
            <div className={styles.nodeInfoItem}>
                <strong>ID:</strong> {node.id}
            </div>
            <div className={styles.nodeInfoItem}>
                <strong>라벨:</strong> {node.label}
            </div>
            <div className={styles.nodeInfoItem}>
                <strong>위치:</strong> ({Math.round(node.x)}, {Math.round(node.y)})
            </div>
            <div>
                <strong>연결된 노드:</strong>
                {connectedNodes.length > 0 ? (
                    <ul className={styles.nodeInfoItemUl}>
                        {connectedNodes.map(connectedNode => (
                            <li key={connectedNode.id}>
                                {connectedNode.label} (ID: {connectedNode.id})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.nodeInfoItemP}>연결된 노드 없음</p>
                )}
            </div>
        </div>
    );
};