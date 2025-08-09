'use client'

import Sidebar from "./component/Sidebar"
import { Today } from "./component/today/Today"
import { Tomorrow } from "./component/tomorrow/Tomorrow"
import LoadingPage from "../loading-comp/LoadingPage"
import { useState, useEffect } from "react"

export default function Page() {
    const [activeView, setActiveView] = useState('today')
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="flex min-h-screen">
            <Sidebar activeView={activeView} setActiveView={handleViewChange} isLoading={isLoading} setIsLoading={setIsLoading}/>
            {activeView === 'today' ? <Today /> : <Tomorrow />}
        </div>
    )
}