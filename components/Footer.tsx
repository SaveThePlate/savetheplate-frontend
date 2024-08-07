import React from 'react'
import Image from 'next/image'

const Footer = () => {
  return (
    <div className="flex justify-around items-center bg-white shadow-md fixed bottom-0 w-full h-16 border-t border-gray-200">
    <div className="flex flex-col items-center">
      <Image src="/accueil.png" alt="Home" height={24} width={24} />
    </div>
    
      <div className="flex flex-col items-center">
        <Image src="/panier.png" alt="Orders" height={24} width={24} />
    
      </div>
    
    <div className="flex flex-col items-center">
      <Image src="/profil.png" alt="Profile" height={24} width={24} />
    </div>
  </div>

  )

}

export default Footer