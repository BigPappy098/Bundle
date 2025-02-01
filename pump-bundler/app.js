// Authentication System
function handleRegister(e) {
  e.preventDefault();
  const user = {
    email: document.getElementById('regEmail').value,
    username: document.getElementById('regUsername').value,
    password: document.getElementById('regPassword').value
  };
  
  localStorage.setItem('pb:user', JSON.stringify(user));
  window.location.href = 'dashboard.html';
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const user = JSON.parse(localStorage.getItem('pb:user'));
  
  if (user && (user.email === username || user.username === username) && user.password === password) {
    localStorage.setItem('pb:currentUser', JSON.stringify(user));
    window.location.href = 'dashboard.html';
  } else {
    alert('Invalid credentials');
  }
}

// Dashboard System
let currentToken = null;
const wallets = [];

function createWallet() {
  const keypair = solanaWeb3.Keypair.generate();
  const wallet = {
    publicKey: keypair.publicKey.toString(),
    secretKey: btoa(JSON.stringify(Array.from(keypair.secretKey))),
    balance: 0,
    type: 'custodial'
  };
  
  wallets.push(wallet);
  updateWalletDisplay();
  updateStats();
}

async function handleLaunch(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  try {
    // 1. Upload image
    const ipfsForm = new FormData();
    ipfsForm.append('file', formData.get('tokenLogo'));
    ipfsForm.append('name', formData.get('tokenName'));
    
    const ipfsRes = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: ipfsForm
    });
    const { metadataUri } = await ipfsRes.json();

    // 2. Create token
    const launchRes = await fetch('https://pumpportal.fun/api/trade-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: "create",
        name: formData.get('tokenName'),
        symbol: formData.get('tokenSymbol'),
        metadataUri,
        denominatedInSol: true,
        amount: 1
      })
    });

    // 3. Process transaction
    const txData = await launchRes.arrayBuffer();
    const tx = solanaWeb3.VersionedTransaction.deserialize(new Uint8Array(txData));
    const keypair = solanaWeb3.Keypair.generate();
    tx.sign([keypair]);
    
    const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com");
    const signature = await connection.sendTransaction(tx);
    
    alert(`Token launched! TX: ${signature}`);
    updateStats();
    
  } catch (error) {
    alert(`Launch failed: ${error.message}`);
  }
}

// UI Updates
function updateStats() {
  document.getElementById('totalLaunches').textContent = wallets.filter(w => w.type === 'launch').length;
  document.getElementById('activeWallets').textContent = wallets.length;
}

function updateWalletDisplay() {
  const container = document.getElementById('walletGrid');
  container.innerHTML = wallets.map(wallet => `
    <div class="wallet-card">
      <h3>${wallet.publicKey.slice(0, 12)}...</h3>
      <p>Type: ${wallet.type}</p>
      <button onclick="showWalletDetails('${wallet.publicKey}')">Manage</button>
    </div>
  `).join('');
}

// Navigation
document.querySelectorAll('.sidebar button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.getElementById(`${button.dataset.view}View`).classList.add('active');
  });
});