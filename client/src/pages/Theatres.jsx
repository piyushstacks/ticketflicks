import React from 'react'
import { dummyTheatersData } from '../assets/assets'
import { MapPin } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'

const Theatres = () => {
  return (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0" />
      <BlurCircle bottom="110px" right="100px" />

      <h1 className="font-medium text-3xl my-8 text-white">Our Theatres</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {dummyTheatersData.map((theater) => (
          <div 
            key={theater.id} 
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                {theater.name}
              </h2>
            </div>
            
            <div className="flex items-start gap-3 text-gray-300">
              <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1">{theater.location}</p>
                <span className="text-sm text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                  {theater.distance} away
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Theatres
