"use client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AddOffer} from '@/components/AddOffer';
import axios from "axios";


const Main: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
      title: '',
      description: '',
      expirationDate: '',
      pickupLocation: '',
      images: [], 
  });

  const [error, setError] = useState('');

  useEffect(() => {
      const token = localStorage.getItem("refresh-token");
      if (!token) {
          router.push("/signIn");
          return;
      }

      const verifyToken = async () => {
          try {
              await axios.get('/api/verify-token', {
                  headers: { Authorization: `Bearer ${token}` },
              });
          } catch (error) {
              console.error('Token verification failed:', error);
              router.push("/signIn");
          }
      };

      verifyToken();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
          const response = await axios.post('/api/add-offer', formData);
          console.log('Offer added successfully:', response.data);
          router.push('/offers'); 
      } catch (error) {
          console.error('Error adding offer:', error);
          setError('Failed to add offer. Please try again.');
      }
  };

  return(
    //this will ensure that no content is hidden under the nav or the footer
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 bg-white min-h-screen w-full">
        <h1 className="text-xl font-semibold text-700"> Publish your offer now!</h1>     
        <AddOffer />

    </main>
  )

};

export default Main;