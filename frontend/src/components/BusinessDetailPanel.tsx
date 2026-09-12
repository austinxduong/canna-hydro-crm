import { useBusinessDetail } from '@/hooks/useBusinessDetail'
import { Ring } from '@/components/loading-ui/ring'

const BusinessDetailPanel = ({ id }: { id: number }) => {
    const { data, loading, error } = useBusinessDetail(id)

    if (loading) {
        return (
        <div
            className="flex justify-center"
            role="status"
            aria-label="Loading business details"
        >
            <Ring className="size-16 text-[#00d56e] justify-center"/>
        </div>
        )
    }

    if (error) {
        return <div>Something went wrong {error}</div>
    }

    if (!data) {
        return null;
    }

  return (
    <div>
        {data.name}
        <div>{data.address}</div>
        <div>{data.category} License:{data.license_status}</div>
        <div>{data.stage}</div>
        <div>Rep: {data.assigned_rep || 'Unassigned'}</div>
        <div>Source: {data.sources} </div>
    </div>
  )
}

export default BusinessDetailPanel