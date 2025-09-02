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
import { Badge } from '@/components/ui/badge';
import { PayPalButton } from './PayPalButton';

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: '$0/mo',
    features: {
      compression: ['Basic compression', 'Single file processing', '5MB file limit'],
      conversion: ['Basic format conversion (PDF to TXT only)'],
      ocr: ['Not available'],
      aiTools: ['Not available'],
      storage: ['100MB storage limit', 'Files expire after 7 days'],
      support: ['Community forum access only'],
      limits: ['50 operations per month']
    },
    buttonText: 'Current Plan',
    disabled: true
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '$9.99/mo',
    features: {
      compression: ['Advanced compression algorithms', 'Batch processing (up to 5 files)', '25MB file limit'],
      conversion: ['All format conversions (PDF to DOCX, HTML, Images)', 'Format preservation', 'Image extraction'],
      ocr: ['Multi-language OCR (10 languages)', 'Searchable PDF output', 'Layout preservation'],
      aiTools: ['Document summarization', 'Keyword extraction', 'Sentiment analysis'],
      storage: ['5GB storage capacity', 'Permanent file storage'],
      support: ['Priority email support', '48-hour response time'],
      limits: ['Unlimited operations']
    },
    buttonText: 'Upgrade to Pro',
    popular: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: '$29.99/mo',
    features: {
      compression: ['Maximum compression algorithms', 'Unlimited batch processing', '100MB file limit'],
      conversion: ['All conversion features', 'API access for automated conversions', 'Custom output formats'],
      ocr: ['All OCR languages', 'Highest accuracy models', 'Batch OCR processing'],
      aiTools: ['All AI tools including translation', 'Question generation', 'Document categorization'],
      storage: ['Unlimited storage', 'Advanced search and organization'],
      support: ['24/7 dedicated support', 'Phone and chat support', 'Technical account manager'],
      limits: ['Unlimited everything', 'Custom usage limits available']
    },
    buttonText: 'Subscribe to Enterprise',
    enterprise: true
  },
];

const featureCategories = [
  { id: 'compression', name: 'Compression', icon: '🗜️' },
  { id: 'conversion', name: 'Conversion', icon: '🔄' },
  { id: 'ocr', name: 'OCR', icon: '👁️' },
  { id: 'aiTools', name: 'AI Tools', icon: '🤖' },
  { id: 'storage', name: 'Storage', icon: '💾' },
  { id: 'support', name: 'Support', icon: '🛟' },
  { id: 'limits', name: 'Limits', icon: '📊' },
];

export function SubscriptionDialog({ currentPlan = 'FREE' }: { currentPlan?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Plans</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your PDF processing needs. All plans include secure processing and basic features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all ${plan.popular ? 'border-2 border-primary shadow-lg' : ''} ${plan.enterprise ? 'border-2 border-purple-500 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default" className="px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {plan.enterprise && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="secondary" className="px-3 py-1 bg-purple-500 text-white">
                    Premium
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-1 text-lg font-semibold text-foreground">
                      {plan.price}
                    </CardDescription>
                  </div>
                  {currentPlan === plan.id && (
                    <Badge variant="outline" className="ml-2">Current</Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pb-6">
                <div className="space-y-4">
                  {featureCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center text-sm font-medium">
                        <span className="mr-2">{category.icon}</span>
                        {category.name}
                      </div>
                      <ul className="space-y-1 text-sm">
                        {plan.features[category.id as keyof typeof plan.features].map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  {plan.id === 'FREE' ? (
                    <Button className="w-full" variant="outline" disabled>
                      {currentPlan === plan.id ? 'Current Plan' : 'Free Tier'}
                    </Button>
                  ) : (
                    <PayPalButton 
                      planId={plan.id} 
                      className="w-full"
                      disabled={currentPlan === plan.id}
                      variant={plan.enterprise ? "default" : "default"}
                    >
                      {currentPlan === plan.id ? 'Current Plan' : plan.buttonText}
                    </PayPalButton>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Need help deciding?</h3>
          <p className="text-sm text-muted-foreground">
            All subscriptions include a 14-day money-back guarantee. Enterprise plan includes all features with priority support and unlimited usage.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}