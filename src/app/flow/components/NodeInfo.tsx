import React from 'react';
import { Node, Link } from '../type';
import styles from '../styles/nodeInfo.module.css';

interface NodeInfoProps {
  selectedNode: Node | null;
  nodes: Node[];
  links: Link[];
  setSelectedNode: (node: number | null) => void;
}

export const NodeInfo: React.FC<NodeInfoProps> = ({ selectedNode, nodes, links, setSelectedNode }) => {
  if (!selectedNode) {
    return (
      <div className={styles.nodeInfo}>
        <h2>노드 정보</h2>
        <p>노드를 선택해주세요</p>
      </div>
    );
  }

  // 선택된 노드와 연결된 노드들 찾기
  const connectedNodes = nodes.filter(node => {
    if (node.id === selectedNode.id) return false;
    return links.some(link => 
      (link.from === selectedNode.id && link.to === node.id) ||
      (link.from === node.id && link.to === selectedNode.id)
    );
  });

  return (
    <div className={styles.nodeInfo}>
      <h2>노드 정보</h2>
      <div className={styles.infoSection}>
        <h3>기본 정보</h3>
        <p>ID: {selectedNode.id}</p>
        <p>이름: {selectedNode.label}</p>
        <p>위치: ({Math.round(selectedNode.x)}, {Math.round(selectedNode.y)})</p>
      </div>
      <div className={styles.infoSection}>
        <h3>연결된 노드</h3>
        <ul>
          {connectedNodes.length > 0 ? (
            connectedNodes.map(node => (
              <li key={node.id}>1. {node.label}</li>
            ))
          ) : (
            <li>연결된 노드가 없습니다</li>
          )}
        </ul>
      </div>
      <div className={styles.closeButton} onClick={() => setSelectedNode(null)}>
        <p>창 닫기</p>
      </div>
    </div>
  );
}; 