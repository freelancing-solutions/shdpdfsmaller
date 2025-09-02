import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Suite - Advanced PDF Processing, Compression & AI-Powered Tools",
  description: "Complete PDF solution: compress PDFs, convert to editable formats, OCR text extraction, and AI-powered analysis including summarization, sentiment analysis, and content enhancement.",
  keywords: ["PDF compression", "PDF to Word", "OCR PDF", "AI PDF tools", "PDF summarization", "PDF conversion", "text extraction", "PDF editing", "document processing"],
  authors: [{ name: "PDF Suite Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    url: "https://www.pdfsmaller.site",
    title: "PDF Suite - Advanced Processing, Compression & AI Tools",
    description: "All-in-one PDF solution with compression, conversion, OCR text extraction, and AI-powered analysis tools.",
    images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23667eea'/%3E%3Cstop offset='100%25' stop-color='%23764ba2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='630' fill='url(%23grad)'/%3E%3Crect x='400' y='180' width='400' height='240' rx='15' fill='rgba(255,255,255,0.9)'/%3E%3Crect x='435' y='225' width='330' height='30' rx='5' fill='%233182ce'/%3E%3Crect x='435' y='275' width='330' height='30' rx='5' fill='%233182ce'/%3E%3Crect x='435' y='325' width='330' height='30' rx='5' fill='%233182ce'/%3E%3Ccircle cx='700' cy='210' r='15' fill='%23e53e3e'/%3E%3Cpath d='M690 210 l5 -5 10 10' stroke='white' stroke-width='3' fill='none'/%3E%3Ctext x='600' y='120' font-family='Arial, sans-serif' font-size='40' font-weight='bold' text-anchor='middle' fill='white'%3EPDFSmaller%3C/text%3E%3Ctext x='600' y='170' font-family='Arial, sans-serif' font-size='30' text-anchor='middle' fill='white'%3EAdvanced PDF Compression%3C/text%3E%3Ctext x='600' y='220' font-family='Arial, sans-serif' font-size='24' text-anchor='middle' fill='white'%3EClient-Side • Optional Server Processing%3C/text%3E%3Ctext x='600' y='550' font-family='Arial, sans-serif' font-size='24' text-anchor='middle' fill='white'%3E100%25 Free • Privacy Focused%3C/text%3E%3C/svg%3E"],
  },
   twitter: {
    card: "summary_large_image",
    site: "https://pdfsmaller.site",
    title: "PDF Suite - Advanced PDF Processing & AI Tools",
    description: "Complete PDF solution with compression, conversion, OCR, and AI analysis capabilities.",
     images: ["data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 630'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23667eea'/%3E%3Cstop offset='100%25' stop-color='%23764ba2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='630' fill='url(%23grad)'/%3E%3Crect x='400' y='180' width='400' height='240' rx='15' fill='rgba(255,255,255,0.9)'/%3E%3Crect x='435' y='225' width='330' height='30' rx='5' fill='%233182ce'/%3E%3Crect x='435' y='275' width='330' height='30' rx='5' fill='%233182ce'/%3E%3Crect x='435' y='325' width='330' height='30' rx='5' fill='%233182ce'/%3E%3Ccircle cx='700' cy='210' r='15' fill='%23e53e3e'/%3E%3Cpath d='M690 210 l5 -5 10 10' stroke='white' stroke-width='3' fill='none'/%3E%3Ctext x='600' y='120' font-family='Arial, sans-serif' font-size='40' font-weight='bold' text-anchor='middle' fill='white'%3EPDFSmaller%3C/text%3E%3Ctext x='600' y='170' font-family='Arial, sans-serif' font-size='30' text-anchor='middle' fill='white'%3EAdvanced PDF Compression%3C/text%3E%3Ctext x='600' y='220' font-family='Arial, sans-serif' font-size='24' text-anchor='middle' fill='white'%3EClient-Side • Optional Server Processing%3C/text%3E%3Ctext x='600' y='550' font-family='Arial, sans-serif' font-size='24' text-anchor='middle' fill='white'%3E100%25 Free • Privacy Focused%3C/text%3E%3C/svg%3E"],
  },
  verification: {
    google: "ylrJvKlQR-zxl56H7ovlzVGo_9vC941cbgl02yrSbwQ",
  },
  alternates: {
    canonical: "https://pdfsmaller.site/",
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='40' fill='%233182ce'/%3E%3Crect x='35' y='40' width='30' height='20' rx='2' fill='white'/%3E%3Cpath d='M40 45H60V50H40z M40 55H60V60H40z' fill='%233182ce'/%3E%3Ccircle cx='65' cy='40' r='4' fill='%23e53e3e'/%3E%3Cpath d='M62 40L65 37L68 40' stroke='white' stroke-width='1.5' fill='none'/%3E%3C/svg%3E",
  },
};

import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Header } from '@/components/layout/Header';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WTLWZMT5');`,
          }}
        />
        {/* End Google Tag Manager */}
        
        {/* Google tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-PQQ5LXLKWJ"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-PQQ5LXLKWJ');
            `,
          }}
        />
        
        {/* JSON-LD Structured Data */}
  <Script
    id="json-ld"
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "PDF Suite",
        "url": "https://pdfsuite.example.com/",
        "description": "Advanced PDF processing suite with compression, conversion, OCR, and AI-powered analysis tools.",
        "applicationCategory": "UtilityApplication",
        "operatingSystem": "Any",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        },
        "featureList": [
          "PDF compression", 
          "PDF conversion", 
          "OCR text extraction", 
          "AI summarization",
          "Sentiment analysis",
          "Keyword extraction",
          "Question generation",
          "Document categorization"
        ]
      })
    }}
  />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WTLWZMT5"
              height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
        {/* End Google Tag Manager (noscript) */}
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <Header />
          <main className="flex-1">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
