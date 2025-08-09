
// src/hooks/use-debounce.ts
import { useEffect, useCallback, useRef } from 'react';

export function useDebounce(callback: () => void, delay: number) {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callbackRef.current();
        }, delay);
    }, [delay]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}
