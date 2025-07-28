'use client'

import Sidebar from "./component/Sidebar"
import { Today } from "./component/Today"
import { Tomorrow } from "./component/Tomorrow"
import { useState } from "react"

export default function Page () {
    const [activeView, setActiveView] = useState('today')
    return (
        <div className="flex min-h-screen">
            <Sidebar activeView={activeView} setActiveView={setActiveView}/>
            {activeView === 'today' ? <Today /> : <Tomorrow />}
        </div>
    )
}