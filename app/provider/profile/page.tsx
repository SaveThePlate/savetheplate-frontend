"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";
const DEFAULT_PROFILE_IMAGE = "/logo.png";

const ProfilePage = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [formData, setFormData] = useState({
    username: "",
    location: "",
    phoneNumber: "",
    profileImage: "",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Fetch user profile data
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token not found");

      const response = await axios.get(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/users/me",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { username, location, phoneNumber, profileImage } = response.data;
      setFormData({
        username: username || "Username",
        location: location || "Location",
        phoneNumber: phoneNumber || "Phone number",
        profileImage: profileImage ? BASE_IMAGE_URL + profileImage : DEFAULT_PROFILE_IMAGE,
      });
    } catch (err) {
      toast.error("Failed to fetch profile: " + (err as Error).message);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

// Handle image upload
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;

  if (!files || files.length === 0) {
    return;
  }

  const newFiles = Array.from(files);
  const token = localStorage.getItem('accessToken');
  if (!token) {
    toast.error('Authentication error. Please log in again.');
    return;
  }

  const formData = new FormData();
  formData.append('files', newFiles[0]); 
  console.log('FormData:', formData);
  try {
    // Upload file to storage
    const uploadResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/upload`, // Ensure the correct URL
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (uploadResponse.status === 200) {
      const uploadedFile = uploadResponse.data; 
      
      const newProfileImageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${uploadedFile.filename}`;

      // Update user profile with the new image URL
      const profileUpdateResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        { profileImage: JSON.stringify(newProfileImageUrl) }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (profileUpdateResponse.status === 200) {
        setProfileImage(newProfileImageUrl); // Update frontend state
        toast.success('Profile image updated successfully!');
      } else {
        toast.error('Error updating profile image.');
      }
    } else {
      toast.error('Image upload failed. Try again.');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    toast.error('Failed to upload image.');
  }
};

  

  
  

  // Save profile changes
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/users/me",
        {
          username: formData.username,
          location: formData.location,
          phoneNumber: formData.phoneNumber,
          profileImage: JSON.stringify(formData.profileImage),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsEditModalOpen(false);
      toast.success("Profile updated successfully!");
      fetchProfileData(); // Refresh data
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  return (
    <main className="sm:pt-16 p-6 bg-[#cdeddf] min-h-screen flex flex-col items-center justify-center">
      <ToastContainer />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
        <div className="flex items-center gap-16">
          {/* Profile Image */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
            <Image
              src={formData.profileImage}
              alt="Profile"
              className="object-cover cursor-pointer w-full h-full"
              width={96}
              height={96}
              onClick={() => document.getElementById("fileInput")?.click()}
            />
            <input
              type="file"
              name = "profileImage"
              id="fileInput"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* Profile Details */}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{formData.username}</h1>
            <h2 className="text-gray-600 text-sm">{formData.location}</h2>
            <p className="text-gray-600 text-sm">{formData.phoneNumber}</p>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="w-full h-40 bg-yellow-300 rounded-lg mt-4 flex items-center justify-center">
          <span className="text-gray-700">Map Placeholder</span>
        </div>

        {/* Edit Profile Button */}
        <Button
          className="mt-6 text-black bg-[#fffc5ed3] sm:text-lg border border-black font-bold py-2 px-6 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-yellow-600"
          onClick={() => setIsEditModalOpen(true)}
        >
          Edit Profile
        </Button>

        {/* Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 mb-2 border rounded"
                placeholder="Username"
              />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 mb-2 border rounded"
                placeholder="Location"
              />
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full p-2 mb-4 border rounded"
                placeholder="Phone Number"
              />
              {/* Profile Image Upload */}
              <input
                type="file"
                id="fileInput"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div className="flex justify-center mb-4">
                {formData.profileImage ? (
                  <Image
                    src={formData.profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full border-2 border-gray-300 cursor-pointer"
                    onClick={() => document.getElementById("fileInput")?.click()}
                  />
                ) : (
                  <button
                    className="px-4 py-2 bg-gray-200 rounded cursor-pointer"
                    onClick={() => document.getElementById("fileInput")?.click()}
                  >
                    Upload Image
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
