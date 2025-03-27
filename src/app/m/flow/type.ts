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

export interface ContextMenu {
    visible: boolean;
    x: number;
    y: number;
}

export interface NodeContextMenuState extends ContextMenu {
    node: Node | null;
}