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
        <div className="font-bold text-xl">{data.name}</div>
        <div className="text-sm text-gray-500 pb-3">{data.address}</div>
        <div className="pb-3 flex gap-2"><div className="text-gray-500 rounded-full border border-gray-300 inline-flex items-center px-2">{data.category}</div><div className="inline-flex items-center px-2 text-gray-500 rounded-full border border-gray-300">License:{data.license_status}</div></div>
        <div className=" text-gray-500">Pipeline Stage: {data.stage}</div>
        <div className=" text-gray-500">Rep: {data.assigned_rep || 'Unassigned'}</div>
        <div className="font-bold text-green-600">Source: {data.sources} </div>

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