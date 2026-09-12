import React, { useEffect, useState } from 'react'

interface ActivityLogEntry {
    id: number
    business_id: number
    activity_type: string
    note: string
    created_at: string
}

const SERVER_URL = 'https://canna-hydro-crm.onrender.com/businesses/'

export const useBusinessActivity = (id: number | null) => {
    const [data, setData] = useState<ActivityLogEntry[]>([])
    const [error, setError] = useState<string | null>()
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        if (!id) {
            setData([])
            setError(null)
            setLoading(false)
            return
        }
        async function startFetching() {
            try {
                const response = await fetch(`${SERVER_URL}${id}/activity`)
                if (!response.ok) {
                    throw new Error(`Failed to load business activtiy (Status ${response.status})`)
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
    }, [id])

  return {
    data,
    loading,
    error
  }
}