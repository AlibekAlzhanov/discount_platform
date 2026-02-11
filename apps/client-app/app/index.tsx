import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Корневой index - редирект на login
 */
export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 50); // маленькая задержка для монтирования RootLayout

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
