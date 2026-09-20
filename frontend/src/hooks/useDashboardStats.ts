import React, { useState, useEffect } from 'react'
import { STATS_URL } from '@/lib/constants'

interface Stats {
    total_leads: number
    customers_won: number
    unassigned_businesses: number
    active_this_week: number

}

export const useDashboardStats = () => {
    const [data, setData] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>()

    useEffect(() => {

        async function startFetching() {
            setLoading(true)

            try {
                const response = await fetch(STATS_URL)
                if (!response.ok) {
                    throw new Error(`Failed to fetch stats (Status ${response.status})`)
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
