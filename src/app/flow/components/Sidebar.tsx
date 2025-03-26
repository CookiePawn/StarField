import React from 'react';
import styles from '../styles/sidebar.module.css';

export const EditorSidebar: React.FC = () => {
    return (
        <div className={styles.editorSidebar}>
            {Array.from({ length: 10 }).map((_, index) => (
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
                <p>+</p>
            </div>
            <div
                className={styles.zoomSidebarButton}
                onClick={() => setScale(scale - 0.1)}
            >
                <p>-</p>
            </div>
        </div>
    );
};