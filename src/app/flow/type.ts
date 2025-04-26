export interface Node {
    id: string;
    x: number;
    y: number;
    label: string;
    shape: 'circle' | 'square';
    popup: boolean;
}

export interface Link {
    from: string;
    to: string;
}

export interface NodeContextMenu {
    visible: boolean;
    x: number;
    y: number;
    nodeId: string | null;
}

export interface CanvasContextMenu {
    visible: boolean;
    x: number;
    y: number;
}

export interface Group {
    id: string;
    nodeIds: string[];
    centerX: number;
    centerY: number;
    radius: number;
    name: string;
}