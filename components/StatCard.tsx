import type React from "react"
import Icon from "./Icon"

interface StatCardProps {
  label: string
  value: number
  color: string
  iconPath: string
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, iconPath }) => {
  return (
    <div className={`bg-gray-800 p-4 rounded-lg flex items-center space-x-4 border-l-4 ${color}`}>
      <div className="p-2 bg-gray-700 rounded-full">
        <Icon path={iconPath} className="w-6 h-6 text-gray-300" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

export default StatCard
