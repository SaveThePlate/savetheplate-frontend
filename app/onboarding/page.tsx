"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import styles from './Onboarding.module.css';

const OnboardingPage = () => {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (selectedRole: any) => {
    setRole(selectedRole);
  };

  const handleSubmitRole = async () => {
    if (!role) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/set-role`, 
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (role === 'PROVIDER') {
        router.push('/onboarding/fillDetails');
      } else {
        router.push('/client/home');
      }

    } catch (error) {
      console.log('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <h1 className={styles.title} >Perfect! Now, tell us</h1>
        <p className={styles.subtitle}>Are you a:</p>
        
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
