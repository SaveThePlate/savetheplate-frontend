"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from './Onboarding.module.css';

const OnboardingPage = () => {
  const router = useRouter();
  const [role, setRole] = useState<'CLIENT' | 'PROVIDER' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (selectedRole: 'CLIENT' | 'PROVIDER') => {
    setRole(selectedRole);
  };

  const handleSubmitRole = async () => {
    if (!role) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.post('http://localhost:3001/users/set-role', {
        role: role,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (role === 'PROVIDER') {
        router.push('/onboarding/fillDetails');
      } else {
        router.push(response.data.redirectTo);
      }

    } catch (error) {
      console.log('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="min-h-screen flex justify-center ">
    <div className={styles.container} >
      <h1 className={styles.title}>Welcome to Save The Plate!</h1>
      <p className={styles.subtitle}>You are a:</p>
      <div className={styles.roleSelection}>
        <div 
          className={`${styles.roleBox} ${role === 'PROVIDER' ? styles.selected : ''}`} 
          onClick={() => handleRoleSelect('PROVIDER')}
        >
          <span role="img" aria-label="Restaurant">🍔</span>
          <p>Restaurant</p>
        </div>
        <div 
          className={`${styles.roleBox} ${role === 'CLIENT' ? styles.selected : ''}`} 
          onClick={() => handleRoleSelect('CLIENT')}
        >
          <span role="img" aria-label="Client">😁</span>
          <p>Client</p>
        </div>
      </div>

      {role && (
        <div className={styles.confirmation}>
          <button 
            className={styles.submitButton} 
            onClick={handleSubmitRole} 
            disabled={isSubmitting} 
          >
            {isSubmitting ? 'Submitting...' : 'Next step >'}
          </button>
        </div>
      )}
    </div>

  </div>
  );
};

export default OnboardingPage;
