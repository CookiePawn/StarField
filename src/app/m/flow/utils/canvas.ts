import { Node, ContextMenu as ContextMenuType, NodeContextMenuState } from '../type';

export const handleAddNode = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    contextMenu: ContextMenuType,
    offset: { x: number; y: number },
    scale: number,
    setNodes: (nodes: Node[]) => void,
    setContextMenu: (menu: ContextMenuType) => void,
    nodes: Node[],
    nodeIdRef: React.MutableRefObject<number>
) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (contextMenu.x - rect.left - offset.x) / scale;
    const y = (contextMenu.y - rect.top - offset.y) / scale;

    setNodes([...nodes, {
        id: nodeIdRef.current++,
        x,
        y,
        label: `Node ${nodeIdRef.current}`
    }]);

    setContextMenu({ visible: false, x: 0, y: 0 });
};

export const handleNodeDelete = (
    nodeContextMenu: NodeContextMenuState,
    setNodes: (nodes: Node[]) => void,
    setNodeContextMenu: (menu: NodeContextMenuState) => void,
    nodes: Node[]
) => {
    if (nodeContextMenu.node) {
        setNodes(nodes.filter(node => node.id !== nodeContextMenu.node?.id));
        setNodeContextMenu({ visible: false, x: 0, y: 0, node: null });
    }
};

export const handleNodeRename = (
    nodeContextMenu: NodeContextMenuState,
    setNodes: (nodes: Node[]) => void,
    setNodeContextMenu: (menu: NodeContextMenuState) => void,
    nodes: Node[],
    newLabel: string
) => {
    if (nodeContextMenu.node) {
        setNodes(nodes.map(node =>
            node.id === nodeContextMenu.node?.id
                ? { ...node, label: newLabel }
                : node
        ));
        setNodeContextMenu({ visible: false, x: 0, y: 0, node: null });
    }
};

export const handleNodeConnect = (
    nodeContextMenu: NodeContextMenuState,
    setConnectingFrom: (id: number) => void,
    setSelectedNode: (node: Node) => void,
    setNodeContextMenu: (menu: NodeContextMenuState) => void,
    nodes: Node[]
) => {
    if (nodeContextMenu.node) {
        setConnectingFrom(nodeContextMenu.node.id);
        setSelectedNode(nodeContextMenu.node);
        setNodeContextMenu({ visible: false, x: 0, y: 0, node: null });
    }
};