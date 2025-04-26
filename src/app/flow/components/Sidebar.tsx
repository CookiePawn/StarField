'use client';

import React from 'react';
import Image from 'next/image';
import styles from '../styles/sidebar.module.css';
import { Plus, Minus, Dot } from '../../../assets/icons/index';

interface EditorSidebarProps {
    onAddNode: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ onAddNode }) => {
    return (
        <div className={styles.editorSidebar}>
            <div 
                key={"textinput"} 
                className={styles.editorSidebarButton}
                onClick={onAddNode}
            >
                <p>T</p>
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className={styles.editorSidebarButton}>
                    <p>+</p>
                </div>
            ))}
        </div>
    );
};


export const ZoomSidebar: React.FC<{ 
    scale: number, 
    setScale: (scale: number) => void,
    dotColor: string,
    setDotColor: (color: string) => void 
}> = ({ scale, setScale, dotColor, setDotColor }) => {
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 2.0;

    const handleZoomIn = () => {
        if (scale < MAX_SCALE) {
            setScale(Math.min(scale + 0.1, MAX_SCALE));
        }
    };

    const handleZoomOut = () => {
        if (scale > MIN_SCALE) {
            setScale(Math.max(scale - 0.1, MIN_SCALE));
        }
    };

    return (
        <>
            <div className={styles.zoomSidebar}>
                <div
                    className={styles.zoomSidebarButton}
                    onClick={handleZoomIn}
                    style={{ opacity: scale >= MAX_SCALE ? 0.5 : 1 }}
                >
                    <Image src={Plus} alt="plus" width={14} height={14} />
                </div>
                <div
                    className={styles.zoomSidebarButton}
                    onClick={handleZoomOut}
                    style={{ opacity: scale <= MIN_SCALE ? 0.5 : 1 }}
                >
                    <Image src={Minus} alt="minus" width={14} height={14} />
                </div>
                <div className={styles.divider} />
                <div
                    className={styles.zoomSidebarButton}
                    onClick={() => setDotColor(dotColor === '#777777' ? '#000000' : '#777777')}
                >
                    <Image src={Dot} alt="dot" width={14} height={14} />
                </div>
            </div>
            <div className={styles.zoomScale}>
                {Math.round(scale * 100)}%
            </div>
        </>
    );
};