import React from 'react'

const NotifPanel = ({ notifications = [], isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="absolute top-12 right-0 w-96 bg-white rounded-lg shadow-2xl max-h-96 overflow-auto z-50">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Notifications</h3>
        <button onClick={onClose}>✕</button>
      </div>
      <div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aucune notification
          </div>
        ) : (
          notifications.map((notif, index) => (
            <div key={index} className="p-4 border-b hover:bg-gray-50">
              <p className="font-semibold">{notif.title}</p>
              <p className="text-sm text-gray-600">{notif.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(notif.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotifPanel
