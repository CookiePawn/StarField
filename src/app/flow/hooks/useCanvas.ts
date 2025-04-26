import { useEffect, useRef } from 'react';
import { Node, Link, NodeContextMenu, CanvasContextMenu } from '../type';

interface UseCanvasProps {
    isMounted: boolean;
    isGrabbing: boolean;
    isDragging: boolean;
    offset: { x: number; y: number };
    scale: number;
    nodes: Node[];
    links: Link[];
    selectedNode: number | null;
    draggingNode: number | null;
    isConnecting: boolean;
    connectingFrom: number | null;
    mousePosition: { x: number; y: number };
    setIsDragging: (value: boolean) => void;
    setDraggingNode: (value: number | null) => void;
    setSelectedNode: (value: number | null) => void;
    setNodes: (value: Node[]) => void;
    setLinks: (value: Link[]) => void;
    setOffset: (value: { x: number; y: number }) => void;
    setScale: (value: number) => void;
    setMousePosition: (value: { x: number; y: number }) => void;
    setIsGrabbing: (value: boolean) => void;
    setIsConnecting: (value: boolean) => void;
    setConnectingFrom: (value: number | null) => void;
    dragStart: React.RefObject<{ x: number; y: number }>;
    setContextMenu: (menu: NodeContextMenu) => void;
    setCanvasContextMenu: (menu: CanvasContextMenu) => void;
    dotColor: string;
}

interface Group {
    id: number;
    nodeIds: number[];
    centerX: number;
    centerY: number;
    radius: number;
    name: string;
    isEditing: boolean;
}

export const useCanvas = ({
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
    setCanvasContextMenu,
    dotColor
}: UseCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const selectedLinkRef = useRef<Link | null>(null);
    const dragBoxRef = useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
    const selectedNodesRef = useRef<number[]>([]);
    const groupsRef = useRef<Group[]>([]);
    const selectedGroupRef = useRef<Group | null>(null);
    const dragOffset = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 스페이스바 이벤트 처리
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' && selectedLinkRef.current) {
                setLinks(links.filter(link => 
                    !(link.from === selectedLinkRef.current?.from && link.to === selectedLinkRef.current?.to)
                ));
                selectedLinkRef.current = null;
            } else if (e.key === 'Backspace' && selectedGroupRef.current) {
                groupsRef.current = groupsRef.current.filter(group => 
                    group.id !== selectedGroupRef.current?.id
                );
                selectedGroupRef.current = null;
            } else if (e.key === 'Backspace' && selectedNodesRef.current.length > 0) {
                // 선택된 노드들 제거
                setNodes(nodes.filter(node => !selectedNodesRef.current.includes(node.id)));
                // 선택된 노드들과 관련된 링크들도 제거
                setLinks(links.filter(link => 
                    !selectedNodesRef.current.includes(link.from) && 
                    !selectedNodesRef.current.includes(link.to)
                ));
                // 선택 초기화
                selectedNodesRef.current = [];
                setSelectedNode(null);
            } else if (e.key === 'Enter') {
                // 그룹 이름 편집 완료
                const editingGroup = groupsRef.current.find(group => group.isEditing);
                if (editingGroup) {
                    editingGroup.isEditing = false;
                }
            } else if (e.key === 'Escape') {
                // 그룹 이름 편집 취소
                const editingGroup = groupsRef.current.find(group => group.isEditing);
                if (editingGroup) {
                    editingGroup.isEditing = false;
                }
            } else {
                // 그룹 이름 편집 중 텍스트 입력
                const editingGroup = groupsRef.current.find(group => group.isEditing);
                if (editingGroup) {
                    if (e.key.length === 1 && editingGroup.name.length < 30) {
                        editingGroup.name += e.key;
                    } else if (e.key === 'Backspace') {
                        editingGroup.name = editingGroup.name.slice(0, -1);
                    }
                }
            }
            // Command+G로 그룹 생성
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyG' && selectedNodesRef.current.length > 0) {
                const selectedNodes = nodes.filter(node => selectedNodesRef.current.includes(node.id));
                if (selectedNodes.length > 0) {
                    // 그룹의 중심점 계산
                    const centerX = selectedNodes.reduce((sum, node) => sum + node.x, 0) / selectedNodes.length;
                    const centerY = selectedNodes.reduce((sum, node) => sum + node.y, 0) / selectedNodes.length;

                    // 그룹의 반경 계산 (가장 먼 노드까지의 거리 + 여유 공간)
                    const radius = Math.max(...selectedNodes.map(node => 
                        Math.sqrt(Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2))
                    )) + 50;

                    // 새 그룹 생성
                    const newGroup: Group = {
                        id: Date.now(),
                        nodeIds: selectedNodesRef.current,
                        centerX,
                        centerY,
                        radius,
                        name: `Group ${groupsRef.current.length + 1}`,
                        isEditing: false
                    };

                    groupsRef.current = [...groupsRef.current, newGroup];
                }
            }
        };

        const handleKeyUp = () => {
            // 키보드 이벤트 처리 제거
        };

        // 그룹 선택 함수
        // const selectGroup = (x: number, y: number) => {
        //     const rect = canvas.getBoundingClientRect();
        //     const mouseX = (x - rect.left - offset.x) / scale;
        //     const mouseY = (y - rect.top - offset.y) / scale;

        //     for (const group of groupsRef.current) {
        //         const distance = Math.sqrt(
        //             Math.pow(mouseX - group.centerX, 2) + Math.pow(mouseY - group.centerY, 2)
        //         );
        //         // 그룹 원의 두께를 고려하여 선택 영역 설정
        //         if (Math.abs(distance - group.radius) <= 2.5) {
        //             selectedGroupRef.current = group;
        //             return;
        //         }
        //     }
        //     selectedGroupRef.current = null;
        // };

        // 마우스 이벤트 처리
        const handleMouseDown = (e: MouseEvent) => {
            // 우클릭 메뉴 닫기
            setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
            setCanvasContextMenu({ visible: false, x: 0, y: 0 });

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;

            // 그룹 텍스트 클릭 확인
            const clickedGroupText = groupsRef.current.find(group => {
                const textX = group.centerX;
                const textY = group.centerY - group.radius - 20;
                const textWidth = ctx.measureText(group.name).width / scale;
                const textHeight = 14; // 폰트 크기

                return (
                    x >= textX - textWidth / 2 &&
                    x <= textX + textWidth / 2 &&
                    y >= textY - textHeight / 2 &&
                    y <= textY + textHeight / 2
                );
            });

            // 편집 중인 그룹이 있고, 클릭한 위치가 그룹 이름이 아닌 경우 편집 모드 종료
            const editingGroup = groupsRef.current.find(group => group.isEditing);
            if (editingGroup && !clickedGroupText) {
                editingGroup.isEditing = false;
            }

            // 먼저 노드 선택 확인
            const clickedNode = nodes.find(node => {
                if (node.id === draggingNode) return false; // 본인이 본인에 링크도 안되게
                const dx = node.x - x;
                const dy = node.y - y;
                return Math.sqrt(dx * dx + dy * dy) <= 50;
            });

            if (clickedNode) {
                if (e.ctrlKey || e.metaKey) {
                    // Command/Control+클릭: 노드 선택 추가/제거
                    const index = selectedNodesRef.current.indexOf(clickedNode.id);
                    if (index === -1) {
                        // 노드가 선택되지 않은 경우 추가
                        selectedNodesRef.current.push(clickedNode.id);
                    } else {
                        // 노드가 이미 선택된 경우 제거
                        selectedNodesRef.current.splice(index, 1);
                    }
                    setSelectedNode(selectedNodesRef.current.length === 1 ? selectedNodesRef.current[0] : null);
                } else if (e.altKey) {
                    // Option/Alt+클릭: 노드 복사
                    const newNode = {
                        ...clickedNode,
                        id: Date.now(),
                        x: clickedNode.x,
                        y: clickedNode.y
                    };
                    setNodes([...nodes, newNode]);

                    // 노드가 속한 모든 그룹 찾기 (중첩된 그룹 포함)
                    const findParentGroups = (nodeId: number, groups: Group[]): Group[] => {
                        const parentGroups: Group[] = [];
                        const findGroups = (id: number) => {
                            groups.forEach(group => {
                                if (group.nodeIds.includes(id)) {
                                    parentGroups.push(group);
                                    // 그룹이 다른 그룹에 속해있는지 확인
                                    findGroups(group.id);
                                }
                            });
                        };
                        findGroups(nodeId);
                        return parentGroups;
                    };

                    const parentGroups = findParentGroups(clickedNode.id, groupsRef.current);
                    
                    // 모든 상위 그룹에 복제된 노드 추가
                    parentGroups.forEach(group => {
                        group.nodeIds.push(newNode.id);
                    });

                    // 클릭한 위치와 노드 중심점의 차이를 저장
                    dragOffset.current = {
                        x: x - clickedNode.x,
                        y: y - clickedNode.y
                    };

                    setDraggingNode(newNode.id);
                    setIsDragging(true);
                    return;
                } else {
                    // 일반 클릭: 단일 노드 선택
                    selectedNodesRef.current = [clickedNode.id];
                    setSelectedNode(clickedNode.id);
                }
                setIsDragging(true);
                setDraggingNode(clickedNode.id);

                // 클릭한 위치와 노드 중심점의 차이를 저장
                dragOffset.current = {
                    x: x - clickedNode.x,
                    y: y - clickedNode.y
                };
                return;
            }

            // 노드가 선택되지 않았을 때만 그룹 선택 확인
            const clickedGroup = groupsRef.current.find(group => {
                const distance = Math.sqrt(
                    Math.pow(x - group.centerX, 2) + Math.pow(y - group.centerY, 2)
                );
                return distance <= group.radius;
            });

            if (clickedGroup) {
                selectedGroupRef.current = clickedGroup;
                setIsDragging(true);
                dragStart.current = {
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y
                };
                return;
            }

            // 노드가 선택되지 않았을 때만 링크 선택 확인
            selectLink(e.clientX, e.clientY);

            // 배경 클릭 시 드래그 박스 시작 (Control/Command 키를 누른 상태에서만)
            if (!selectedLinkRef.current && (e.ctrlKey || e.metaKey)) {
                dragBoxRef.current = {
                    startX: e.clientX,
                    startY: e.clientY,
                    endX: e.clientX,
                    endY: e.clientY
                };
            } else if (!selectedLinkRef.current) {
                // Control/Command 키를 누르지 않은 상태에서 배경 클릭 시 캔버스 드래그 시작
                setIsDragging(true);
                canvas.style.cursor = 'grabbing';
                dragStart.current = {
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y
                };
                // 배경 클릭 시 선택 해제
                selectedNodesRef.current = [];
                setSelectedNode(null);
            }

            // 배경 클릭 시 링크 연결 모드 취소
            if (isConnecting) {
                setIsConnecting(false);
                setConnectingFrom(null);
                setSelectedNode(null);
            }
        };

        // 더블클릭 이벤트 추가
        const handleDoubleClick = (e: MouseEvent) => {
            if (e.button === 0) { // 좌클릭
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left - offset.x) / scale;
                const y = (e.clientY - rect.top - offset.y) / scale;

                // 그룹 텍스트 더블클릭 확인
                const clickedGroupText = groupsRef.current.find(group => {
                    const textX = group.centerX;
                    const textY = group.centerY - group.radius - 20;
                    const textWidth = ctx.measureText(group.name).width / scale;
                    const textHeight = 14; // 폰트 크기

                    return (
                        x >= textX - textWidth / 2 &&
                        x <= textX + textWidth / 2 &&
                        y >= textY - textHeight / 2 &&
                        y <= textY + textHeight / 2
                    );
                });

                if (clickedGroupText) {
                    // 다른 그룹이 편집 중이면 편집 모드 종료
                    const editingGroup = groupsRef.current.find(group => group.isEditing);
                    if (editingGroup && editingGroup.id !== clickedGroupText.id) {
                        editingGroup.isEditing = false;
                    }
                    clickedGroupText.isEditing = true;
                    return;
                }

                // 클릭한 위치에 노드가 있는지 확인
                const clickedNode = nodes.find(node => {
                    const dx = node.x - x;
                    const dy = node.y - y;
                    return Math.sqrt(dx * dx + dy * dy) <= 50;
                });

                if (!clickedNode) {
                    // 배경 더블클릭 시 노드 생성 메뉴 표시
                    setCanvasContextMenu({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY
                    });
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && selectedGroupRef.current) {
                // 그룹 드래그
                const dx = (e.clientX - dragStart.current.x - offset.x) / scale;
                const dy = (e.clientY - dragStart.current.y - offset.y) / scale;

                // 그룹 내 모든 노드 이동
                setNodes(nodes.map(node => {
                    if (selectedGroupRef.current?.nodeIds.includes(node.id)) {
                        return {
                            ...node,
                            x: node.x + dx,
                            y: node.y + dy
                        };
                    }
                    return node;
                }));

                // 그룹 중심점 업데이트
                selectedGroupRef.current.centerX += dx;
                selectedGroupRef.current.centerY += dy;

                dragStart.current = {
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y
                };
            } else if (isDragging && draggingNode !== null) {
                const rect = canvas.getBoundingClientRect();
                const newX = (e.clientX - rect.left - offset.x) / scale;
                const newY = (e.clientY - rect.top - offset.y) / scale;
                
                // Control/Command 키를 누른 상태에서 노드 드래그 시 링크 연결 모드 시작
                if (e.ctrlKey || e.metaKey) {
                    setIsConnecting(true);
                    setConnectingFrom(draggingNode);
                    setDraggingNode(null);
                    return;
                }
                
                // 노드 위치 업데이트 (드래그 중에만)
                setNodes(nodes.map(node =>
                    node.id === draggingNode ? { 
                        ...node, 
                        x: newX - (dragOffset.current?.x || 0), 
                        y: newY - (dragOffset.current?.y || 0) 
                    } : node
                ));
            } else if (isDragging && !isConnecting) {
                // 캔버스 드래그
                setOffset({
                    x: e.clientX - dragStart.current.x,
                    y: e.clientY - dragStart.current.y
                });
            } else if (isDragging && isConnecting) {
                // 연결 모드에서 드래그 중 - 마우스 위치만 업데이트
                setMousePosition({ x: e.clientX, y: e.clientY });
            } else if (dragBoxRef.current) {
                // 드래그 박스 업데이트
                dragBoxRef.current.endX = e.clientX;
                dragBoxRef.current.endY = e.clientY;
            }
            // 마우스 위치 업데이트
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = () => {
            if (dragBoxRef.current) {
                // 드래그 박스 안의 노드 선택
                const rect = canvas.getBoundingClientRect();
                const startX = (dragBoxRef.current.startX - rect.left - offset.x) / scale;
                const startY = (dragBoxRef.current.startY - rect.top - offset.y) / scale;
                const endX = (dragBoxRef.current.endX - rect.left - offset.x) / scale;
                const endY = (dragBoxRef.current.endY - rect.top - offset.y) / scale;

                const minX = Math.min(startX, endX);
                const maxX = Math.max(startX, endX);
                const minY = Math.min(startY, endY);
                const maxY = Math.max(startY, endY);

                const selectedNodes = nodes.filter(node => 
                    node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY
                );

                if (selectedNodes.length > 0) {
                    selectedNodesRef.current = selectedNodes.map(node => node.id);
                    if (selectedNodes.length === 1) {
                        setSelectedNode(selectedNodes[0].id);
                    } else {
                        setSelectedNode(null);
                    }
                } else {
                    selectedNodesRef.current = [];
                    setSelectedNode(null);
                }

                dragBoxRef.current = null;
            }

            if (isDragging && isConnecting && connectingFrom !== null) {
                // 연결 모드에서 마우스를 놓을 때
                const rect = canvas.getBoundingClientRect();
                const mouseX = (mousePosition.x - rect.left - offset.x) / scale;
                const mouseY = (mousePosition.y - rect.top - offset.y) / scale;

                // 마우스가 노드 위에 있는지 확인
                const hoveredNode = nodes.find(node => {
                    const dx = node.x - mouseX;
                    const dy = node.y - mouseY;
                    return Math.sqrt(dx * dx + dy * dy) <= 50;
                });

                if (hoveredNode && hoveredNode.id !== connectingFrom) {
                    // 노드 위에 있을 때 연결 완료
                    const linkExists = links.some(link =>
                        (link.from === connectingFrom && link.to === hoveredNode.id) ||
                        (link.from === hoveredNode.id && link.to === connectingFrom)
                    );

                    if (!linkExists) {
                        setLinks([...links, { from: connectingFrom, to: hoveredNode.id }]);
                    }
                }
            }

            setIsDragging(false);
            setDraggingNode(null);
            selectedGroupRef.current = null;
            if (isConnecting) {
                setIsConnecting(false);
                setConnectingFrom(null);
                setSelectedNode(null);
            }
            canvas.style.cursor = 'default';
        };

        // 휠 이벤트 처리
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 트랙패드 핀치 줌 감지 (ctrlKey가 true인 경우)
            if (e.ctrlKey) {
                const delta = e.deltaY;
                const newScale = Math.max(0.5, Math.min(2, scale - delta / 100));

                // 마우스 포인터 위치를 기준으로 offset 조정
                const worldX = (mouseX - offset.x) / scale;
                const worldY = (mouseY - offset.y) / scale;
                const newOffsetX = mouseX - worldX * newScale;
                const newOffsetY = mouseY - worldY * newScale;

                setScale(newScale);
                setOffset({ x: newOffsetX, y: newOffsetY });
                return;
            }

            // 트랙패드 스크롤 감지 (deltaMode가 0인 경우)
            if (e.deltaMode === 0) {
                // 스크롤 방향에 따라 offset 조정
                setOffset({
                    x: offset.x - e.deltaX,
                    y: offset.y - e.deltaY
                });
                return;
            }

            // 기존의 줌 기능 (마우스 휠)
            const delta = e.deltaY;
            const newScale = Math.max(0.5, Math.min(2, scale - delta / 1000));

            // 마우스 포인터 위치를 기준으로 offset 조정
            const worldX = (mouseX - offset.x) / scale;
            const worldY = (mouseY - offset.y) / scale;
            const newOffsetX = mouseX - worldX * newScale;
            const newOffsetY = mouseY - worldY * newScale;

            setScale(newScale);
            setOffset({ x: newOffsetX, y: newOffsetY });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('dblclick', handleDoubleClick);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        // 캔버스 크기를 화면 크기로 설정
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // 링크 선택 함수
        const selectLink = (x: number, y: number) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = (x - rect.left - offset.x) / scale;
            const mouseY = (y - rect.top - offset.y) / scale;

            // 모든 링크에 대해 거리 계산
            for (const link of links) {
                const fromNode = nodes.find(n => n.id === link.from);
                const toNode = nodes.find(n => n.id === link.to);
                if (!fromNode || !toNode) continue;

                // 링크의 선분과 마우스 포인트 사이의 거리 계산
                const distance = distanceToLine(
                    mouseX, mouseY,
                    fromNode.x, fromNode.y,
                    toNode.x, toNode.y
                );

                // 거리가 임계값 이내이면 링크 선택
                if (distance < 5) {
                    selectedLinkRef.current = link;
                    return;
                }
            }
            selectedLinkRef.current = null;
        };

        // 선분과 점 사이의 거리 계산 함수
        const distanceToLine = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
            const A = x - x1;
            const B = y - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) {
                param = dot / len_sq;
            }

            let xx, yy;

            if (param < 0) {
                xx = x1;
                yy = y1;
            } else if (param > 1) {
                xx = x2;
                yy = y2;
            } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }

            const dx = x - xx;
            const dy = y - yy;
            return Math.sqrt(dx * dx + dy * dy);
        };

        // 드래그 박스 그리기
        const drawDragBox = () => {
            if (dragBoxRef.current) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(
                    dragBoxRef.current.startX,
                    dragBoxRef.current.startY,
                    dragBoxRef.current.endX - dragBoxRef.current.startX,
                    dragBoxRef.current.endY - dragBoxRef.current.startY
                );
                ctx.setLineDash([]);
            }
        };

        // 그룹 그리기 함수
        const drawGroups = () => {
            groupsRef.current.forEach(group => {
                // 그룹에 속한 노드들 찾기
                const groupNodes = nodes.filter(node => group.nodeIds.includes(node.id));
                if (groupNodes.length === 0) return;

                // 그룹에 속한 링크들 찾기
                const groupLinks = links.filter(link => 
                    group.nodeIds.includes(link.from) && group.nodeIds.includes(link.to)
                );

                // 모든 요소(노드, 링크)의 위치를 고려하여 최소 경계 원 계산
                const allPoints = [
                    // 노드들의 위치
                    ...groupNodes.map(node => ({ x: node.x, y: node.y })),
                    
                    // 링크들의 중간점
                    ...groupLinks.map(link => {
                        const fromNode = nodes.find(n => n.id === link.from);
                        const toNode = nodes.find(n => n.id === link.to);
                        if (!fromNode || !toNode) return null;
                        return {
                            x: (fromNode.x + toNode.x) / 2,
                            y: (fromNode.y + toNode.y) / 2
                        };
                    }).filter(Boolean) as { x: number; y: number }[]
                ];

                // 최소 경계 원 계산
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                allPoints.forEach(point => {
                    minX = Math.min(minX, point.x);
                    maxX = Math.max(maxX, point.x);
                    minY = Math.min(minY, point.y);
                    maxY = Math.max(maxY, point.y);
                });

                // 중심점과 반경 계산
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                const radius = Math.max(
                    Math.sqrt(Math.pow(maxX - centerX, 2) + Math.pow(maxY - centerY, 2)),
                    Math.sqrt(Math.pow(minX - centerX, 2) + Math.pow(minY - centerY, 2))
                ) + 100; // 여유 공간을 100px로 증가

                // 그룹 정보 업데이트
                group.centerX = centerX;
                group.centerY = centerY;
                group.radius = radius;

                // 그룹 원 그리기
                let strokeStyle = 'white';
                let lineWidth = 2;

                if (selectedGroupRef.current?.id === group.id) {
                    strokeStyle = 'rgba(100, 100, 100, 1)';
                    lineWidth = 3;
                }

                ctx.strokeStyle = strokeStyle;
                ctx.lineWidth = lineWidth;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(
                    group.centerX * scale + offset.x,
                    group.centerY * scale + offset.y,
                    group.radius * scale,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
                ctx.setLineDash([]);

                // 그룹 이름 표시
                ctx.fillStyle = strokeStyle;
                ctx.font = `${14 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if (group.isEditing) {
                    // 편집 중인 경우 텍스트 입력 필드 스타일
                    const textWidth = ctx.measureText(group.name).width;
                    const padding = 20 * scale; // 좌우 패딩
                    const minWidth = 100 * scale; // 최소 너비
                    const maxWidth = 300 * scale; // 최대 너비
                    const inputWidth = Math.min(Math.max(textWidth + padding, minWidth), maxWidth);

                    ctx.fillStyle = '#222222';
                    ctx.fillRect(
                        (group.centerX - inputWidth / 2) + offset.x,
                        (group.centerY - group.radius - 30) * scale + offset.y,
                        inputWidth,
                        30 * scale
                    );
                    ctx.fillStyle = 'white';
                    ctx.fillText(
                        group.name,
                        group.centerX * scale + offset.x,
                        (group.centerY - group.radius) * scale + offset.y - 20 * scale
                    );
                } else {
                    // 일반 텍스트 표시
                    ctx.fillStyle = strokeStyle;
                    ctx.fillText(
                        group.name,
                        group.centerX * scale + offset.x,
                        (group.centerY - group.radius) * scale + offset.y - 20 * scale
                    );
                }
            });
        };

        // 배경과 노드 그리기
        const drawBackground = () => {
            // 캔버스 초기화
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 검은색 배경
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 흰색 점 그리기
            ctx.fillStyle = dotColor;
            const dotSize = 1;
            const spacing = 50;

            // 현재 보이는 영역의 점만 그리기
            const startX = Math.floor(-offset.x / (spacing * scale)) * spacing * scale;
            const startY = Math.floor(-offset.y / (spacing * scale)) * spacing * scale;
            const endX = startX + canvas.width + spacing * scale;
            const endY = startY + canvas.height + spacing * scale;

            for (let x = startX; x < endX; x += spacing * scale) {
                for (let y = startY; y < endY; y += spacing * scale) {
                    ctx.beginPath();
                    ctx.arc(x + offset.x, y + offset.y, dotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // 링크 그리기
            drawLinks();

            // 드래그 박스 그리기
            drawDragBox();

            // 그룹 그리기
            drawGroups();

            // 노드 그리기
            drawNodes();

            // 다음 프레임 요청
            animationFrameRef.current = requestAnimationFrame(drawBackground);
        };

        // 링크 그리기 수정
        const drawLinks = () => {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            links.forEach(link => {
                const fromNode = nodes.find(n => n.id === link.from);
                const toNode = nodes.find(n => n.id === link.to);
                if (fromNode && toNode) {
                    // 선택된 링크 강조
                    if (selectedLinkRef.current && 
                        selectedLinkRef.current.from === link.from && 
                        selectedLinkRef.current.to === link.to) {
                        ctx.strokeStyle = 'rgba(100, 100, 100, 1)';
                        ctx.lineWidth = 3;
                    } else {
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 2;
                    }

                    // 링크 선 그리기
                    ctx.beginPath();
                    ctx.moveTo(fromNode.x * scale + offset.x, fromNode.y * scale + offset.y);
                    ctx.lineTo(toNode.x * scale + offset.x, toNode.y * scale + offset.y);
                    ctx.stroke();

                    // 화살표 그리기
                    const angle = Math.atan2(
                        toNode.y * scale + offset.y - (fromNode.y * scale + offset.y),
                        toNode.x * scale + offset.x - (fromNode.x * scale + offset.x)
                    );

                    // 링크 중앙점 계산
                    const centerX = (fromNode.x * scale + offset.x + toNode.x * scale + offset.x) / 2;
                    const centerY = (fromNode.y * scale + offset.y + toNode.y * scale + offset.y) / 2;

                    // 화살표 크기 설정
                    const arrowSize = 15 * scale;
                    const arrowAngle = Math.PI / 6; // 30도

                    // 화살표 그리기
                    const offsetX = (arrowSize * 0.5) * Math.cos(angle);
                    const offsetY = (arrowSize * 0.5) * Math.sin(angle);
                    
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + offsetX,
                        centerY + offsetY
                    );
                    ctx.lineTo(
                        centerX - arrowSize * Math.cos(angle - arrowAngle) + offsetX,
                        centerY - arrowSize * Math.sin(angle - arrowAngle) + offsetY
                    );
                    ctx.lineTo(
                        centerX - arrowSize * Math.cos(angle + arrowAngle) + offsetX,
                        centerY - arrowSize * Math.sin(angle + arrowAngle) + offsetY
                    );
                    ctx.closePath();
                    ctx.fillStyle = selectedLinkRef.current && 
                        selectedLinkRef.current.from === link.from && 
                        selectedLinkRef.current.to === link.to ? 
                        'rgba(100, 100, 100, 1)' : 'white';
                    ctx.fill();
                }
            });

            // 연결 중인 임시 선 그리기
            if (isConnecting && connectingFrom !== null) {
                const fromNode = nodes.find(n => n.id === connectingFrom);
                if (fromNode) {
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = (mousePosition.x - rect.left - offset.x) / scale;
                    const mouseY = (mousePosition.y - rect.top - offset.y) / scale;

                    ctx.beginPath();
                    ctx.moveTo(fromNode.x * scale + offset.x, fromNode.y * scale + offset.y);
                    ctx.lineTo(mouseX * scale + offset.x, mouseY * scale + offset.y);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]); // 점선 패턴 설정
                    ctx.stroke();
                    ctx.setLineDash([]); // 점선 패턴 초기화
                }
            }
        };

        // 노드 그리기 수정
        const drawNodes = () => {
            nodes.forEach(node => {
                // 마우스 호버 상태 확인
                const rect = canvas.getBoundingClientRect();
                const mouseX = (mousePosition.x - rect.left - offset.x) / scale;
                const mouseY = (mousePosition.y - rect.top - offset.y) / scale;
                const isHovered = Math.sqrt(
                    Math.pow(node.x - mouseX, 2) + Math.pow(node.y - mouseY, 2)
                ) <= 50;

                // 그룹 선택 상태에서 그룹에 속하지 않은 노드인지 확인
                const isInSelectedGroup = selectedGroupRef.current?.nodeIds.includes(node.id) ?? true;
                const opacity = isInSelectedGroup ? 1 : 0.3;

                // 검은색 배경
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, 50 * scale, 0, Math.PI * 2);
                ctx.fill();

                // 흰색 그라데이션 생성
                const gradient = ctx.createRadialGradient(
                    node.x * scale + offset.x,
                    node.y * scale + offset.y,
                    0,
                    node.x * scale + offset.x,
                    node.y * scale + offset.y,
                    50 * scale
                );
                
                // 호버 상태에 따른 그라데이션 색상 조절
                const whiteColor = isHovered ? 100 : 255; // 호버 시 200, 기본 255
                gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.0)');
                gradient.addColorStop(1, `rgba(${whiteColor}, ${whiteColor}, ${whiteColor}, ${opacity})`);

                // 그라데이션 적용
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, 50 * scale, 0, Math.PI * 2);
                ctx.fill();

                // 중앙 흰색 원 추가
                const centerColor = isHovered ? 200 : 255; // 호버 시 200, 기본 255
                ctx.fillStyle = `rgba(${centerColor}, ${centerColor}, ${centerColor}, ${opacity})`;
                ctx.beginPath();
                ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, 39 * scale, 0, Math.PI * 2);
                ctx.fill();

                // 선택된 노드의 레이더 애니메이션
                if (selectedNode === node.id || selectedNodesRef.current.includes(node.id)) {
                    const time = Date.now() / 1000;
                    // 빠른 펄스 애니메이션
                    const pulseProgress = (Math.sin(time * 3.5) + 0.5) / 2; // 0에서 1 사이로 정규화
                    
                    // 최소 반경(노드보다 약간 큰 크기)과 최대 반경 설정
                    const minRadius = 57 * scale;
                    const maxRadius = 60 * scale;
                    
                    // 현재 반경 계산
                    const currentRadius = minRadius + (maxRadius - minRadius) * pulseProgress;
                    
                    // 투명도 계산 (펄스 진행도에 따라 0.4에서 0.6 사이로 변화)
                    const radarOpacity = (0.4 + (0.2 * pulseProgress)) * opacity;
                    
                    // 레이더 원 그리기
                    ctx.beginPath();
                    ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, currentRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${radarOpacity})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // 노드 텍스트
                const textColor = isHovered ? 100 : 0; // 호버 시 200, 기본 255
                ctx.fillStyle = `rgba(${textColor}, ${textColor}, ${textColor}, ${opacity})`;
                ctx.font = `${12 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.label, node.x * scale + offset.x, node.y * scale + offset.y);
            });
        };

        // 초기 그리기 시작
        drawBackground();

        return () => {
            // 이벤트 리스너 정리
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('dblclick', handleDoubleClick);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
            
            // 애니메이션 프레임 취소
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [
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
        dragStart,
        setCanvasContextMenu,
        setConnectingFrom,
        setContextMenu,
        setDraggingNode,
        setIsConnecting,
        setIsDragging,
        setIsGrabbing,
        setLinks,
        setMousePosition,
        setNodes,
        setOffset,
        setScale,
        setSelectedNode,
        dotColor
    ]);

    return canvasRef;
}; 