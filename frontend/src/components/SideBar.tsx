import React from 'react'
import { useSearchParams} from 'react-router-dom'

const CATEGORIES = ['Dispensaries', 'Hydroponics'];
const PIPELINE_STAGES = ['New', 'Contacted', 'Demo Scheduled', 'Customer', 'Lost']

const SideBar = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const handleCheckboxChange = (key: string, value: string) => {
        setSearchParams((prev) => {
            const currentValues = prev.getAll(key);
            prev.delete(key)

            if (currentValues.includes(value)) {
                currentValues
                    .filter((item) => item !== value)
                    .forEach((item) => prev.append(key, item));
            } else {
                [...currentValues, value].forEach((item) => prev.append(key, item))
            }

            return prev;
        })
    }

    const selectedCategories = searchParams.getAll('category')
    const selectedPipeline_Stage = searchParams.getAll('pipeline_stage')

  return (
    <div className="w-64 border-r border-gray-300 p-5">
        <div className="text-xs font-bold text-gray-500">CATEGORY</div>
            <div className="flex flex-col">
            {CATEGORIES.map((category) => (
                <label key={category} className="inline-flex gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        value={category}
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCheckboxChange('category', category)}
                    />
                    {category}
                </label>
            ))}
            </div>
        <div className="text-xs font-bold text-gray-500 pt-5">PIPELINE STAGE</div>
            <div className="flex flex-col">
            {PIPELINE_STAGES.map((pipeline_stage) => (
                <label key={pipeline_stage} className="inline-flex gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        value={pipeline_stage}
                        checked={selectedPipeline_Stage.includes(pipeline_stage)}
                        onChange={() => handleCheckboxChange('pipeline_stage', pipeline_stage)}
                    />
                    {pipeline_stage}
                </label>
            ))}
            </div>
        <div>
            <div className="text-xs font-bold text-gray-500 pt-5">LICENSE STATUS</div>
            <select className="p-1 m-2 border border-gray-400 rounded-[5px] bg-gray-50">
                <option>Active</option>
                <option>Pending</option>
                <option>Expired</option>
            </select>
        </div>
        <div className="flex flex-col">
            <div className="text-xs font-bold text-gray-500 pt-5">DRIVE TIME FROM HOME BASE</div>
                <input type="range" min="5" max="30" className="w-47"/>
                <div className="inline-flex text-sm gap-27 ">
                    <p>5 min</p><p>30 min</p> </div>
        </div>
    </div>
  )
}

export default SideBar