"use client"
import { useRouter } from "next/navigation";
import { useEffect } from "react";


const addOffer = () => {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("refresh-token")) {
      router.push("/signIn");
    }
    //remember to verify the token is valid, testing a request: if 404 then token not valid, else vasyyyyyy
  }, []);


  return(
    <main className="pt-24 sm:pt-32 p-6 bg-white min-h-screen"> 
        toto
    </main>
  )

};

export default addOffer;
