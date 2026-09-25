import React, { useState} from 'react'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useActivityFeed } from '@/hooks/useActivityFeed'
import { Spinner } from "@/components/ui/spinner"
import StatsCard from './StatsCard'
import { timeAgo } from '@/lib/formatters'
import { useNavigate } from 'react-router-dom'
import { useDataSourceSync } from '@/hooks/useDataSourceSync'
import { SOURCE_LABELS } from '@/lib/constants'
import { CATEGORIES } from '@/lib/constants'
import { SERVER_URL } from '@/lib/constants'

interface LeadFormFields {
  name: string
  address: string
  category: string
}

const Dashboard = () => {
  const {data, loading, error, refetch} = useDashboardStats()
  const {data : activity, loading : activityLoading, error : activityError} = useActivityFeed()
  const {data: sourceSync, loading: sourceSyncLoading, error : sourceSyncError} = useDataSourceSync()
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<LeadFormFields>({name: '', address: '', category: ''})
  const [formError, setFormError] = useState<string | null>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitForm () {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          category: formData.category
        })
      })
      if (!response.ok) {
        throw new Error(`Failed to post new lead (Status ${response.status})`)
      }
      setFormData({name: '', address: '', category: ''})
      setIsModalOpen(false)
      refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSubmitting(false)
    }
  }

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
        {isModalOpen && (<>{formError && <div>Something went wrong: {formError} </div>}<div>Modal <input value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value }))}></input><input value={formData.address} onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}></input><select value={formData.category} onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}><option value="">Select a category</option>{CATEGORIES.map((categories) => (<option key={categories}>{categories}</option>))}</select> <button onClick={() => (setIsModalOpen(false))}>close</button><button onClick={() => (submitForm())} disabled={isSubmitting}>Submit</button></div> </>)}
        <button className="border font-bold bg-gray-100 text-gray-500 border-gray-300 rounded p-3 hover:text-white hover:bg-purple-700 mr-3" onClick={() => {setIsModalOpen(true); setFormError(null)}}> + Add Lead</button>
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
          <div className="border border-gray-300 space-y-1 m-3 p-3 rounded">
            {sourceSyncLoading && <div><Spinner/></div>}
            {sourceSyncError && <div>Something went wrong: {sourceSyncError}</div>}
            {sourceSync.map((source) => (
              <div key={source.source}>
                <div className="border-b border-gray-300 pb-2 pt-2"><p className="font-bold">{SOURCE_LABELS[source.source] ||source.source}</p><p>Latest pull: {new Date(source.latest_pulled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year:'numeric', hour: 'numeric', minute: '2-digit', hour12: true})}</p></div>
              </div>
            ))}
          </div>
        </div>

        </div>
      </div>
  
  )
}

export default Dashboard