'use client';

import dynamic from 'next/dynamic';

const Web3Provider = dynamic(() => import('./web3Provider'), {
  ssr: false, // ✅ allowed HERE
});

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Web3Provider>{children}</Web3Provider>;
}
