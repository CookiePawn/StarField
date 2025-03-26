import React from 'react';
import styles from '../styles/header.module.css';

export const Header: React.FC = () => {
    return (
        <div className={styles.header}>
            <p>File</p>
            <p>Edit</p>
            <p>View</p>
            <p>Help</p>
        </div>
    );
};
