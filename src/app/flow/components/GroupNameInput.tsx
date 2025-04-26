import { useEffect, useRef, useState } from 'react';
import { Group } from '../type';

interface GroupNameInputProps {
    group: Group;
    scale: number;
    offset: { x: number; y: number };
    onUpdate: (name: string) => void;
    onFinish: () => void;
}

export const GroupNameInput = ({ group, scale, offset, onUpdate, onFinish }: GroupNameInputProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(group.name);
    const MAX_LENGTH = 30;

    useEffect(() => {
        setInputValue(group.name);
        if (inputRef.current) {
            inputRef.current.focus();
            // 커서를 텍스트 끝으로 이동
            inputRef.current.setSelectionRange(
                inputRef.current.value.length,
                inputRef.current.value.length
            );
        }
    }, [group.id]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (inputValue.trim() === '') {
                onUpdate('Group');
            } else {
                onUpdate(inputValue);
            }
            onFinish();
        } else if (e.key === 'Escape') {
            onFinish();
        }
    };

    const handleBlur = () => {
        if (inputValue.trim() === '') {
            onUpdate('Group');
        } else {
            onUpdate(inputValue);
        }
        onFinish();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (newValue.length <= MAX_LENGTH) {
            setInputValue(newValue);
            onUpdate(newValue);
        }
    };

    const inputX = group.centerX * scale + offset.x - 100;
    const inputY = (group.centerY - group.radius - 30) * scale + offset.y;

    return (
        <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            maxLength={MAX_LENGTH}
            style={{
                position: 'absolute',
                left: `${inputX}px`,
                top: `${inputY}px`,
                width: '200px',
                height: '30px',
                backgroundColor: '#222222',
                color: 'white',
                border: '1px solid white',
                padding: '0 10px',
                fontSize: `${14 * scale}px`,
                textAlign: 'center',
                zIndex: 1000,
            }}
            className="group-name-input"
        />
    );
}; 