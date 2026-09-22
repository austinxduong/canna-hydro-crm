import React from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { Spinner } from "@/components/ui/spinner"
import StatsCard from './StatsCard'
import { timeAgo } from '@/lib/formatters'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const {data, loading, error} = useDashboardStats()
  const {data : activity, loading : activityLoading, error : activityError} = useActivityFeed()
  const navigate = useNavigate();


  return (
    <div>
    <div className="font-bold p-3 text-gray-500">OVERVIEW</div>
    {error ? (<div>Something went wrong: {error}</div>) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-3">
        <StatsCard
          title="Total Leads"
          value={data?.total_leads}
          loading={loading}
        />
          <StatsCard
          title="Customers Won"
          value={data?.customers_won}
          loading={loading}
        />
          <StatsCard
          title="Unassigned Businesses"
          value={data?.unassigned_businesses}
          loading={loading}
        />
        <StatsCard
          title="Active this week"
          value={data?.active_this_week}
          loading={loading}
        />
      </div>
    )}

      <div className="p-3">
        <button className="border font-bold bg-gray-100 text-gray-500 border-gray-300 rounded p-3 hover:text-white hover:bg-purple-700 mr-3"> + Add Lead</button>
        <button className="border font-bold bg-gray-100 text-gray-500 border-gray-300 rounded p-3 hover:text-white hover:bg-purple-700 " onClick={() => navigate("/map")}> View Map</button>
      </div>
      <div className="grid lg:grid-cols-2">

        <div>
        <div className="font-bold p-3 text-gray-500 ">RECENT ACTIVITY</div>
          <div className="border border-gray-300 space-y-1 m-3 p-3 rounded">
            {activityLoading && <div><Spinner/></div>}
            {activityError && <div>Something went wrong:{activityError}</div>}
            {activity.map((activities) => (
              <div key={activities.id}>
              <div className="flex flex-row pt-2"><div className="font-bold">{activities.name} :</div><div className="pl-1">{activities.note}</div><div className="pl-1"></div></div>
              <div className="border-b border-gray-300 pb-2">{activities.created_at ? timeAgo(activities.created_at) : "No Activity"}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
        <div className="font-bold p-3 text-gray-500 ">DATA SOURCE SYNC</div>
          <div className="border border-gray-300 space-y-1 m-3 p-3 rounded"> <p>Oregon Registry</p>Washington Registry<p>ESRI ARCGIS</p><p></p></div>
        </div>
        
      </div>
    </div>
  )
}

export default Dashboard