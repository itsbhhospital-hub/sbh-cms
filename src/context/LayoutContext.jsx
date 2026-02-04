import React, { createContext, useState, useContext } from 'react';

const LayoutContext = createContext();

export const LayoutProvider = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <LayoutContext.Provider value={{ mobileOpen, setMobileOpen }}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = () => useContext(LayoutContext);
