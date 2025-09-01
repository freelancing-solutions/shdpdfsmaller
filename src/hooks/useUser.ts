
import { useEffect, useState } from 'react';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    Subscription: {
        plan: string;
    } | null;
}

export function useUser() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/profile');
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, []);

    return { user, isLoading };
}
