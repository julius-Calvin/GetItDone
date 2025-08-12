'use client'

import Sidebar from "./component/Sidebar"
import { RxHamburgerMenu, RxCross2 } from 'react-icons/rx';
import { Today } from "./component/today/Today"
import { Tomorrow } from "./component/tomorrow/Tomorrow"
import LoadingPage from "../loading-comp/LoadingPage"
import { useState, useEffect } from "react"

export default function Page() {
    const [activeView, setActiveView] = useState('today')
    const [isLoading, setIsLoading] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        const savedView = localStorage.getItem('activeView')
        if (savedView) {
            setActiveView(savedView)
        }
    }, [])

    // Update localStorage when activeView changes
    const handleViewChange = (view) => {
        setActiveView(view)
        localStorage.setItem('activeView', view)
    }

    if (isLoading) {
        return <LoadingPage />
    }
        return (
                <div className="flex min-h-screen w-full relative overflow-x-hidden">
                        {/* Mobile top bar */}
                                                <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b px-4 h-14">
                                                                <button
                                                                    type="button"
                                                                    aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
                                                                    onClick={() => setMobileNavOpen(o => !o)}
                                                                    className="p-2 rounded-md bg-[#A23E48] text-white focus:outline-none active:scale-95 transition flex items-center justify-center shadow"
                                                                >
                                                                        {mobileNavOpen ? (
                                                                            <RxCross2 className="w-5 h-5" />
                                                                        ) : (
                                                                            <RxHamburgerMenu className="w-5 h-5" />
                                                                        )}
                                                                </button>
                                <h1 className="font-bold text-[#A23E48]">Get It Done</h1>
                                <div className="w-10" />
                        </div>
                        {/* Sidebar overlay for mobile */}
                        <div className={`md:static fixed inset-y-0 left-0 z-50 transform md:transform-none transition-transform duration-300 ease-in-out ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                                <Sidebar 
                                    activeView={activeView} 
                                    setActiveView={(v) => { handleViewChange(v); setMobileNavOpen(false); }} 
                                    isLoading={isLoading} 
                                    setIsLoading={setIsLoading}
                                    mobile
                                />
                        </div>
                        {/* Backdrop when sidebar open on mobile */}
                        {mobileNavOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileNavOpen(false)} />}
                        {/* Main content (add top padding for mobile bar) */}
                        <div className="flex-1 flex flex-col w-full md:pl-0 pt-14 md:pt-0"> 
                            {activeView === 'today' ? <Today /> : <Tomorrow />}
                        </div>
                </div>
        )
}