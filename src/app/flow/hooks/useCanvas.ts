import { useEffect, useRef, useState } from 'react';
import { Node, Link, NodeContextMenu, CanvasContextMenu } from '../type';

interface UseCanvasProps {
    isMounted: boolean;
    isGrabbing: boolean;
    isDragging: boolean;
    offset: { x: number; y: number };
    scale: number;
    nodes: Node[];
    links: Link[];
    selectedNode: string | null;
    draggingNode: string | null;
    isConnecting: boolean;
    connectingFrom: string | null;
    mousePosition: { x: number; y: number };
    setIsDragging: (value: boolean) => void;
    setDraggingNode: (value: string | null) => void;
    setSelectedNode: (value: string | null) => void;
    setNodes: (value: Node[]) => void;
    setLinks: (value: Link[]) => void;
    setOffset: (value: { x: number; y: number }) => void;
    setScale: (value: number) => void;
    setMousePosition: (value: { x: number; y: number }) => void;
    setIsGrabbing: (value: boolean) => void;
    setIsConnecting: (value: boolean) => void;
    setConnectingFrom: (value: string | null) => void;
    dragStart: React.RefObject<{ x: number; y: number }>;
    setContextMenu: (menu: NodeContextMenu) => void;
    setCanvasContextMenu: (menu: CanvasContextMenu) => void;
    dotColor: string;
    setEditingGroup: (group: Group | null) => void;
}

interface Group {
    id: string;
    nodeIds: string[];
    centerX: number;
    centerY: number;
    radius: number;
    name: string;
    isEditing: boolean;
}

const callGeminiAPI = async (inputText: string, instruction?: string) => {
    const API_KEY = 'AIzaSyCq-S1vAxRvFimOAocUAdfN5LcJTsMGjkk';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const prompt = instruction ? `${instruction}\n\n${inputText}` : inputText;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API 호출 실패 상세:', errorText);
            throw new Error('API 호출 실패: ' + errorText);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text || '응답이 없습니다.';
    } catch (error) {
        console.error('API 호출 중 오류 발생:', error);
        throw error;
    }
};

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
    dotColor,
    setEditingGroup
}: UseCanvasProps) => {
    const [popupNode, setPopupNode] = useState<Node | null>(null);
    const [popupTab, setPopupTab] = useState<'input' | 'results' | 'settings'>('input');
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const selectedLinkRef = useRef<Link | null>(null);
    const dragBoxRef = useRef<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
    const selectedNodesRef = useRef<string[]>([]);
    const groupsRef = useRef<Group[]>([]);
    const selectedGroupRef = useRef<Group | null>(null);
    const dragOffset = useRef<{ x: number; y: number } | null>(null);
    const isComposing = useRef<boolean>(false);
    const editingGroupRef = useRef<Group | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const editingNodeRef = useRef<Node | null>(null);
    const inputUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isDraggingGroupRef = useRef<boolean>(false);
    const editingGroupIdRef = useRef<string | null>(null);

    const handleGroupNameUpdate = (name: string) => {
        if (editingGroupRef.current) {
            editingGroupRef.current.name = name;
            // groups 배열 업데이트
            const updatedGroups = groupsRef.current.map(group => 
                group.id === editingGroupRef.current?.id 
                    ? { ...group, name } 
                    : group
            );
            groupsRef.current = updatedGroups;
        }
    };

    const handleGroupNameFinish = () => {
        if (editingGroupRef.current) {
            editingGroupRef.current.isEditing = false;
            editingGroupIdRef.current = null;
            setEditingGroup(null);
            editingGroupRef.current = null;
        }
    };

    const handleNodeNameUpdate = (name: string) => {
        if (editingNodeRef.current) {
            setNodes(nodes.map(n => 
                n.id === editingNodeRef.current?.id ? { ...n, label: name } : n
            ));
        }
    };

    const handleNodeNameFinish = () => {
        if (editingNodeRef.current) {
            editingNodeRef.current = null;
            if (inputRef.current) {
                const input = inputRef.current;
                inputRef.current = null; // 먼저 ref를 null로 설정
                if (document.body.contains(input)) {
                    input.remove();
                }
            }
        }
    };

    // const handleNodeDoubleClick = (e: MouseEvent) => {
    //     const canvas = canvasRef.current;
    //     if (!canvas) return;

    //     const rect = canvas.getBoundingClientRect();
    //     const x = (e.clientX - rect.left - offset.x) / scale;
    //     const y = (e.clientY - rect.top - offset.y) / scale;

    //     // 노드 클릭 확인
    //     const clickedNode = nodes.find(node => {
    //         const dx = node.x - x;
    //         const dy = node.y - y;
    //         return Math.sqrt(dx * dx + dy * dy) <= 50;
    //     });

    //     if (clickedNode) {
    //         // 노드 더블클릭 시 팝업 토글
    //         if (popupNode?.id === clickedNode.id) {
    //             setPopupNode(null);
    //         } else {
    //             setPopupNode(clickedNode);
    //             setPopupTab('input');
    //             setInputText('');
    //             setOutputText('');
    //         }
    //     } else {
    //         // 배경 더블클릭 시 노드 생성 메뉴 표시
    //         setCanvasContextMenu({
    //             visible: true,
    //             x: e.clientX,
    //             y: e.clientY
    //         });
    //     }
    // };

    const handleRun = async (input: string, instruction: string) => {
        try {
            const response = await callGeminiAPI(input, instruction);
            setOutputText(response);
            setPopupTab('results');
        } catch (error) {
            console.error('API 호출 중 오류 발생:', error);
            setOutputText('오류가 발생했습니다. 다시 시도해주세요.');
            setPopupTab('results');
        }
    };

    useEffect(() => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 스페이스바 이벤트 처리
        const handleKeyDown = (e: KeyboardEvent) => {
            // input이 활성화되어 있을 때는 노드 삭제 방지
            if (inputRef.current) {
                return;
            }

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

                // 그룹에서 삭제된 노드 제거
                groupsRef.current = groupsRef.current.map(group => ({
                    ...group,
                    nodeIds: group.nodeIds.filter(id => !selectedNodesRef.current.includes(id))
                }));

                // 노드가 1개 이하인 그룹 제거
                groupsRef.current = groupsRef.current.filter(group => {
                    // 그룹에 속한 실제 노드 수 계산 (그룹 ID 제외)
                    const nodeCount = group.nodeIds.filter(id => !id.startsWith('group-')).length;
                    return nodeCount > 1;
                });

                // 선택 초기화
                selectedNodesRef.current = [];
                setSelectedNode(null);
            } else if (e.key === 'Enter') {
                // 그룹 이름 편집 완료
                const editingGroup = groupsRef.current.find(group => group.isEditing);
                if (editingGroup) {
                    // 이름이 비어있으면 기본값 설정
                    if (editingGroup.name.trim() === '') {
                        editingGroup.name = 'Group';
                    }
                    // 편집 완료
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
                    if (e.key === 'Enter') {
                        // 이름이 비어있으면 기본값 설정
                        if (editingGroup.name.trim() === '') {
                            editingGroup.name = 'Group';
                        }
                        // 편집 완료
                        editingGroup.isEditing = false;
                    } else if (e.key === 'Escape') {
                        // 편집 취소
                        editingGroup.isEditing = false;
                    } else if (e.key === 'Backspace') {
                        // 백스페이스
                        editingGroup.name = editingGroup.name.slice(0, -1);
                    } else if (!isComposing.current && e.key.length === 1 && editingGroup.name.length < 30) {
                        // 일반 문자 입력 (한글 제외)
                        editingGroup.name += e.key;
                    }
                }
            }
            // Command+G로 그룹 생성
            if ((e.ctrlKey || e.metaKey) && e.key === 'g' && selectedNodesRef.current.length > 1) {
                e.preventDefault(); // 기본 동작 방지
                const selectedNodes = nodes.filter(node => selectedNodesRef.current.includes(node.id));
                if (selectedNodes.length > 1) {
                    // 그룹의 중심점 계산
                    const centerX = selectedNodes.reduce((sum, node) => sum + node.x, 0) / selectedNodes.length;
                    const centerY = selectedNodes.reduce((sum, node) => sum + node.y, 0) / selectedNodes.length;

                    // 그룹의 반경 계산 (가장 먼 노드까지의 거리 + 여유 공간)
                    const radius = Math.max(...selectedNodes.map(node => 
                        Math.sqrt(Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2))
                    )) + 50;

                    // 새 그룹 생성
                    const newGroup: Group = {
                        id: `group-${Date.now()}`,
                        nodeIds: selectedNodesRef.current,
                        centerX,
                        centerY,
                        radius,
                        name: `Group ${groupsRef.current.length + 1}`,
                        isEditing: false
                    };

                    // 새 그룹을 포함하는 상위 그룹 찾기
                    const parentGroups = groupsRef.current.filter(group => 
                        selectedNodesRef.current.some(nodeId => group.nodeIds.includes(nodeId))
                    );

                    // 상위 그룹들의 nodeIds에 새 그룹의 ID 추가
                    parentGroups.forEach(parentGroup => {
                        if (!parentGroup.nodeIds.includes(newGroup.id)) {
                            parentGroup.nodeIds.push(newGroup.id);
                        }
                    });

                    // 새 그룹을 groups 배열에 추가
                    groupsRef.current = [...groupsRef.current, newGroup];

                    // 모든 그룹을 검사하여 노드가 1개만 있는 그룹 제거
                    groupsRef.current = groupsRef.current.filter(group => {
                        // 그룹에 속한 실제 노드 수 계산 (그룹 ID 제외)
                        const nodeCount = group.nodeIds.filter(id => !id.startsWith('group-')).length;
                        
                        // 노드가 1개 이하인 그룹 제거
                        return nodeCount > 1;
                    });
                }
            }
        };

        const handleKeyUp = () => {
            // 키보드 이벤트 처리 제거
        };

        // composition 이벤트 처리
        const handleCompositionStart = () => {
            isComposing.current = true;
        };

        const handleCompositionEnd = (e: CompositionEvent) => {
            isComposing.current = false;
            const target = e.target as HTMLInputElement;
            if (editingNodeRef.current) {
                handleNodeNameUpdate(target.value);
            } else if (editingGroupRef.current) {
                handleGroupNameUpdate(target.value);
            }
        };

        // input 이벤트 처리 추가
        const handleInput = (e: Event) => {
            // 한글 입력 중에는 input 이벤트를 무시
            if (isComposing.current) {
                return;
            }
            
            const target = e.target as HTMLInputElement;
            if (editingNodeRef.current) {
                handleNodeNameUpdate(target.value);
            } else if (editingGroupRef.current) {
                handleGroupNameUpdate(target.value);
            }
        };

        // 마우스 이벤트 처리
        const handleMouseDown = (e: MouseEvent) => {
            // 우클릭 메뉴 닫기
            setContextMenu({ visible: false, x: 0, y: 0, nodeId: null });
            setCanvasContextMenu({ visible: false, x: 0, y: 0 });

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;

            // 먼저 링크 선택 확인
            selectLink(e.clientX, e.clientY);
            if (selectedLinkRef.current) {
                return;
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
                        selectedNodesRef.current.push(clickedNode.id);
                    } else {
                        selectedNodesRef.current.splice(index, 1);
                    }
                    setSelectedNode(selectedNodesRef.current.length === 1 ? selectedNodesRef.current[0] : null);
                    
                    // 연결 모드 진입
                    setIsConnecting(true);
                    setConnectingFrom(clickedNode.id);
                    setIsDragging(false); // 드래그 모드 비활성화
                    setDraggingNode(null); // 드래그 노드 초기화
                    return; // 연결 모드로 진입하면 여기서 종료
                } else if (e.altKey) {
                    // Option/Alt+클릭: 노드 복사
                    const newNode: Node = {
                        id: `node-${Date.now()}`,
                        x: clickedNode.x,
                        y: clickedNode.y,
                        label: clickedNode.label,
                        shape: clickedNode.shape,
                        popup: clickedNode.popup
                    };
                    setNodes([...nodes, newNode]);

                    // 노드가 속한 모든 그룹 찾기 (중첩된 그룹 포함)
                    const findParentGroups = (nodeId: string, groups: Group[]): Group[] => {
                        const parentGroups: Group[] = [];
                        const findGroups = (id: string) => {
                            groups.forEach(group => {
                                if (group.nodeIds.includes(id)) {
                                    parentGroups.push(group);
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

                dragOffset.current = {
                    x: x - clickedNode.x,
                    y: y - clickedNode.y
                };

                // 입력 필드 클릭 처리
                if (clickedNode && clickedNode.popup) {
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX - rect.left - offset.x) / scale;
                    const y = (e.clientY - rect.top - offset.y) / scale;

                    const popupX = clickedNode.x - 150;
                    const popupY = clickedNode.y + 30;
                    const inputX = popupX + 10;
                    const inputY = popupY + 25;
                    const inputWidth = 200;
                    const inputHeight = 15;

                    if (x >= inputX && x <= inputX + inputWidth &&
                        y >= inputY && y <= inputY + inputHeight) {
                        e.preventDefault();
                        e.stopPropagation();

                        // 노드 라벨 수정
                        const newLabel = prompt('Enter new label:', clickedNode.label);
                        if (newLabel && newLabel.trim()) {
                            setNodes(nodes.map(n => 
                                n.id === clickedNode.id ? { ...n, label: newLabel.trim() } : n
                            ));
                        }
                        return;
                    }
                }

                // 슬라이더 클릭 처리
                if (clickedNode.popup) {
                    // maxToken 슬라이더 영역
                    const maxTokenSliderX = clickedNode.x - 200;
                    const maxTokenSliderY = clickedNode.y + 620;
                    const maxTokenSliderWidth = 300;
                    const maxTokenSliderHeight = 10;

                    if (x >= maxTokenSliderX && x <= maxTokenSliderX + maxTokenSliderWidth &&
                        y >= maxTokenSliderY && y <= maxTokenSliderY + maxTokenSliderHeight) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 슬라이더 값 계산
                        const sliderValue = (x - maxTokenSliderX) / maxTokenSliderWidth;
                        const maxToken = Math.round(sliderValue * 100);
                        
                        // 노드 업데이트
                        setNodes(nodes.map(n => 
                            n.id === clickedNode.id ? { ...n, maxToken } : n
                        ));
                        return;
                    }

                    // creativity 슬라이더 영역
                    const creativitySliderX = clickedNode.x - 200;
                    const creativitySliderY = clickedNode.y + 670;
                    const creativitySliderWidth = 300;
                    const creativitySliderHeight = 10;

                    if (x >= creativitySliderX && x <= creativitySliderX + creativitySliderWidth &&
                        y >= creativitySliderY && y <= creativitySliderY + creativitySliderHeight) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 슬라이더 값 계산
                        const sliderValue = (x - creativitySliderX) / creativitySliderWidth;
                        const creativity = Math.round(sliderValue * 100) / 100;
                        
                        // 노드 업데이트
                        setNodes(nodes.map(n => 
                            n.id === clickedNode.id ? { ...n, creativity } : n
                        ));
                        return;
                    }
                }
                return;
            }

            // 팝업이 열려있는 노드 주변 영역 클릭 확인
            const nodeWithPopup = nodes.find(node => node.popup);
            if (nodeWithPopup) {
                const popupX = nodeWithPopup.x - 200;
                const popupY = nodeWithPopup.y + 60;
                const popupWidth = 400;
                const popupHeight = 700;

                // 월드 좌표계에서 화면 좌표계로 변환
                const screenX = (popupX * scale) + offset.x + rect.left;
                const screenY = (popupY * scale) + offset.y + rect.top;
                const screenWidth = popupWidth * scale;
                const screenHeight = popupHeight * scale;

                // 마우스 좌표가 팝업 영역 내에 있는지 확인
                if (e.clientX >= screenX && e.clientX <= screenX + screenWidth &&
                    e.clientY >= screenY && e.clientY <= screenY + screenHeight) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }

            // 노드가 선택되지 않았을 때만 그룹 선택 확인
            const clickedGroup = groupsRef.current
                .filter(group => {
                    const distance = Math.sqrt(
                        Math.pow(x - group.centerX, 2) + Math.pow(y - group.centerY, 2)
                    );
                    return distance <= group.radius;
                })
                .sort((a, b) => a.radius - b.radius)[0]; // 가장 작은 반경을 가진 그룹 선택

            if (clickedGroup) {
                selectedGroupRef.current = clickedGroup;
                setIsDragging(true);
                isDraggingGroupRef.current = true;
                dragStart.current = {
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y
                };
                return;
            }

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

        // 더블클릭 이벤트 처리 수정
        const handleDoubleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;

            // 팝업이 열려있는 노드 주변 영역 클릭 확인
            const nodeWithPopup = nodes.find(node => node.popup);
            if (nodeWithPopup) {
                const popupX = nodeWithPopup.x - 200;
                const popupY = nodeWithPopup.y + 60;
                const popupWidth = 400;
                const popupHeight = 700;

                // 월드 좌표계에서 화면 좌표계로 변환
                const screenX = (popupX * scale) + offset.x + rect.left;
                const screenY = (popupY * scale) + offset.y + rect.top;
                const screenWidth = popupWidth * scale;
                const screenHeight = popupHeight * scale;

                // 마우스 좌표가 팝업 영역 내에 있는지 확인
                if (e.clientX >= screenX && e.clientX <= screenX + screenWidth &&
                    e.clientY >= screenY && e.clientY <= screenY + screenHeight) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }

            // 먼저 그룹 이름 클릭 확인
            const clickedGroupName = groupsRef.current.find(group => {
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

            if (clickedGroupName) {
                clickedGroupName.isEditing = true;
                editingGroupIdRef.current = clickedGroupName.id;
                editingGroupRef.current = clickedGroupName;
                setEditingGroup(clickedGroupName);
                return;
            }

            // 그룹 이름이 클릭되지 않았다면 노드 클릭 확인
            const clickedNode = nodes.find(node => {
                const dx = node.x - x;
                const dy = node.y - y;
                return Math.sqrt(dx * dx + dy * dy) <= 50;
            });

            if (clickedNode) {
                // 노드 더블클릭 시 팝업 토글
                setPopupNode(clickedNode);
                setPopupTab('input');
                setInputText('');
                setOutputText('');
            } else {
                // 배경 더블클릭 시 노드 생성 메뉴 표시
                setCanvasContextMenu({
                    visible: true,
                    x: e.clientX,
                    y: e.clientY
                });
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
            } else if (isDragging && draggingNode !== null && !isConnecting) {
                const rect = canvas.getBoundingClientRect();
                const newX = (e.clientX - rect.left - offset.x) / scale;
                const newY = (e.clientY - rect.top - offset.y) / scale;
                
                // 노드 위치 업데이트
                setNodes(nodes.map(node =>
                    node.id === draggingNode ? { 
                        ...node, 
                        x: newX - (dragOffset.current?.x || 0), 
                        y: newY - (dragOffset.current?.y || 0) 
                    } : node
                ));

                // 팝업이 열려있는 노드가 드래그 중이라면 팝업 위치도 업데이트
                if (popupNode?.id === draggingNode) {
                    setPopupNode({
                        ...popupNode,
                        x: newX - (dragOffset.current?.x || 0),
                        y: newY - (dragOffset.current?.y || 0)
                    });
                }
            } else if (isDragging && !isConnecting) {
                // 캔버스 드래그
                setOffset({
                    x: e.clientX - dragStart.current.x,
                    y: e.clientY - dragStart.current.y
                });
            } else if (isConnecting) {
                // 연결 모드에서 드래그 중 - 마우스 위치만 업데이트
                const rect = canvas.getBoundingClientRect();
                setMousePosition({
                    x: (e.clientX - rect.left - offset.x) / scale,
                    y: (e.clientY - rect.top - offset.y) / scale
                });
            } else if (dragBoxRef.current) {
                // 드래그 박스 업데이트
                dragBoxRef.current.endX = e.clientX;
                dragBoxRef.current.endY = e.clientY;
            }
            // 마우스 위치 업데이트
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseUp = () => {
            if (isConnecting && connectingFrom) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = mousePosition.x;
                const mouseY = mousePosition.y;
                
                // 마우스 위치를 캔버스 좌표계로 변환
                const x = (mouseX - rect.left - offset.x) / scale;
                const y = (mouseY - rect.top - offset.y) / scale;

                console.log('Mouse position:', { x, y });
                console.log('Connecting from:', connectingFrom);
                console.log('Current nodes:', nodes);

                // 마우스를 놓은 위치에 노드가 있는지 확인
                const targetNode = nodes.find(node => {
                    if (node.id === connectingFrom) return false; // 자기 자신과는 연결 안됨
                    const dx = node.x - x;
                    const dy = node.y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    console.log('Checking node:', node.id, 'at position:', { x: node.x, y: node.y }, 'distance:', distance);
                    return distance <= 50;
                });

                if (targetNode) {
                    console.log('Found target node:', targetNode.id);
                    // 이미 존재하는 링크인지 확인
                    const linkExists = links.some(link => 
                        (link.from === connectingFrom && link.to === targetNode.id) ||
                        (link.from === targetNode.id && link.to === connectingFrom)
                    );

                    if (!linkExists) {
                        console.log('Creating new link');
                        // 새로운 링크 생성
                        const newLink: Link = {
                            id: `link-${Date.now()}`,
                            from: connectingFrom,
                            to: targetNode.id
                        };
                        setLinks([...links, newLink]);
                    } else {
                        console.log('Link already exists');
                    }
                } else {
                    console.log('No target node found');
                }
            }

            setIsDragging(false);
            setDraggingNode(null);
            setIsConnecting(false);
            setConnectingFrom(null);
            dragBoxRef.current = null;
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

        // 그룹 이름 더블클릭 이벤트 처리
        const handleGroupDoubleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / scale;
            const y = (e.clientY - rect.top - offset.y) / scale;

            // 그룹 이름 클릭 확인
            const clickedGroup = groupsRef.current.find(group => {
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

            if (clickedGroup) {
                clickedGroup.isEditing = true;
            }
        };

        // 이벤트 리스너 등록
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('compositionstart', handleCompositionStart);
        window.addEventListener('compositionend', handleCompositionEnd);
        window.addEventListener('input', handleInput);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('dblclick', handleDoubleClick);
        canvas.addEventListener('dblclick', handleGroupDoubleClick);
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

            // 먼저 클릭된 위치가 어떤 그룹 안에 있는지 확인
            const clickedGroup = groupsRef.current.find(group => {
                const distance = Math.sqrt(
                    Math.pow(mouseX - group.centerX, 2) + Math.pow(mouseY - group.centerY, 2)
                );
                return distance <= group.radius;
            });

            // 모든 링크에 대해 거리 계산
            for (const link of links) {
                const fromNode = nodes.find(n => n.id === link.from);
                const toNode = nodes.find(n => n.id === link.to);
                if (!fromNode || !toNode) continue;

                // 링크가 그룹 안에 있는지 확인
                const isLinkInGroup = clickedGroup && 
                    clickedGroup.nodeIds.includes(link.from) && 
                    clickedGroup.nodeIds.includes(link.to);

                // 그룹 안에서 클릭했을 때는 그룹 안의 링크만 선택
                if (clickedGroup && !isLinkInGroup) {
                    continue;
                }

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

        // 그룹 그리기 함수 수정
        const drawGroups = () => {
            const rect = canvas.getBoundingClientRect();
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
                
                if (!group.isEditing) {
                    // 일반 텍스트 표시
                    ctx.fillStyle = strokeStyle;
                    ctx.fillText(
                        group.name,
                        group.centerX * scale + offset.x,
                        (group.centerY - group.radius - 20) * scale + offset.y
                    );
                } else {
                    // 입력 필드 생성 또는 업데이트
                    if (!inputRef.current || editingGroupRef.current?.id !== group.id) {
                        if (inputRef.current) {
                            inputRef.current.remove();
                        }

                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = group.name;
                        input.style.position = 'absolute';
                        input.style.left = `${(group.centerX - ctx.measureText(group.name).width / 2) * scale + offset.x + rect.left}px`;
                        input.style.top = `${(group.centerY - group.radius - 20 - 7) * scale + offset.y + rect.top}px`;
                        input.style.width = `${ctx.measureText(group.name).width * scale}px`;
                        input.style.height = `${14 * scale}px`;
                        input.style.backgroundColor = 'transparent';
                        input.style.border = 'none';
                        input.style.color = strokeStyle;
                        input.style.fontSize = `${14 * scale}px`;
                        input.style.fontFamily = 'Arial';
                        input.style.textAlign = 'center';
                        input.style.outline = 'none';

                        // 이벤트 리스너 추가
                        input.addEventListener('input', handleInput);
                        input.addEventListener('compositionstart', handleCompositionStart);
                        input.addEventListener('compositionend', handleCompositionEnd);

                        input.addEventListener('blur', () => {
                            handleGroupNameFinish();
                        });

                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                handleGroupNameFinish();
                            }
                        });

                        document.body.appendChild(input);
                        inputRef.current = input;
                        editingGroupRef.current = group;
                        input.focus();
                    }
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
            // 각 노드의 연결된 링크 수 계산
            const nodeLinkCounts = new Map<string, number>();
            links.forEach(link => {
                nodeLinkCounts.set(link.from, (nodeLinkCounts.get(link.from) || 0) + 1);
                nodeLinkCounts.set(link.to, (nodeLinkCounts.get(link.to) || 0) + 1);
            });

            nodes.forEach(node => {
                // 마우스 호버 상태 확인
                const rect = canvas.getBoundingClientRect();
                const mouseX = (mousePosition.x - rect.left - offset.x) / scale;
                const mouseY = (mousePosition.y - rect.top - offset.y) / scale;

                // 연결된 링크 수에 따른 노드 크기 계산
                const linkCount = nodeLinkCounts.get(node.id) || 0;
                const baseSize = 50;
                const sizeMultiplier = 1 + (linkCount * 0.1); // 링크 1개당 10%씩 크기 증가
                const nodeSize = baseSize * sizeMultiplier;

                const isHovered = Math.sqrt(
                    Math.pow(node.x - mouseX, 2) + Math.pow(node.y - mouseY, 2)
                ) <= nodeSize;

                // 그룹 선택 상태에서 그룹에 속하지 않은 노드인지 확인
                const isInSelectedGroup = selectedGroupRef.current?.nodeIds.includes(node.id) ?? true;
                const opacity = isInSelectedGroup ? 1 : 0.3;

                // 검은색 배경
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, nodeSize * scale, 0, Math.PI * 2);
                ctx.fill();

                // 흰색 그라데이션 생성
                const gradient = ctx.createRadialGradient(
                    node.x * scale + offset.x,
                    node.y * scale + offset.y,
                    0,
                    node.x * scale + offset.x,
                    node.y * scale + offset.y,
                    nodeSize * scale
                );
                
                // 호버 상태에 따른 그라데이션 색상 조절
                const whiteColor = isHovered ? 100 : 255;
                gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.0)');
                gradient.addColorStop(1, `rgba(${whiteColor}, ${whiteColor}, ${whiteColor}, ${opacity})`);

                // 그라데이션 적용
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, nodeSize * scale, 0, Math.PI * 2);
                ctx.fill();

                // 중앙 흰색 원 추가
                const centerColor = isHovered ? 200 : 255;
                ctx.fillStyle = `rgba(${centerColor}, ${centerColor}, ${centerColor}, ${opacity})`;
                ctx.beginPath();
                ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, (nodeSize * 0.78) * scale, 0, Math.PI * 2);
                ctx.fill();

                // 팝업 그리기
                if (node.popup) {
                    const popupWidth = 400 * scale;
                    const popupHeight = 700 * scale;
                    const popupX = node.x * scale + offset.x - popupWidth / 2;
                    const popupY = node.y * scale + offset.y + nodeSize * scale + 10 * scale;

                    // 팝업 배경
                    ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
                    ctx.beginPath();
                    ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 10 * scale);
                    ctx.fill();

                    // 팝업 테두리
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 10 * scale);
                    ctx.stroke();

                    // 섹션 구분선
                    const drawSectionDivider = (y: number) => {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                        ctx.beginPath();
                        ctx.moveTo(popupX + 20 * scale, y);
                        ctx.lineTo(popupX + popupWidth - 20 * scale, y);
                        ctx.stroke();
                    };

                    // 섹션 제목
                    const drawSectionTitle = (title: string, y: number) => {
                        ctx.font = `bold ${14 * scale}px Arial`;
                        ctx.fillStyle = 'white';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.fillText(title, popupX + 20 * scale, y);
                    };

                    // 입력 필드 배경
                    const drawInputField = (x: number, y: number, width: number, height: number, label: string) => {
                        // 배경
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.beginPath();
                        ctx.roundRect(x, y, width, height, 5 * scale);
                        ctx.fill();

                        // 테두리
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.roundRect(x, y, width, height, 5 * scale);
                        ctx.stroke();

                        // 라벨
                        ctx.font = `${12 * scale}px Arial`;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'top';
                        ctx.fillText(label, x + 10 * scale, y - 20 * scale);
                    };

                    // 슬라이더
                    const drawSlider = (x: number, y: number, width: number, height: number, label: string, value: number) => {
                        // 배경
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                        ctx.beginPath();
                        ctx.roundRect(x, y, width, height, height / 2);
                        ctx.fill();

                        // 채워진 부분
                        const filledWidth = width * value;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.beginPath();
                        ctx.roundRect(x, y, filledWidth, height, height / 2);
                        ctx.fill();

                        // 테두리
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.roundRect(x, y, width, height, height / 2);
                        ctx.stroke();

                        // 라벨과 값
                        ctx.font = `${12 * scale}px Arial`;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`${label}: ${Math.round(value * 100)}%`, x, y - 15 * scale);
                    };

                    // 토글 버튼
                    const drawToggle = (x: number, y: number, width: number, height: number, label: string, isOn: boolean) => {
                        // 배경
                        ctx.fillStyle = isOn ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
                        ctx.beginPath();
                        ctx.roundRect(x, y, width, height, height / 2);
                        ctx.fill();

                        // 토글 버튼
                        const buttonSize = height - 4 * scale;
                        const buttonX = isOn ? x + width - buttonSize - 2 * scale : x + 2 * scale;
                        ctx.fillStyle = 'white';
                        ctx.beginPath();
                        ctx.arc(buttonX + buttonSize / 2, y + height / 2, buttonSize / 2, 0, Math.PI * 2);
                        ctx.fill();

                        // 라벨
                        ctx.font = `${12 * scale}px Arial`;
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(label, x, y - 15 * scale);
                    };

                    // 1. 노드 이름 수정
                    drawSectionTitle('1. 노드 이름', popupY + 20 * scale);
                    
                    // 입력 필드 배경
                    const inputX = popupX + 20 * scale;
                    const inputY = popupY + 50 * scale;
                    const inputWidth = 360 * scale;
                    const inputHeight = 30 * scale;

                    // 입력 필드 배경 그리기
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.beginPath();
                    ctx.roundRect(inputX, inputY, inputWidth, inputHeight, 5 * scale);
                    ctx.fill();

                    // 입력 필드 테두리
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(inputX, inputY, inputWidth, inputHeight, 5 * scale);
                    ctx.stroke();

                    // 입력 필드 생성 또는 업데이트
                    if (!inputRef.current || editingNodeRef.current?.id !== node.id) {
                        if (inputRef.current) {
                            inputRef.current.remove();
                        }

                        const input = document.createElement('input');
                        input.type = 'text';
                        input.value = node.label;
                        input.style.position = 'absolute';
                        input.style.left = `${inputX + rect.left}px`;
                        input.style.top = `${inputY + rect.top}px`;
                        input.style.width = `${inputWidth}px`;
                        input.style.height = `${inputHeight}px`;
                        input.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        input.style.border = '1px solid rgba(255, 255, 255, 0.3)';
                        input.style.borderRadius = '5px';
                        input.style.padding = '5px';
                        input.style.color = 'white';
                        input.style.fontSize = `${12 * scale}px`;
                        input.style.fontFamily = 'Arial';
                        input.style.outline = 'none';

                        // 이벤트 리스너 추가
                        input.addEventListener('input', handleInput);
                        input.addEventListener('compositionstart', handleCompositionStart);
                        input.addEventListener('compositionend', handleCompositionEnd);

                        input.addEventListener('blur', () => {
                            handleNodeNameFinish();
                        });

                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                handleNodeNameFinish();
                            }
                        });

                        document.body.appendChild(input);
                        inputRef.current = input;
                        editingNodeRef.current = node;
                        input.focus();
                    }

                    // 구분선
                    drawSectionDivider(popupY + 100 * scale);

                    // 2. 입력 텍스트 지침
                    drawSectionTitle('2. 입력 텍스트 지침', popupY + 120 * scale);
                    drawInputField(
                        popupX + 20 * scale,
                        popupY + 150 * scale,
                        360 * scale,
                        60 * scale,
                        ''
                    );

                    // 구분선
                    drawSectionDivider(popupY + 230 * scale);

                    // 3. 입력 텍스트
                    drawSectionTitle('3. 입력 텍스트', popupY + 250 * scale);
                    drawInputField(
                        popupX + 20 * scale,
                        popupY + 280 * scale,
                        360 * scale,
                        60 * scale,
                        ''
                    );

                    // 구분선
                    drawSectionDivider(popupY + 360 * scale);

                    // 4. AI 응답
                    drawSectionTitle('4. AI 응답', popupY + 380 * scale);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.beginPath();
                    ctx.roundRect(popupX + 20 * scale, popupY + 410 * scale, 360 * scale, 60 * scale, 5 * scale);
                    ctx.fill();

                    // 구분선
                    drawSectionDivider(popupY + 490 * scale);

                    // 5. 고급 옵션
                    drawSectionTitle('5. 고급 옵션', popupY + 510 * scale);

                    // 5-1. AI 모델 선택
                    drawToggle(
                        popupX + 20 * scale,
                        popupY + 560 * scale,
                        100 * scale,
                        20 * scale,
                        'AI 모델',
                        true
                    );

                    // 5-2. max token 설정
                    drawSlider(
                        popupX + 20 * scale,
                        popupY + 620 * scale,
                        300 * scale,
                        10 * scale,
                        'Max Token',
                        (node.maxToken || 50) / 100
                    );

                    // 5-3. 창의력/연관도 설정
                    drawSlider(
                        popupX + 20 * scale,
                        popupY + 670 * scale,
                        300 * scale,
                        10 * scale,
                        '창의력',
                        node.creativity || 0.7
                    );
                }

                // 선택된 노드의 레이더 애니메이션
                if (selectedNode === node.id || selectedNodesRef.current.includes(node.id)) {
                    const time = Date.now() / 1000;
                    const pulseProgress = (Math.sin(time * 3.5) + 0.5) / 2;
                    const minRadius = (nodeSize + 7) * scale;
                    const maxRadius = (nodeSize + 10) * scale;
                    const currentRadius = minRadius + (maxRadius - minRadius) * pulseProgress;
                    const radarOpacity = (0.4 + (0.2 * pulseProgress)) * opacity;
                    
                    ctx.beginPath();
                    ctx.arc(node.x * scale + offset.x, node.y * scale + offset.y, currentRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${radarOpacity})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // 노드 텍스트
                const textColor = isHovered ? 100 : 0;
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
            window.removeEventListener('compositionstart', handleCompositionStart);
            window.removeEventListener('compositionend', handleCompositionEnd);
            window.removeEventListener('input', handleInput);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('dblclick', handleDoubleClick);
            canvas.removeEventListener('dblclick', handleGroupDoubleClick);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('wheel', handleWheel);
            
            // 애니메이션 프레임 취소
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            try {
                if (inputRef.current) {
                    const input = inputRef.current;
                    inputRef.current = null; // 먼저 ref를 null로 설정
                    if (document.body.contains(input)) {
                        input.remove();
                    }
                }
            } catch (e) {
                // 무시
                console.error(e);
            }
            if (inputUpdateTimeoutRef.current) {
                clearTimeout(inputUpdateTimeoutRef.current);
                inputUpdateTimeoutRef.current = null;
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
        dotColor,
        setEditingGroup,
    ]);

    return {
        canvasRef,
        editingGroup: editingGroupRef.current,
        handleGroupNameUpdate,
        handleGroupNameFinish,
        popupNode,
        popupTab,
        setPopupTab,
        inputText,
        setInputText,
        outputText,
        handleRun,
        setPopupNode
    };
}; 