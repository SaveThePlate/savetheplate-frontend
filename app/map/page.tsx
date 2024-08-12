import { Map } from '@/components/Map'

const map = () => {


    return (
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 bg-white min-h-screen w-full">
    <h1 className="text-xl font-semibold text-700"> View all the available offers around you!</h1>      
        <Map />
    </main>

    );


}

export default map;