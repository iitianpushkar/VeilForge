'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, User, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Deposit', href: '/deposit' },
  { label: 'Swap', href: '/swap' },
  { label: 'Withdraw', href: '/withdraw' },
  { label: 'Profile', href: '/profile' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [walletOpen, setWalletOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  function handleExportSecrets() {
    try {
      const zkID = JSON.parse(localStorage.getItem('zkID') || 'null');
  
      const wallets = JSON.parse(localStorage.getItem('wallets') || '[]');
      const currentId = localStorage.getItem('currentWalletId');
      const wallet = wallets.find((w: any) => w.id === currentId) || null;
  
      if (!zkID && !wallet) {
        alert('Nothing to export');
        return;
      }
  
      const payload = {
        exportedAt: new Date().toISOString(),
        zkID,
        wallet,
      };
  
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
  
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'veilforge-backup.json';
      a.click();
  
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }
  

  return (
    <nav className="relative flex justify-between items-center px-10 py-5 border-b border-black/5 bg-white/70 backdrop-blur-xl text-black">
      {/* Logo */}
      <div className="text-xl font-semibold tracking-tight cursor-pointer" onClick={() => router.push('/')}>
        VeilForge
      </div>

      {/* Navigation */}
      <div className="relative flex gap-8">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <button className="relative px-1 py-2 text-sm font-medium tracking-tight transition cursor-pointer">
                <span
                  className={`relative z-10 ${
                    active ? 'text-black' : 'text-black/40 hover:text-black'
                  }`}
                >
                  {item.label}
                </span>

                {active && (
                  <span className="absolute left-0 -bottom-1 h-[1.5px] w-full bg-black rounded-full" />
                )}
              </button>
            </Link>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 relative">
        {/* Export */}
        <IconButton onClick={handleExportSecrets}>
        <Download size={18} />
        </IconButton>

        {/* User */}
        <IconButton onClick={() => {
          setUserOpen(!userOpen);
          setWalletOpen(false);
        }}>
          <User size={18} />
        </IconButton>

        {/* Wallet */}
        <IconButton onClick={() => {
          setWalletOpen(!walletOpen);
          setUserOpen(false);
        }}>
          <Wallet size={18} />
        </IconButton>

        <ConnectButton />

        {walletOpen && <WalletTooltip />}
        {userOpen && <UserTooltip />}
      </div>
    </nav>
  );
}

/* ---------------- UI Atoms ---------------- */

function IconButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full border border-black/10 bg-black/5 hover:bg-black/10 transition text-black"
    >
      {children}
    </button>
  );
}

/* ---------------- Wallet Tooltip ---------------- */

function WalletTooltip() {
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    function loadWallet() {
      const wallets = JSON.parse(localStorage.getItem('wallets') || '[]');
      const currentId = localStorage.getItem('currentWalletId');
      setWallet(wallets.find((w: any) => w.id === currentId) || null);
    }

    loadWallet();
    window.addEventListener('storage', loadWallet);
    return () => window.removeEventListener('storage', loadWallet);
  }, []);

  return (
    <TooltipWrapper>
      <h4 className="text-sm font-medium mb-3 text-black">Active Wallet</h4>

      {wallet ? (
        <>
          <InfoRow label="Nullifier" value={wallet.nullifier} />
          <InfoRow label="Secret" value={wallet.secret} />
          <InfoRow label="Balance" value={wallet.balance} />

          <Link href="/wallets">
            <GlowButton>Switch Wallet</GlowButton>
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-black/50 mb-3">No wallet selected</p>
          <Link href="/wallets">
            <GlowButton>Create / Select Wallet</GlowButton>
          </Link>
        </>
      )}
    </TooltipWrapper>
  );
}

/* ---------------- User Tooltip ---------------- */

function UserTooltip() {
  const [zkID, setZkID] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('zkID');
    if (stored) setZkID(JSON.parse(stored));
  }, []);

  return (
    <TooltipWrapper>
      <h4 className="text-sm font-medium mb-3 text-black">zk-ID</h4>

      {zkID ? (
        <>
          <InfoRow label="Document" value={zkID.document} />
          <InfoRow label="Secret" value={zkID.secret} />

          <Link href="/profile">
            <GlowButton>View Profile</GlowButton>
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-black/50 mb-3">No ID created</p>
          <Link href="/profile">
            <GlowButton>Create zk-ID</GlowButton>
          </Link>
        </>
      )}
    </TooltipWrapper>
  );
}

/* ---------------- Shared ---------------- */

function TooltipWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl bg-white/90 backdrop-blur-xl border border-black/5 shadow-lg p-4">
      {children}
    </div>
  );
}

function GlowButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="mt-3 w-full rounded-full bg-black text-white py-2 text-sm font-medium hover:bg-black/90 transition">
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <div className="text-xs text-black/40">{label}</div>
      <div className="text-sm text-black truncate">{value}</div>
    </div>
  );
}
