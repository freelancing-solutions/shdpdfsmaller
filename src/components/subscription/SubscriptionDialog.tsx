
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PayPalButton } from './PayPalButton'; // I will create this next

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: '$0/mo',
    features: ['Basic compression', 'Limited features'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$9.99/mo',
    features: ['Advanced compression', 'Bulk processing', 'Priority support'],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Contact Us',
    features: ['Maximum compression', 'Unlimited files', 'Dedicated support'],
  },
];

export function SubscriptionDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Subscribe</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Subscription Plans</DialogTitle>
          <DialogDescription>
            Choose the plan that's right for you.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.price}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  {plan.id !== 'FREE' && plan.id !== 'ENTERPRISE' && (
                    <PayPalButton planId={plan.id} />
                  )}
                  {plan.id === 'ENTERPRISE' && (
                    <Button className="w-full">Contact Us</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
