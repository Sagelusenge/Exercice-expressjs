import React from 'react'

const ParcelleGallery = ({ images = [] }) => {
  const [selectedImage, setSelectedImage] = React.useState(0)

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
        <img
          src={images[selectedImage] || 'https://via.placeholder.com/800x600'}
          alt="Parcelle"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`aspect-square rounded-lg overflow-hidden border-2 ${
              selectedImage === index ? 'border-blue-600' : 'border-gray-300'
            }`}
          >
            <img
              src={image}
              alt={`Parcelle ${index}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ParcelleGallery
