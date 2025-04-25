import { useEffect, useRef } from 'react';
import { Node, Link, ContextMenu as ContextMenuType, NodeContextMenuState } from '../type';

interface UseCanvasProps {
    isMounted: boolean;
    offset: { x: number; y: number };
    scale: number;
    isDragging: boolean;
    isDraggingNode: boolean;
    draggingNodeId: number | null;
    nodes: Node[];
    links: Link[];
    selectedNode: Node | null;
    connectingFrom: number | null;
    mousePosition: { x: number; y: number };
    setOffset: (offset: { x: number; y: number }) => void;
    setNodes: (nodes: Node[]) => void;
    setSelectedNode: (node: Node | null) => void;
    setIsDragging: (isDragging: boolean) => void;
    setIsDraggingNode: (isDraggingNode: boolean) => void;
    setDraggingNodeId: (id: number | null) => void;
    setConnectingFrom: (id: number | null) => void;
    setMousePosition: (position: { x: number; y: number }) => void;
    setLinks: (links: Link[]) => void;
    setNodeContextMenu: (menu: NodeContextMenuState) => void;
    setContextMenu: (menu: ContextMenuType) => void;
}

export const useCanvas = ({
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
    setContextMenu,
}: UseCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 캔버스 크기 설정
        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio;
            const rect = canvas.getBoundingClientRect();

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            // 캔버스 유닛 크기 보정
            ctx.scale(dpr, dpr);
        };

        // 배경과 노드 그리기
        const drawBackground = () => {
            // 검은색 배경
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

            // 흰색 점 그리기
            ctx.fillStyle = '#ededed';
            const dotSize = 1;
            const spacing = 50;

            // 현재 보이는 영역의 점만 그리기
            const startX = Math.floor(-offset.x / (spacing * scale)) * spacing * scale;
            const startY = Math.floor(-offset.y / (spacing * scale)) * spacing * scale;
            const endX = startX + canvas.width / window.devicePixelRatio + spacing * scale;
            const endY = startY + canvas.height / window.devicePixelRatio + spacing * scale;

            for (let x = startX; x < endX; x += spacing * scale) {
                for (let y = startY; y < endY; y += spacing * scale) {
                    ctx.beginPath();
                    ctx.arc(x + offset.x, y + offset.y, dotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // 링크 그리기
            ctx.strokeStyle = 'gray';
            ctx.lineWidth = 2;
            links.forEach((link: Link) => {
                const fromNode = nodes.find((n: Node) => n.id === link.from);
                const toNode = nodes.find((n: Node) => n.id === link.to);
                if (fromNode && toNode) {
                    ctx.beginPath();
                    ctx.moveTo(fromNode.x * scale + offset.x, fromNode.y * scale + offset.y);
                    ctx.lineTo(toNode.x * scale + offset.x, toNode.y * scale + offset.y);
                    ctx.stroke();
                }
            });

            // 노드 그리기
            nodes.forEach((node: Node) => {
                // 노드 배경
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, 30 * scale, 0, Math.PI * 2);
                ctx.fill();

                // 선택된 노드 테두리
                if (selectedNode && selectedNode.id === node.id) {
                    ctx.strokeStyle = 'darkgreen';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                // 노드 텍스트
                ctx.fillStyle = 'black';
                ctx.font = `${12 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.label, node.x * scale + offset.x, node.y * scale + offset.y);
            });
            // 연결 중인 임시 선 그리기
            if (connectingFrom !== null) {
                const fromNode = nodes.find((n: Node) => n.id === connectingFrom);
                if (fromNode) {
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = (mousePosition.x - rect.left - offset.x) / scale;
                    const mouseY = (mousePosition.y - rect.top - offset.y) / scale;

                    ctx.beginPath();
                    ctx.moveTo(fromNode.x * scale + offset.x, fromNode.y * scale + offset.y);
                    ctx.lineTo(mouseX * scale + offset.x, mouseY * scale + offset.y);
                    ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
                    ctx.stroke();
                }
            }
        };

        // 노드 클릭 확인
        const findClickedNode = (x: number, y: number): Node | null => {
            const rect = canvas.getBoundingClientRect();
            const scrollX = window.scrollX || window.pageXOffset;
            const scrollY = window.scrollY || window.pageYOffset;

            // 실제 캔버스 상의 좌표로 변환
            const canvasX = x - rect.left - scrollX;
            const canvasY = y - rect.top - scrollY;

            // 월드 좌표로 변환
            const worldX = (canvasX - offset.x) / scale;
            const worldY = (canvasY - offset.y) / scale;

            return nodes.find((node: Node) => {
                const dx = node.x - worldX;
                const dy = node.y - worldY;
                return Math.sqrt(dx * dx + dy * dy) <= 30;
            }) || null;
        };

        // 마우스/터치 이벤트 핸들러
        const handleStart = (e: MouseEvent | TouchEvent) => {
            const point = 'touches' in e && e.touches.length > 0 ? e.touches[0] : e as MouseEvent;
            dragStart.current = {
                x: point.clientX - offset.x,
                y: point.clientY - offset.y
            };

            // 노드 클릭 확인
            const clickedNode = findClickedNode(point.clientX, point.clientY);
            if (clickedNode) {
                if (connectingFrom !== null) {
                    // 연결 모드에서 노드 클릭
                    if (clickedNode.id !== connectingFrom) {
                        // 이미 링크가 존재하는지 확인
                        const linkExists = links.some(link =>
                            (link.from === connectingFrom && link.to === clickedNode.id) ||
                            (link.from === clickedNode.id && link.to === connectingFrom)
                        );

                        if (!linkExists) {
                            setLinks([...links, { from: connectingFrom, to: clickedNode.id }]);
                        } else {
                            alert('이미 연결되어있습니다.');
                        }
                    }
                    setConnectingFrom(null);
                    setSelectedNode(null);
                } else {
                    setIsDraggingNode(true);
                    setDraggingNodeId(clickedNode.id);
                    setSelectedNode(clickedNode);
                }
            } else {
                setIsDragging(true);
                setSelectedNode(null);
                setConnectingFrom(null);
            }
        };

        const handleMove = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            const point = 'touches' in e && e.touches.length > 0 ? e.touches[0] : e as MouseEvent;
            setMousePosition({ x: point.clientX, y: point.clientY });

            if (isDraggingNode && draggingNodeId !== null) {
                // 노드 드래그
                const rect = canvas.getBoundingClientRect();
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;
                const newX = (point.clientX - rect.left - scrollX - offset.x) / scale;
                const newY = (point.clientY - rect.top - scrollY - offset.y) / scale;

                const updatedNodes = nodes.map((node: Node) =>
                    node.id === draggingNodeId ? { ...node, x: newX, y: newY } : node
                );
                setNodes(updatedNodes);

                // 선택된 노드 정보 업데이트
                const updatedNode = updatedNodes.find(node => node.id === draggingNodeId);
                if (updatedNode) {
                    setSelectedNode(updatedNode);
                }
            } else if (isDragging) {
                // 배경 드래그
                setOffset({
                    x: point.clientX - dragStart.current.x,
                    y: point.clientY - dragStart.current.y
                });
            }
        };

        const handleEnd = () => {
            setIsDragging(false);
            setIsDraggingNode(false);
            setDraggingNodeId(null);
        };

        const handleDoubleClick = (e: MouseEvent | TouchEvent) => {
            const point = 'touches' in e && e.touches.length > 0 ? e.touches[0] : e as MouseEvent;
            const clickedNode = findClickedNode(point.clientX, point.clientY);

            if (clickedNode) {
                setNodeContextMenu({
                    visible: true,
                    x: point.clientX,
                    y: point.clientY,
                    node: clickedNode
                });
            } else {
                setContextMenu({
                    visible: true,
                    x: point.clientX,
                    y: point.clientY
                });
            }
        };

        // 초기 렌더링
        resizeCanvas();
        drawBackground();

        // 이벤트 리스너 등록
        canvas.addEventListener('mousedown', handleStart);
        canvas.addEventListener('touchstart', handleStart);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchend', handleEnd);
        canvas.addEventListener('dblclick', handleDoubleClick);
        canvas.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                handleDoubleClick(e);
            }
        });

        // 리사이즈 이벤트
        window.addEventListener('resize', () => {
            resizeCanvas();
            drawBackground();
        });

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousedown', handleStart);
            canvas.removeEventListener('touchstart', handleStart);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
            canvas.removeEventListener('dblclick', handleDoubleClick);
            canvas.removeEventListener('touchend', handleDoubleClick);
        };
    }, [
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
        setConnectingFrom,
        setContextMenu,
        setDraggingNodeId,
        setIsDragging,
        setIsDraggingNode,
        setLinks,
        setMousePosition,
        setNodeContextMenu,
        setNodes,
        setOffset,
        setSelectedNode
    ]);

    return canvasRef;
}; 