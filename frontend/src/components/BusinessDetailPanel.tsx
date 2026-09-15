import { useBusinessDetail } from '@/hooks/useBusinessDetail'
import { Ring } from '@/components/loading-ui/ring'
import { useBusinessActivity } from '@/hooks/useBusinessActivity'
import { Spinner } from "@/components/ui/spinner"
import { useUsers } from '@/hooks/useUsers'
import { useState } from 'react'
import { PIPELINE_STAGES, SERVER_URL } from '@/lib/constants'

const BusinessDetailPanel = ({ id }: { id: number }) => {
    const { data, loading, error, setData } = useBusinessDetail(id)
    const { data: activity, loading: activityLoading, error: activityError, setData : setActivity } = useBusinessActivity(id)
    const { data: users, loading: usersLoading, error: usersError} = useUsers()
    const [ repChangeError, setRepChangeError ] = useState<string | null>()
    const [ stageChangeError, setStageChangeError] = useState<string | null>()
    const [ inputText, setInputText ] = useState('')
    const [ noteChangeError, setNoteChangeError] = useState<string | null>()

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

    async function handleRepChange (rep_id : number) {
        if(!data) {
            return
        }
        
        try {
            const response = await fetch(`${SERVER_URL}${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ 
                    name: data.name,
                    address: data.address,
                    category: data.category,
                    stage: data.stage,
                    assigned_rep: rep_id
                })
            })
            if (!response.ok) {
                throw new Error(`Failed to update user (Status ${response.status})`)
            }
            const json = await response.json()
            setData({...json, sources: data.sources})
        } catch (err) {
            setRepChangeError(err instanceof Error ? err.message : String(err))
        }
    }

    async function handleStageChange (pipeline : string) {
        if (!data) {
            return
        }
        try {
            const response = await fetch(`${SERVER_URL}${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: data.name,
                    address: data.address,
                    category: data.category,
                    stage: pipeline,
                    assigned_rep: data.assigned_rep
                })
            })
            if(!response.ok) {
                throw new Error( `Failed to update pipeline stage (Status ${response.status})`)
            }
            const json = await response.json()
            setData({...json, sources: data.sources})
        } catch (err) {
            setStageChangeError(err instanceof Error ? err.message : String(err))
        }
    }

    async function handleAddNote () {
        if (!inputText) {
            setNoteChangeError("fields cannot be empty")
            return;
        }
        try {
            const response = await fetch(`${SERVER_URL}${id}/activity`, {
                method: 'POST',
                headers: {'Content-Type' : 'application/json'},
                body: JSON.stringify({
                    note: inputText
                })
            })
            if(!response.ok) {
                throw new Error(`Failed to post new note (Status ${response.status})`)
            }
            const json = await response.json()
            setActivity([json, ...activity])
            setInputText('')
        } catch (err) {
            setNoteChangeError(err instanceof Error ? err.message : String(err))
        }
    }
    
  return (
    <div>
        <div className="font-bold text-xl">{data.name}</div>
        <div className="text-sm text-gray-500 pb-3">{data.address}</div>
        <div className="pb-3 flex gap-2"><div className="text-gray-500 rounded-full border border-gray-300 inline-flex items-center px-2">{data.category}</div><div className="inline-flex items-center px-2 text-gray-500 rounded-full border border-gray-300">License:{data.license_status}</div></div>
        <div className="text-gray-500 flex flex-col gap-1"> Pipeline Stage:
        {stageChangeError && <div>Something went wrong{stageChangeError}</div>}
            <select
                className="p-1 mb-2 border border-gray-400 rounded-[5px] bg-gray-50"
                onChange={(e) => handleStageChange(e.target.value)}
                value={data.stage}
            >
                {PIPELINE_STAGES.map((pipeline) => (
                    <option value={pipeline} key={pipeline}>{pipeline}</option>
                ))}
            </select>
        </div>
        {/* <div className=" text-gray-500">Rep: {data.assigned_rep || 'Unassigned'}</div> */}
        <div className="text-gray-500 mt-2">Assigned Rep:
        
        {usersLoading && <Spinner/>}
        {usersError && <div>Something went wrong: {usersError}</div>}
        {repChangeError && <div>Something went wrong:{repChangeError}</div>}
        {!usersLoading && !usersError && (
            <div className="flex flex-col gap-1">
            <select 
                className="p-1 mb-2 border border-gray-400 rounded-[5px] bg-gray-50"
                onChange={(e) => handleRepChange(Number(e.target.value))}
                value={data.assigned_rep ?? undefined}
                >
                {users.map((user) => (
                <option value ={user.id} key={user.id}>{user.name} - {user.role}</option>
                ))}      
            </select>
            </div>
        )}
        </div>

        <div className="font-bold text-green-600">Source: {data.sources} </div>
        <div className="text-gray-500 mb-3 mt-1">Note: 
            {noteChangeError && <div>Something went wrong: {noteChangeError}</div>}
            <form onSubmit={(e) => {e.preventDefault(); handleAddNote()}}>
                <input
                    type="text"
                    placeholder="memo here"
                    className="w-full p-2 border border-gray-300 rounded-[5px] bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mt-2 mb-2"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    />
                <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white text-sm rounded-[5px] hover:bg-purple-700 transition-colors"
                >
                    Add
                </button>
            </form>
        </div>

        {activityLoading &&  <Spinner/>}
        {activityError && <div>Something went wrong: {activityError}</div>}
        {!activityLoading && !activityError && (
            <div>{activity.map((details) => (
                <div className="m-2 p-1 border-b border-gray-300 text-gray-500" key={details.id}>{details.note} — {new Date(details.created_at).toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric', hour:'numeric', minute: 'numeric'})}</div>
            ))}</div>
        )}
    </div>
  )
}

export default BusinessDetailPanel