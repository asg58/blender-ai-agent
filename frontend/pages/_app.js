import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import { ToastProvider } from '../components/ToastNotification';

function MyApp({ Component, pageProps }) {
  // Check for dark mode preference
  useEffect(() => {
    // Add listener for dark mode preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const isDarkMode = e.matches;
      document.documentElement.classList.toggle('dark', isDarkMode);
    };
    
    // Initial check
    handleChange(mediaQuery);
    
    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Blender AI Agent</title>
        <meta name="description" content="Control Blender with natural language using AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ToastProvider>
        <div className="min-h-screen">
          <Component {...pageProps} />
        </div>
      </ToastProvider>
    </>
  );
}

export default MyApp; 