import React, {useEffect, useState} from 'react'
import { SOURCE_SYNC_URL } from '@/lib/constants'

interface sourceSync {
    source: string
    latest_pulled_at: string
}

export const useDataSourceSync = () => {
    const [data, setData] = useState<sourceSync[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>()

    useEffect(() => {
        
    async function startFetching() {
        setLoading(true)

        try {
            const response = await fetch(SOURCE_SYNC_URL)
            if (!response.ok) {
                throw new Error(`Failed to fetch sources sync (Status ${response.status})`)
            }
            const json = await response.json()
            setData(json)
        
        } catch (err) {
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

