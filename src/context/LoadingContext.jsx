import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    // const [minTimeElapsed, setMinTimeElapsed] = useState(false); // Refactored for smarter logic
    const location = useLocation();

    // Refs to manage timers without re-renders
    const startTimerRef = useRef(null);
    const minDisplayTimerRef = useRef(null);
    const startTimeRef = useRef(null);

    const showLoader = (immediate = false) => {
        // Clear any pending clear timers
        if (minDisplayTimerRef.current) clearTimeout(minDisplayTimerRef.current);

        if (immediate) {
            setIsLoading(true);
            startTimeRef.current = Date.now();
        } else {
            // Smart Delay: Only show if request takes > 500ms
            if (!startTimerRef.current && !isLoading) {
                startTimerRef.current = setTimeout(() => {
                    setIsLoading(true);
                    startTimeRef.current = Date.now();
                }, 500);
            }
        }
    };

    const hideLoader = () => {
        // 1. Cancel the start timer if it hasn't fired yet (Action was < 500ms)
        if (startTimerRef.current) {
            clearTimeout(startTimerRef.current);
            startTimerRef.current = null;
        }

        // 2. If loader is currently visible, ensure minimum display time (800ms)
        if (isLoading && startTimeRef.current) {
            const elapsed = Date.now() - startTimeRef.current;
            const MIN_DISPLAY_TIME = 800; // "Mini Loading" duration

            if (elapsed < MIN_DISPLAY_TIME) {
                const remaining = MIN_DISPLAY_TIME - elapsed;
                minDisplayTimerRef.current = setTimeout(() => {
                    setIsLoading(false);
                    startTimeRef.current = null;
                }, remaining);
            } else {
                setIsLoading(false);
                startTimeRef.current = null;
            }
        }
    };

    // Auto-hide loader on Route Configuration (Instant navigation feels better)
    // But we might want "Mini Loading" for page switches?
    // User said: "Page switch -> mini loading".
    // So distinct logic for routes? Use 'immediate' for output.
    useEffect(() => {
        // When location changes, force a quick show then hide? 
        // Or just trust the component loading logic?
        // Let's reset smart timers.
        hideLoader();
    }, [location]);

    // Event Listener Bridge with Smart Logic
    useEffect(() => {
        const handleStart = (e) => showLoader(e.detail?.immediate);
        const handleEnd = () => hideLoader();

        window.addEventListener('sbh-loading-start', handleStart);
        window.addEventListener('sbh-loading-end', handleEnd);

        return () => {
            window.removeEventListener('sbh-loading-start', handleStart);
            window.removeEventListener('sbh-loading-end', handleEnd);
        };
    }, [isLoading]);

    return (
        <LoadingContext.Provider value={{ isLoading, showLoader, hideLoader }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
