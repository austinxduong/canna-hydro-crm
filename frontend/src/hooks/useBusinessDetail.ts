import { useState, useEffect } from "react";
import type { Business } from '@/hooks/useFilteredBusinesses'

interface BusinessDetail extends Business {
    sources: string | null
}

const SERVER_URL = 'https://canna-hydro-crm.onrender.com/businesses/'

export function useBusinessDetail(id: number | null) {
    const [data, setData] = useState<BusinessDetail | null>()
    const [error, setError] = useState<string | null>()
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setData(null)
            setError(null)
            setLoading(false)
            return;
        }
        async function startFetching() {
            setLoading(true)

            try {
                const response = await fetch(`${SERVER_URL}${id}`)
                if (!response.ok) {
                    throw new Error(`Failed to load business details (Status ${response.status})`)
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
        error,
        setData,
    }
}