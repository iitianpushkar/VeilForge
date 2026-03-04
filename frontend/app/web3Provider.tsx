'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { arcTestnet, base } from 'wagmi/chains';
import { http } from 'wagmi';
import { useMemo, useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: 'my-project',
        projectId: 'new',
        chains: [base],
        transports: {
          [base.id]: http(),
        },
        ssr: false,
      }),
    []
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
