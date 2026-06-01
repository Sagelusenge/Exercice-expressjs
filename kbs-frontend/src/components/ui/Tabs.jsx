import React, { useState } from 'react'

const Tabs = ({ tabs = [], defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`
              px-4 py-2 font-semibold
              ${
                activeTab === index
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{tabs[activeTab]?.content}</div>
    </div>
  )
}

export default Tabs
