import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/context/ThemeContext';

export const metadata: Metadata = {
  title: 'CBM - Condition Based Monitoring',
  description: 'Condition Based Monitoring MVP for SLB OptSite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })()
            `,
          }}
        />
      </head>
      <body className="bg-bg-base text-text-primary min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
