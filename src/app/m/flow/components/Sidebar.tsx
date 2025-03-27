import React from 'react';
import styles from '../styles/m_sidebar.module.css';

export const ZoomSidebar = ({ scale, setScale }: { scale: number, setScale: (scale: number) => void }) => {
    return (
        <div className={styles.zoomSidebar}>
            <div 
                className={styles.zoomSidebarButton}
                onClick={() => setScale(Math.min(2, scale + 0.1))}>
                <p>+</p>
            </div>
            <div 
                className={styles.zoomSidebarButton}
                onClick={() => setScale(Math.max(0.5, scale - 0.1))}>
                <p>-</p>
            </div>
        </div>
    )
};
