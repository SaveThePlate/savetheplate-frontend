'use client';
import React from 'react';
import CustomCard from '@/components/CustomCard';

const ProfilePage = () => {
 
  const offers = [
    {
      id: 1,
      imageSrc: '/path/to/image1.jpg',
      imageAlt: 'Offer 1',
      title: 'Offer 1',
      description: 'This is a description of Offer 1.',
      expirationDate: '2024-08-30T23:59:59Z',
      expirationTime: '23:59',
      pickupLocation: '123 Main St',
      detailsLink: '#',
      reserveLink: '#',
      primaryColor: '#FFD700',
      onDetailsClick: () => {
        console.log('Details clicked for Offer 1');
      }
    },  {
        id: 1,
        imageSrc: '/path/to/image1.jpg',
        imageAlt: 'Offer 1',
        title: 'Offer 1',
        description: 'This is a description of Offer 1.',
        expirationDate: '2024-08-30T23:59:59Z',
        expirationTime: '23:59',
        pickupLocation: '123 Main St',
        detailsLink: '#',
        reserveLink: '#',
        primaryColor: '#FFD700',
        onDetailsClick: () => {
          console.log('Details clicked for Offer 1');
        }
      }





   
  ];

  return (
    <main className="pt-24 sm:pt-32 px-4 sm:px-8 bg-white min-h-screen">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
            <div className="text-center">
              <h1 className="text-xl font-semibold">Business name</h1>
              <p className="text-gray-500">Location</p>
              <p className="text-gray-500">Phone number</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center mb-8">
          <button className="bg-yellow-200 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded">
            Edit Profile
          </button>
        </div>
        <hr className="border-gray-300 mb-8" />
        <h2 className="text-lg font-semibold mb-4">My Offers</h2>
        <div className="space-y-4">
          {offers.map((offer) => (
            <CustomCard
              key={offer.id}
              imageSrc={offer.imageSrc}
              imageAlt={offer.imageAlt}
              title={offer.title}
              description={offer.description}
              expirationDate={offer.expirationDate}
            
              pickupLocation={offer.pickupLocation}
              
              reserveLink={offer.reserveLink}
              primaryColor={offer.primaryColor}
              onDetailsClick={offer.onDetailsClick}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
