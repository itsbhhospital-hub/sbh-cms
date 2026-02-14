import React, { Suspense } from 'react';
import { LayoutProvider } from '../context/LayoutContext';
import GlobalLoader from '../components/GlobalLoader';
import AssetsSidebar from '../components/AssetsSidebar';
import AssetsNavbar from '../components/AssetsNavbar';
import Footer from '../components/Footer';

const AssetsLayout = ({ children }) => {
    return (
        <LayoutProvider>
            <div className="min-h-screen flex relative bg-slate-50">
                <AssetsSidebar />
                <main className="flex-1 ml-0 transition-all flex flex-col min-h-screen w-full relative">
                    <AssetsNavbar />
                    <div className="flex-grow p-4 md:p-8 w-full max-w-full overflow-x-hidden pb-20 md:pb-24">
                        <Suspense fallback={<GlobalLoader />}>
                            {children}
                        </Suspense>
                    </div>
                    <Footer />
                </main>
            </div>
        </LayoutProvider>
    );
};

export default AssetsLayout;
