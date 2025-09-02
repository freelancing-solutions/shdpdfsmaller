'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Zap } from 'lucide-react';
import { LoginDialog } from '@/components/auth/LoginDialog';
import { RegisterDialog } from '@/components/auth/RegisterDialog';
import { SubscriptionDialog } from '@/components/subscription/SubscriptionDialog';
import { ProfileDialog } from '@/components/auth/ProfileDialog';
import { useUser } from '@/hooks/useUser';
import { useTabStore } from '@/store/tab-store';
import { ThemeToggle } from './ThemeToggle'; // <-- MOVED TO TOP

export function Header() {
    const { user, isLoading } = useUser();
    const { setActiveTab } = useTabStore();
    const [isOpen, setIsOpen] = useState(false);

    const handleNavClick = (tab: string) => {
        setActiveTab(tab);
        setIsOpen(false);
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="flex items-center space-x-2">
                        <Zap className="h-6 w-6" />
                        <span className="font-bold">PDFSmaller</span>
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    {/* REMOVED THE IMPORT STATEMENT FROM HERE */}
                    
                    <nav className="hidden md:flex gap-2">
                        {isLoading ? <p>Loading...</p> : user ? (
                            <>
                                <p className="p-2">Welcome, {user.name}</p>
                                <ProfileDialog />
                                <SubscriptionDialog />
                                <Button variant="outline" onClick={handleLogout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                <LoginDialog />
                                <RegisterDialog />
                            </>
                        )}
                        <ThemeToggle />
                    </nav>
                </div>

                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Menu className="h-4 w-4" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left">
                            <nav className="grid gap-6 text-lg font-medium">
                                <Link href="/" className="flex items-center space-x-2">
                                    <Zap className="h-6 w-6" />
                                    <span className="font-bold">PDFSmaller</span>
                                </Link>
                                <Button variant="link" onClick={() => handleNavClick('compress')}>Compress</Button>
                                <Button variant="link" onClick={() => handleNavClick('convert')}>Convert</Button>
                                <Button variant="link" onClick={() => handleNavClick('ocr')}>OCR</Button>
                                <Button variant="link" onClick={() => handleNavClick('ai-tools')}>AI Tools</Button>
                                {/* <Button variant="link" onClick={() => handleNavClick('files')}>Files</Button>
                                <Button variant="link" onClick={() => handleNavClick('settings')}>Settings</Button> */}
                                <hr />
                                {isLoading ? <p>Loading...</p> : user ? (
                                    <>
                                        <p>Welcome, {user.name}</p>
                                        <ProfileDialog />
                                        <SubscriptionDialog />
                                        <Button variant="outline" onClick={handleLogout}>Logout</Button>
                                    </>
                                ) : (
                                    <>
                                        <LoginDialog />
                                        <RegisterDialog />
                                    </>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}