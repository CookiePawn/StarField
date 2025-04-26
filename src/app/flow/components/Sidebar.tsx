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


export const ZoomSidebar: React.FC<{ scale: number, setScale: (scale: number) => void }> = ({ scale, setScale }) => {
    return (
        <div className={styles.zoomSidebar}>
            <div
                className={styles.zoomSidebarButton}
                onClick={() => setScale(scale + 0.1)}
            >
                <Image src={Plus} alt="plus" width={14} height={14} />
            </div>
            <div
                className={styles.zoomSidebarButton}
                onClick={() => setScale(scale - 0.1)}
            >
                <Image src={Minus} alt="minus" width={14} height={14} />
            </div>
            <div
                className={styles.zoomSidebarButton}
                onClick={() => setScale(1)}
            >
                <Image src={Dot} alt="dot" width={14} height={14} />
            </div>
        </div>
    );
};