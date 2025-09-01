
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    Subscription: {
        plan: string;
        status: string;
    } | null;
}

export function ProfileDialog() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchUser = async () => {
                try {
                    const response = await fetch('/api/auth/profile');
                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                    }
                } catch (error) {
                    console.error('Failed to fetch user profile:', error);
                }
            };
            fetchUser();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Profile</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>My Profile</DialogTitle>
                    <DialogDescription>
                        View your account details and subscription status.
                    </DialogDescription>
                </DialogHeader>
                {user ? (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-medium">Name</h4>
                            <p>{user.name}</p>
                        </div>
                        <div>
                            <h4 className="font-medium">Email</h4>
                            <p>{user.email}</p>
                        </div>
                        <div>
                            <h4 className="font-medium">Subscription</h4>
                            <p>{user.Subscription?.plan || 'FREE'} ({user.Subscription?.status || 'active'})</p>
                        </div>
                    </div>
                ) : (
                    <p>Loading...</p>
                )}
            </DialogContent>
        </Dialog>
    );
}
