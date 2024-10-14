"use client";
import { useState } from 'react';
import { useRouter } from "next/navigation";
import styles from './Onboarding.module.css'; 
import axios from 'axios';

const OnboardingPage = () => {
    const router = useRouter();
    const [role, setRole] = useState<'CLIENT' | 'PROVIDER' | null>(null); 
    const [isSubmitting, setIsSubmitting] = useState(false); 

    const handleRoleSelect = (selectedRole: 'CLIENT' | 'PROVIDER') => {
        setRole(selectedRole); 
    };

    const handleSubmit = async () => {
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
    
            console.log('Response:', response.data);
    

            router.push(response.data.redirectTo); 
          
        } catch (error) {
            console.log('Error:');
        } finally {
            setIsSubmitting(false); 
        }
    };
    
    
    
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Welcome to Save The Plate!</h1>
            <p className={styles.subtitle}>You are a </p>
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
            <br />
            {role && (
                <>
                    <p>Can't wait to have the best {role} joining our community!</p>
                    <button 
                        className={styles.submitButton} 
                        onClick={handleSubmit} 
                        disabled={isSubmitting} 
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Role'}
                    </button>
                </>
            )}
        </div>
    );
};

export default OnboardingPage;
