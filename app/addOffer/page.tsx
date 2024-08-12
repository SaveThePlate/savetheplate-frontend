"use client"
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AddOffer} from '@/components/AddOffer';


const addOffer = () => {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("refresh-token")) {
      router.push("/signIn");
    }
    //remember to verify the token is valid, testing a request: if 404 then token not valid, else vasyyyyyy
  }, []);


  return(
    //this will ensure that no content is hidden under the nav or the footer
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 bg-white min-h-screen w-full">
        <h1 className="text-xl font-semibold text-700"> Publish your offer now!</h1>     
        <AddOffer />

    </main>
  )

};

export default addOffer;
