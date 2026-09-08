import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface Business {
    id: number
    name: string
    address: string
    phone: string | null
    category: string
    license_status: string
    license_number: string
    stage: string
    assigned_rep: string | null
    last_activity_at: string | null
    lat: number | null
    lng: number | null
}

const SERVER_URL = 'https://canna-hydro-crm.onrender.com/businesses'

export function useFilteredBusinesses() {
    const [data, setData] = useState<Business[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [searchParams] = useSearchParams();

    const selectedCategories = searchParams.getAll('category');
    const selectedPipelineStages = searchParams.getAll('pipeline_stage');
    const selectedStatus = searchParams.get('status')

    useEffect(() => {
        async function startFetching() {
            try {
                const response = await fetch(SERVER_URL);
                const json = await response.json();
                setData(json)
            } catch (err) {
                setError(err instanceof Error ? err.message : String(err))
            } finally {
                setLoading(false)
            }
        }
        startFetching()
    }, [])

    const filteredData = data.filter((business) => {
        const categoryMatches =
            selectedCategories.length === 0 ||
            selectedCategories.includes(business.category);

        const pipelineStageMatches =
            selectedPipelineStages.length === 0 ||
            selectedPipelineStages.includes(business.stage);

        const statusMatches =
            !selectedStatus ||
            selectedStatus === 'ALL' ||
            business.license_status === selectedStatus;

        return (
            categoryMatches &&
            pipelineStageMatches &&
            statusMatches
        );
    });

    return { 
        data: filteredData, 
        loading, 
        error,
    }
}