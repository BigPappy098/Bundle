// Auth Functions
function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  // Generate dev wallet on registration
  const devWallet = solanaWeb3.Keypair.generate();
  
  localStorage.setItem('pb:user', JSON.stringify({
    username,
    password, // Note: In production, hash this
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

// Dashboard Functions
let wallets = [];

function showWalletCreator() {
  document.getElementById('walletModal').style.display = 'block';
}

function createWallet() {
  const type = document.getElementById('walletType').value;
  const keypair = solanaWeb3.Keypair.generate();
  
  wallets.push({
    type,
    publicKey: keypair.publicKey.toString(),
    secretKey: btoa(JSON.stringify(Array.from(keypair.secretKey))),
    balance: 0
  });
  
  updateWalletDisplay();
  closeModal();
}

function updateWalletDisplay() {
  const container = document.getElementById('walletList');
  container.innerHTML = wallets.map(wallet => `
    <div class="wallet-card">
      <div>
        <span class="wallet-type ${wallet.type}">${wallet.type.toUpperCase()}</span>
        <p>${wallet.publicKey.slice(0, 12)}...${wallet.publicKey.slice(-4)}</p>
      </div>
      <div class="wallet-actions">
        <button onclick="showDeposit('${wallet.publicKey}')">Deposit</button>
        <button onclick="showWithdraw('${wallet.publicKey}')">Withdraw</button>
      </div>
    </div>
  `).join('');
}

// Navigation
document.querySelectorAll('.nav-button').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.nav-button, .view').forEach(el => {
      el.classList.remove('active');
    });
    this.classList.add('active');
    document.getElementById(this.dataset.view).classList.add('active');
  });
});

function logout() {
  localStorage.removeItem('pb:user');
  window.location.href = 'auth.html';
}

// Initialize Solana Connection
const connection = new solanaWeb3.Connection(
  "https://api.mainnet-beta.solana.com",
  "confirmed"
);