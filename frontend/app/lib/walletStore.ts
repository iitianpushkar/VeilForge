export type Wallet = {
    id: string;
    nullifier: string;
    secret: string;
    balance: string
  };
  
  export function getWallets(): Wallet[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem("wallets");
    return data ? JSON.parse(data) : [];
  }
  
  export function getCurrentWallet(): Wallet | null {
    if (typeof window === "undefined") return null;
  
    const wallets = getWallets();
    const currentId = localStorage.getItem("currentWalletId");
  
    return wallets.find(w => w.id === currentId) || null;
  }

  export function saveWallets(wallets: Wallet[]) {
    localStorage.setItem("wallets", JSON.stringify(wallets));
  }
  
  
  export function setCurrentWallet(id: string) {
    localStorage.setItem("currentWalletId", id);
  }

  export function updateWallet(
    id: string,
    nullifier: string,
    secret: string,
    balance: string
  ) {
    if (typeof window === "undefined") return;
  
    const wallets = getWallets();
  
    const index = wallets.findIndex(w => w.id === id);
    if (index === -1) return;
  
    wallets[index] = {
      ...wallets[index],
      nullifier,
      secret,
      balance
    };
  
    saveWallets(wallets); // ✅ persist change
  }
  
  