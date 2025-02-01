// Initialize Solana Connection
const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);

// Wallet Group System
let walletGroups = {
  bundled: [],
  bump: []
};

// User Session Management
let currentUser = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  initializeDashboard();
});

// Authentication Functions
function checkAuthStatus() {
  const user = localStorage.getItem('pb:user');
  if (!user && !window.location.pathname.includes('auth')) {
    window.location.href = 'auth.html';
  } else if (user) {
    currentUser = JSON.parse(user);
  }
}

function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  // Generate dev wallet
  const devWallet = solanaWeb3.Keypair.generate();
  
  // Store user data
  localStorage.setItem('pb:user', JSON.stringify({
    username,
    password, // Note: Hash this in production
    devWallet: {
      publicKey: devWallet.publicKey.toString(),
      encryptedKey: btoa(JSON.stringify(Array.from(devWallet.secretKey)))
    }
  }));
  
  window.location.href = 'dashboard.html';
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const user = JSON.parse(localStorage.getItem('pb:user'));

  if (user && user.username === username && user.password === password) {
    window.location.href = 'dashboard.html';
  } else {
    alert('Invalid credentials');
  }
}

// Dashboard Initialization
function initializeDashboard() {
  if (!window.location.pathname.includes('dashboard')) return;

  // Setup Navigation
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.nav-button, .view').forEach(el => {
        el.classList.remove('active');
      });
      this.classList.add('active');
      document.getElementById(this.dataset.view).classList.add('active');
    });
  });

  // Load Wallet Groups
  loadWalletGroups();
}

// Wallet Group Management
function createWalletGroup(type) {
  const groupId = crypto.randomUUID();
  const group = {
    id: groupId,
    name: `${type} Group ${walletGroups[type].length + 1}`,
    wallets: []
  };
  walletGroups[type].push(group);
  saveWalletGroups();
  return group;
}

function addWalletToGroup(wallet, groupId) {
  const group = findGroupById(groupId);
  if (group) {
    group.wallets.push(wallet);
    saveWalletGroups();
  }
}

function findGroupById(groupId) {
  return [...walletGroups.bundled, ...walletGroups.bump]
         .find(g => g.id === groupId);
}

function saveWalletGroups() {
  localStorage.setItem('pb:walletGroups', JSON.stringify(walletGroups));
}

function loadWalletGroups() {
  const savedGroups = localStorage.getItem('pb:walletGroups');
  if (savedGroups) {
    walletGroups = JSON.parse(savedGroups);
    renderWalletGroups();
  }
}

// Token Launch System
async function handleLaunch(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  try {
    // 1. Upload image to IPFS
    const ipfsResponse = await uploadToIPFS(formData.get('image'), {
      name: formData.get('name'),
      symbol: formData.get('symbol')
    });

    // 2. Create token transaction
    const txData = await createTokenTransaction({
      name: formData.get('name'),
      symbol: formData.get('symbol'),
      metadataUri: ipfsResponse.metadataUri,
      supply: formData.get('supply'),
      amount: formData.get('amount')
    });

    // 3. Sign and send
    const keypair = await getDevWalletKeypair();
    const tx = solanaWeb3.VersionedTransaction.deserialize(txData);
    tx.sign([keypair]);
    
    const signature = await connection.sendTransaction(tx);
    alert(`Token launched! TX: ${signature}`);
    
  } catch (error) {
    console.error('Launch failed:', error);
    alert(`Error: ${error.message}`);
  }
}

// Helper Functions
async function uploadToIPFS(file, metadata) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  
  const response = await fetch('https://pump.fun/api/ipfs', {
    method: 'POST',
    body: formData
  });
  return response.json();
}

async function createTokenTransaction(params) {
  const response = await fetch('https://pumpportal.fun/api/trade-local', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: "create",
      ...params,
      denominatedInSol: true,
      slippage: 10,
      priorityFee: 0.0005,
      pool: "pump"
    })
  });
  return response.arrayBuffer();
}

async function getDevWalletKeypair() {
  const user = JSON.parse(localStorage.getItem('pb:user'));
  if (!user?.devWallet) throw new Error('Dev wallet not found');
  
  const secretKey = new Uint8Array(JSON.parse(atob(user.devWallet.encryptedKey)));
  return solanaWeb3.Keypair.fromSecretKey(secretKey);
}

// UI Rendering
function renderWalletGroups() {
  const container = document.getElementById('walletGroups');
  if (!container) return;

  container.innerHTML = `
    <h3>Bundled Groups</h3>
    ${walletGroups.bundled.map(renderGroup).join('')}
    
    <h3>Bump Groups</h3>
    ${walletGroups.bump.map(renderGroup).join('')}
  `;
}

function renderGroup(group) {
  return `
    <div class="group-card">
      <h4>${group.name}</h4>
      <p>Wallets: ${group.wallets.length}</p>
      <button onclick="manageGroup('${group.id}')">Manage</button>
    </div>
  `;
}

// Logout
function logout() {
  localStorage.removeItem('pb:user');
  window.location.href = 'auth.html';
}