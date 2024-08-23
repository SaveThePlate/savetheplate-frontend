import { FC } from "react";

interface OfferDetailsModalProps {
  isOpen: boolean; // Prop to control if the modal is open
  offer: {
    id: number;
    imageSrc: string;
    imageAlt: string;
    title: string;
    description: string;
    expirationDate: string;
    expirationTime: string;
    pickupLocation: string;
    detailsLink: string;
    reserveLink: string;
    primaryColor: string;
  };
  onClose: () => void; // Prop to handle closing the modal
}

const OfferDetailsModal: FC<OfferDetailsModalProps> = ({ isOpen, offer, onClose }) => {
  if (!isOpen) return null; // Don't render the modal if it's not open

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4">{offer.title}</h2>
        <p className="mb-4">{offer.description}</p>
        <p className="mb-4">
          Expires on: {new Date(offer.expirationDate).toLocaleDateString()} at {new Date(offer.expirationTime).toLocaleTimeString()}
        </p>
        <p className="mb-4">Pickup Location: {offer.pickupLocation}</p>
        <button
          onClick={onClose} // Attach the onClose handler to the Close button
          className="bg-red-500 text-white px-4 py-2 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default OfferDetailsModal;
