export interface Node {
    id: number;
    x: number;
    y: number;
    label: string;
}

export interface Link {
    from: number;
    to: number;
}

export interface NodeContextMenu {
    visible: boolean;
    x: number;
    y: number;
    nodeId: number | null;
}

export interface CanvasContextMenu {
    visible: boolean;
    x: number;
    y: number;
}

export interface Group {
    id: number;
    nodeIds: number[];
    centerX: number;
    centerY: number;
    radius: number;
    name: string;
}