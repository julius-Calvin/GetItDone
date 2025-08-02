'use client'

import Sidebar from "./component/Sidebar"
import { Today } from "./component/today/Today"
import { useState } from "react"

export default function Page() {
    const [activeView, setActiveView] = useState('today')
    
    return (
        <div className="flex min-h-screen">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            {activeView === 'today' ? <Today /> : <p>Tomorrow</p>}
        </div>
    )
}