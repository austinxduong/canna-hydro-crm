import React, {useState, useEffect} from 'react'
import { ACTIVITY_FEED_URL } from '@/lib/constants'

interface ActivityFeed {
    name: string
    activity_type: string
    note: string
    created_at: string
}

export const useActivityFeed = () => {
    const [data, setData] = useState<ActivityFeed[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>()

    useEffect(() => {

    async function startFetching() {
        setLoading(true)

        try {
            const response = await fetch(ACTIVITY_FEED_URL)
            if (!response.ok) {
                throw new Error(`Failed to fetch activity feed (Status ${response.status})`)
            }
            const json = await response.json()
            setData(json)

        } catch (err){
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }
    startFetching()
    }, [])

  return {
    data,
    loading,
    error
  }
}

