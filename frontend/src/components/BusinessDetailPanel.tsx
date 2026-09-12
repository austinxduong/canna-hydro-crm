import { useBusinessDetail } from '@/hooks/useBusinessDetail'
import { Ring } from '@/components/loading-ui/ring'
import { useBusinessActivity } from '@/hooks/useBusinessActivity'
import { Spinner } from "@/components/ui/spinner"

const BusinessDetailPanel = ({ id }: { id: number }) => {
    const { data, loading, error } = useBusinessDetail(id)
    const { data: activity, loading: activityLoading, error: activityError} = useBusinessActivity(id)

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

        {activityLoading &&  <Spinner/>}
        {activityError && <div>Something went wrong: {activityError}</div>}
        {!activityLoading && !activityError && (
            <div>{activity.map((details) => (
                <div key={details.id}>Note: {details.note} {details.created_at}</div>
            ))}</div>
        )}
    </div>
  )
}

export default BusinessDetailPanel