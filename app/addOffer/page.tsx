"use client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddOffer} from '@/components/AddOffer';
import axios from "axios";


const Main: React.FC = () => {
  const router = useRouter();
  // const [formData, setFormData] = useState({
  //     title: '',
  //     description: '',
  //     expirationDate: '',
  //     pickupLocation: '',
  //     images: [], 
  // });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No token found, redirecting to signIn");
      router.push("/signIn");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get('http://localhost:3001/auth/get-user-by-token', {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Token verification successful:', response.data);

        if (!response.data || response.status !== 200) {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        router.push("/signIn");
      }
    };

    verifyToken();
  }, [router]);


  return(
    //this will ensure that no content is hidden under the nav or the footer
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 bg-white min-h-screen w-full">
        <h1 className="text-xl font-semibold text-700"> Publish your offer now!</h1>     

        <AddOffer />

        

    </main>
  )

};

export default Main;