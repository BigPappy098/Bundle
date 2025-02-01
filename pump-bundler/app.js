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

// Authentication Functions
function handleRegister(e) {
  e.preventDefault();
  
  // Verify Solana Web3 loaded
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
    const user = {
      username,
      password: btoa(password),
      devWallet: {
        publicKey: devWallet.publicKey.toString(),
        encryptedKey: btoa(JSON.stringify(Array.from(devWallet.secretKey)))
      },
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(`pb:user:${username}`, JSON.stringify(user));
    showAlert('Account created! Redirecting...', 'success');
    setTimeout(() => window.location.href = 'auth.html', 1500);

  } catch (error) {
    showAlert(`Registration failed: ${error.message}`, 'error');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const user = JSON.parse(localStorage.getItem(`pb:user:${username}`));

  if (!user) {
    showAlert('User not found', 'error');
    return;
  }

  if (btoa(password) !== user.password) {
    showAlert('Invalid password', 'error');
    return;
  }

  localStorage.setItem('pb:currentUser', JSON.stringify(user));
  window.location.href = 'dashboard.html';
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

// Initialize auth check
document.addEventListener('DOMContentLoaded', checkAuthStatus);