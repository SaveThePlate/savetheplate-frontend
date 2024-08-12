import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CustomCard from '../components/CustomCard';


const Home = () => {

const cardData = [
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image2.jpg',
    imageAlt: 'Item Image 2',
    title: 'Item Title 2',
    description: 'This is a brief description of item 2.',
    detailsLink: '/details2',
    reserveLink: '/reserve2',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  },
  {
    imageSrc: '/path-to-image1',
    imageAlt: 'Item Image 1',
    title: 'Item Title 1',
    description: 'This is a brief description of item 1.',
    detailsLink: '/details1',
    reserveLink: '/reserve1',
    primaryColor: '#8B4513',
  }
  // Add more objects as needed
];
  const primaryColor = "#8B4513"; 

  return (
    <main className="pt-24 sm:pt-32 p-6 bg-white min-h-screen">
    <div className="text-center mb-6">
      <Link href="/map" className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-md shadow">
        Edit Location
      </Link>
    </div>

    <div className="text-center mb-6">
      <h2 className="text-xl font-semibold text-gray-700">Recommended for you</h2>
    </div>

    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
      {cardData.map((card, index) => (
        <CustomCard
          key={index}
          imageSrc={card.imageSrc}
          imageAlt={card.imageAlt}
          title={card.title}
          description={card.description}
          detailsLink={card.detailsLink}
          reserveLink={card.reserveLink}
          primaryColor={card.primaryColor}
        />
      ))}
    </div>
  </main>
);
};

export default Home;
