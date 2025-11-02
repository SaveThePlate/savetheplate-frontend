"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Offer {
  id: number;
  title: string;
  images: { path: string }[];
  expirationDate: string;
  pickupLocation: string;
  quantity: number;
  description?: string;
  price?: number;
}

const DEFAULT_PROFILE_IMAGE = "/logo.png";
const BASE_IMAGE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "") + "/storage/";

const resolveImage = (filename: string | null | undefined): string | undefined => {
  if (!filename) return undefined;
  if (/^https?:\/\//i.test(filename)) return filename;
  if (filename.startsWith("/storage/")) {
    const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
    return origin + filename;
  }
  if (filename.startsWith("/")) return filename; // public asset
  return `/${filename}`; // bare filename -> assume public asset
};

export default function ProviderProfile() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    location: "",
    phoneNumber: "",
    profileImage: undefined,

  });
  // keep a string in state so next/image never receives `undefined`
  const [currentProfileImage, setCurrentProfileImage] = useState<string>(DEFAULT_PROFILE_IMAGE);
  const [triedBackendForProfile, setTriedBackendForProfile] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // profile modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // offer edit modal
  const [isOfferEditModalOpen, setIsOfferEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    expirationDate: "",
  });

useEffect(() => {
  const fetchProfileAndOffers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { username, location, phoneNumber, profileImage } = profileRes.data || {};
      setFormData({
        username: username || "Username",
        location: location || "Location",
        phoneNumber: phoneNumber || "Phone number",
        profileImage: profileImage ?? undefined,
      });
      // show resolved profile image when available, otherwise default logo
      setCurrentProfileImage(resolveImage(profileImage) ?? DEFAULT_PROFILE_IMAGE);

      const id = JSON.parse(atob(token.split(".")[1])).id;
      const offersRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(offersRes.data);
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error("Failed to fetch profile or offers");
    } finally {
      setLoading(false);
    }
  };

  fetchProfileAndOffers();
}, [router]);

  useEffect(() => {
    setCurrentProfileImage(resolveImage(formData.profileImage) ?? DEFAULT_PROFILE_IMAGE);
    setTriedBackendForProfile(false);
  }, [formData.profileImage]);


  const totalOffers = offers.length;
  const totalQuantity = offers.reduce((sum, o) => sum + (o.quantity ?? 0), 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleOfferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOfferForm(prev => ({ ...prev, [name]: value }));
  };

  const openOfferEditModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description ?? "",
      price: String(offer.price ?? ""),
      quantity: String(offer.quantity ?? ""),
      expirationDate: offer.expirationDate
        ? new Date(offer.expirationDate).toISOString().slice(0, 16)
        : "",
    });
    setIsOfferEditModalOpen(true);
  };

  const handleOfferSave = async () => {
    if (!selectedOffer) return;

    // Basic validation
    if (!offerForm.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const quantity = Number(offerForm.quantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error("Quantity must be a non-negative number.");
      return;
    }
    const price = parseFloat(offerForm.price || "0");
    if (isNaN(price) || price < 0) {
      toast.error("Price must be a non-negative number.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const payload = {
        title: offerForm.title.trim(),
        description: offerForm.description.trim() || "",
        price,
        quantity,
        expirationDate: offerForm.expirationDate
          ? new Date(offerForm.expirationDate).toISOString()
          : selectedOffer.expirationDate,
      };

      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${selectedOffer.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOffers(prev => prev.map(o => (o.id === selectedOffer.id ? { ...o, ...payload } : o)));
      setIsOfferEditModalOpen(false);
      setSelectedOffer(null);
      toast.success("Offer updated successfully!");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error("Failed to update offer.");
    }
  };

  const handleDeleteOffer = async (id: number) => {
    const confirmed = confirm("Are you sure you want to delete this offer?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOffers(prev => prev.filter(o => o.id !== id));
      toast.success("Offer deleted successfully!");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error("Failed to delete offer.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          username: formData.username,
          location: formData.location,
          phoneNumber: formData.phoneNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsEditModalOpen(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error("Failed to update profile.");
    }
  };

  return (
    <main className="bg-[#F9FAF5] min-h-screen pt-24 pb-20 flex flex-col items-center">
  
  <ToastContainer
  position="top-right"
  autoClose={1000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnFocusLoss
  draggable
  limit={3}
  toastClassName="bg-emerald-600 text-white rounded-xl shadow-lg border-0 px-4 py-3"
  bodyClassName="text-sm font-medium"
  progressClassName="bg-white/80"
/>

      {/* Profile Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 mb-12 flex flex-col items-center text-center">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#E5F3E9] mb-4 shadow-md">
          <Image
            src={currentProfileImage}
            alt="Profile"
            width={112}
            height={112}
            className="object-cover w-full h-full"
            onError={(e) => {
              const img = (e.currentTarget || e.target) as HTMLImageElement;
              // try backend storage variant once
              if (!triedBackendForProfile) {
                setTriedBackendForProfile(true);
                const parts = (currentProfileImage || "").split("/");
                const filename = parts[parts.length - 1];
                if (filename) {
                  setCurrentProfileImage(`${BASE_IMAGE_URL}${filename}`);
                  return;
                }
              }
              setCurrentProfileImage(DEFAULT_PROFILE_IMAGE);
              // ensure the actual IMG element shows fallback
              try { img.src = DEFAULT_PROFILE_IMAGE; } catch {}
            }}
          />
        </div>
        <h1 className="text-2xl font-bold text-[#1B4332]">{formData.username}</h1>
        <p className="text-gray-600">{formData.phoneNumber}</p>
        <p className="text-gray-500 mb-4">{formData.location}</p>

        <div className="flex justify-around w-full bg-[#F3F7F0] rounded-2xl py-3 mb-6">
          <div>
            <p className="text-lg font-bold text-[#1B4332]">{totalOffers}</p>
            <p className="text-sm text-gray-500">Offers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#1B4332]">{totalQuantity}</p>
            <p className="text-sm text-gray-500">Items</p>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Link href="/provider/publish">
            <Button className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 px-5 py-2 rounded-full font-semibold shadow hover:shadow-md transition hover:-translate-y-0.5">
              Add Offer
            </Button>
          </Link>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-800 px-5 py-2 rounded-full font-semibold hover:bg-gray-50 transition"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Offers grid */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {loading ? (
          <p className="text-gray-600 text-center col-span-full mt-10">Loading offers...</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-center col-span-full mt-10">No offers yet.</p>
        ) : (
          offers.map(offer => {
            const expired = new Date(offer.expirationDate) < new Date();
            return (
              <div
                key={offer.id}
                className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-lg transition"
              >
                <div className="w-full h-40 relative">
                  {(() => {
                    // determine filename/path
                    const first = offer.images?.[0];
                    const f = first as any;
                    // prefer full url returned by storage controller, then filename/path
                    const filename = f?.url ?? f?.filename ?? f?.path ?? (typeof first === "string" ? first : undefined);
                    const imageSrc = resolveImage(filename) ?? undefined;
                    return imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt={offer.title}
                        fill
                        sizes="100vw"
                        className="object-cover"
                        onError={(e) => {
                          const img = (e.currentTarget || e.target) as HTMLImageElement;
                          // try backend storage variant if not already tried
                          if (!img.dataset.triedBackend) {
                            img.dataset.triedBackend = "1";
                            const parts = (img.src || "").split("/");
                            const filename = parts[parts.length - 1];
                            if (filename) img.src = `${BASE_IMAGE_URL}${filename}`;
                            return;
                          }
                          img.src = DEFAULT_PROFILE_IMAGE;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    );
                  })()}
                  {expired && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow">
                      Expired
                    </Badge>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-2">
                  <h2 className="text-lg font-semibold text-[#1B4332] truncate">{offer.title}</h2>
                  <p className="text-sm text-gray-600 truncate">Pickup: {offer.pickupLocation}</p>
                  <p className="text-sm text-gray-500">
                    Expires:{" "}
                    {new Date(offer.expirationDate).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[#2D6A4F] font-semibold">{offer.quantity} left</span>
                    <span className="text-[#2D6A4F] font-semibold">{offer.price} dt</span>
                  </div>

                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      onClick={() => openOfferEditModal(offer)}
                      className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded-full font-medium hover:bg-gray-50"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-full font-medium hover:bg-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start z-50 p-4 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 mt-16 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => setIsEditModalOpen(false)}
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Edit Profile</h2>

            <div className="space-y-4">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                placeholder="Username"
              />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                placeholder="Location"
              />
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                placeholder="Phone number"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300 transition"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
                onClick={handleSaveProfile}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Offer Modal */}
      {isOfferEditModalOpen && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start z-50 p-4 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 mt-16 relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => {
                setIsOfferEditModalOpen(false);
                setSelectedOffer(null);
              }}
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Edit Offer</h2>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  name="title"
                  value={offerForm.title}
                  onChange={handleOfferFormChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                  placeholder="Title"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={offerForm.description}
                  onChange={handleOfferFormChange}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                  placeholder="Description"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    value={offerForm.price}
                    onChange={handleOfferFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                    placeholder="Price"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    value={offerForm.quantity}
                    onChange={handleOfferFormChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                    placeholder="Quantity"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <input
                  name="expirationDate"
                  type="datetime-local"
                  value={offerForm.expirationDate}
                  onChange={handleOfferFormChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300 transition"
                onClick={() => {
                  setIsOfferEditModalOpen(false);
                  setSelectedOffer(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
                onClick={handleOfferSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
