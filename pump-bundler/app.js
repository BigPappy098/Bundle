// app.js
// Initialize Solana Connection
const NETWORK = "mainnet-beta";
const connection = new solanaWeb3.Connection(
  solanaWeb3.clusterApiUrl(NETWORK),
  "confirmed"
);

// Wallet Group System
let walletGroups = {
  bundled: [],
  bump: []
};

// User Session Management
let currentUser = null;

// Security Utilities
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Authentication Functions
async function handleRegister(e) {
  e.preventDefault();
  
  if (typeof solanaWeb3 === 'undefined') {
    showAlert('Solana library failed to load', 'error');
    return;
  }

  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!username || !password) {
    showAlert('Please fill in all fields', 'error');
    return;
  }

  if (localStorage.getItem(`pb:user:${username}`)) {
    showAlert('Username already exists', 'error');
    return;
  }

  try {
    const devWallet = solanaWeb3.Keypair.generate();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptionKey = await deriveKey(password, username);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedKey = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      encryptionKey,
      devWallet.secretKey
    );

    const user = {
      username,
      salt: Array.from(salt),
      iv: Array.from(iv),
      encryptedKey: Array.from(new Uint8Array(encryptedKey)),
      devWalletPublicKey: devWallet.publicKey.toString(),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(`pb:user:${username}`, JSON.stringify(user));
    showAlert('Account created! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'auth.html', 1500);

  } catch (error) {
    showAlert(`Registration failed: ${error.message}`, 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const userData = JSON.parse(localStorage.getItem(`pb:user:${username}`));

  if (!userData) {
    showAlert('User not found', 'error');
    return;
  }

  try {
    const encryptionKey = await deriveKey(password, username);
    const iv = new Uint8Array(userData.iv);
    const encryptedKey = new Uint8Array(userData.encryptedKey);
    
    const secretKey = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      encryptionKey,
      encryptedKey
    );

    localStorage.setItem('pb:currentUser', JSON.stringify({
      username,
      devWallet: {
        publicKey: userData.devWalletPublicKey,
        secretKey: Array.from(new Uint8Array(secretKey))
      }
    }));
    
    window.location.href = 'dashboard.html';
  } catch (error) {
    showAlert('Invalid password', 'error');
  }
}

// Session Management
function checkAuthStatus() {
  const user = localStorage.getItem('pb:currentUser');
  if (!user && !window.location.pathname.includes('auth')) {
    window.location.href = 'auth.html';
  } else if (user) {
    currentUser = JSON.parse(user);
  }
}

function logout() {
  localStorage.removeItem('pb:currentUser');
  window.location.href = 'auth.html';
}

// Dashboard Functions
function initDashboard() {
  updateStats();
  loadGroups();
  loadWallets();
}

async function updateStats() {
  document.getElementById('totalLaunches').textContent = 
    JSON.parse(localStorage.getItem('pb:launches') || '[]').length;
  
  document.getElementById('activeGroups').textContent = 
    [...groupManager.groups.bundled, ...groupManager.groups.bump].length;
}

function loadGroups() {
  const groupList = document.getElementById('groupList');
  groupList.innerHTML = '';
  
  [...groupManager.groups.bundled, ...groupManager.groups.bump].forEach(group => {
    const div = document.createElement('div');
    div.className = 'wallet-card';
    div.innerHTML = `
      <h4>${group.name}</h4>
      <p>Type: ${group.type}</p>
      <p>Wallets: ${group.wallets.length}</p>
      <button onclick="deleteGroup('${group.id}')">Delete</button>
    `;
    groupList.appendChild(div);
  });
}

function createGroup(type) {
  groupManager.createGroup(type);
  loadGroups();
  showAlert(`${type} group created!`, 'success');
}

function deleteGroup(groupId) {
  const groups = groupManager.groups;
  groups.bundled = groups.bundled.filter(g => g.id !== groupId);
  groups.bump = groups.bump.filter(g => g.id !== groupId);
  groupManager.saveToStorage();
  loadGroups();
}

async function loadWallets() {
  const user = JSON.parse(localStorage.getItem('pb:currentUser'));
  if (!user) return;

  const walletList = document.getElementById('walletList');
  walletList.innerHTML = '';
  
  const wallets = JSON.parse(localStorage.getItem('pb:wallets') || '[]');
  
  wallets.forEach(wallet => {
    const div = document.createElement('div');
    div.className = 'wallet-card';
    div.innerHTML = `
      <div class="wallet-type ${wallet.type}">${wallet.type}</div>
      <p class="wallet-address">${wallet.publicKey.slice(0, 16)}...</p>
      <p>Balance: ◎${wallet.balance || '0.00'}</p>
    `;
    walletList.appendChild(div);
  });
}

function showWalletCreator() {
  document.getElementById('walletModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('walletModal').style.display = 'none';
}

// Core Functions
async function handleLaunch(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const tokenName = formData.get('name');
  const symbol = formData.get('symbol');
  
  try {
    showAlert('Launching token...', 'success');
    // Token creation logic placeholder
  } catch (error) {
    showAlert(`Launch failed: ${error.message}`, 'error');
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAuthStatus);
if (window.location.pathname.includes('dashboard.html')) {
  document.addEventListener('DOMContentLoaded', initDashboard);
}

// Storage Initialization
if (!localStorage.getItem('pb:launches')) {
  localStorage.setItem('pb:launches', JSON.stringify([]));
}
if (!localStorage.getItem('pb:wallets')) {
  localStorage.setItem('pb:wallets', JSON.stringify([]));
}