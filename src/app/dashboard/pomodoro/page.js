'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { getTodayTasks, getTomorrowTasks } from '../../api/note-api'
import { useAuth } from '../../api/auth'
import LoadingPage from '@/app/loading-comp/LoadingPage'

// Disable SSR for the timer to avoid hydration mismatches from client-only state (localStorage, window)
const PomodoroTimer = dynamic(() => import('./Pomodoro'), { ssr: false })

export default function Page() {
  const [tasks, setTasks] = useState([])
  const [dataLoading, setDataLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()
  
  useEffect(() => {
    const fetchTasks = async () => {
      if (authLoading) return; // Wait for auth to resolve to avoid double loading
      if (!user) {
        setTasks([])
        setDataLoading(false)
        return
      }

      try {
        setDataLoading(true)
        const todayTasks = await getTodayTasks(user.uid)
        const tomorrowTasks = await getTomorrowTasks(user.uid)

        // Combine tasks from today and tomorrow
        const allTasks = [...(todayTasks || []), ...(tomorrowTasks || [])]
        setTasks(allTasks)
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchTasks()
  }, [user, authLoading])
  
  
  const showLoading = authLoading || dataLoading
  return (
  showLoading ? <LoadingPage /> : (
  <div className="p-5 md:p-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-[#A23E48]">Focus Time</h1>
      <PomodoroTimer tasks={tasks} isLoading={showLoading} />
    </div>
  )
  )
}