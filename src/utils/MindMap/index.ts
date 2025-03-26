import { NodeType } from '../../Models';

/**
 * @description 줌 비율 조절
 * @param event 
 * @param scale 
 * @param setScale 
 */
export const handleWheel = (
    event: React.WheelEvent,
    scale: number, setScale: (scale: number) => void) => {
    event.preventDefault();
    const zoomFactor = 0.1;
    const newScale = event.deltaY > 0 ? scale - zoomFactor : scale + zoomFactor;
    setScale(Math.min(Math.max(newScale, 0.5), 2)); // 최소 0.1배, 최대 5배
};

/** 
 * @description 노드 드래그 중 (줌 보정 적용) 
 * @param event 
 * @param draggingNode 
 * @param containerRef 
 * @param scale 
 * @param setNodes 
 */
export const onDrag = (
    event: React.MouseEvent<SVGSVGElement>,
    draggingNode: number | null,
    containerRef: React.RefObject<HTMLDivElement | null>,
    scale: number, 
    setNodes: (nodes: NodeType[] | ((prev: NodeType[]) => NodeType[])) => void) => {
    if (draggingNode === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newX = (event.clientX - rect.left) / scale; // 줌 비율 보정
    const newY = (event.clientY - rect.top) / scale; // 줌 비율 보정

    setNodes((prevNodes) =>
        prevNodes.map((node) =>
            node.id === draggingNode ? { ...node, x: newX, y: newY } : node
        )
    );
};


/**
 * @description 노드 추가 (줌 비율 보정 적용) 
 * @param event 
 * @param containerRef 
 * @param scale 
 * @param nodes 
 * @param setNodes 
 * @param nodeIdRef 
 */
export const addNode = (
    event: React.MouseEvent<SVGSVGElement>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    scale: number,
    nodes: NodeType[],
    setNodes: (nodes: NodeType[]) => void,
    nodeIdRef: React.MutableRefObject<number>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / scale; // 줌 보정 적용
    const offsetY = (event.clientY - rect.top) / scale; // 줌 보정 적용

    const newNode = {
        id: nodeIdRef.current++,
        x: offsetX,
        y: offsetY,
        label: `Node ${nodeIdRef.current - 1}`,
    };
    setNodes([...nodes, newNode]);
};