
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import MainLayout from '@/components/layout/main-layout';
import { AuthProvider } from '@/hooks/use-auth';
import { NotificationProvider } from '@/hooks/use-notification';

export const metadata: Metadata = {
  title: 'ClipperConnect',
  description: 'The all-in-one platform for barber services.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <NotificationProvider>
            <MainLayout>
              {children}
            </MainLayout>
          </NotificationProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
