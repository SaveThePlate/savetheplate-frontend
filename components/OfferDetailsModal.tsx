import React from "react";

interface OfferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
}

const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  expirationDate,
  pickupLocation,
}) => {
  if (!isOpen) return null;

  const date = new Date(expirationDate);
  
  const formattedDate = date.toLocaleDateString(); 
  const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="mb-2">{description}</p>
        <p className="mb-2"><strong>Expiration Date:</strong> {formattedDate}</p>
        <p className="mb-4"><strong>Expiration Time:</strong> {formattedTime}</p>
        <p className="mb-4"><strong>Pickup Location:</strong> {pickupLocation}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default OfferDetailsModal;
