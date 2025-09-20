'use client';

import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders its children on the client-side to prevent hydration errors.
 * Useful for components that depend on browser APIs or wallet adapters.
 */
export default function ClientOnly({ children, fallback }: Props) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}