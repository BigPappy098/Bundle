// Authentication System
function handleRegister(e) {
  e.preventDefault();
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
      password: btoa(password), // Basic encoding
      devWallet: {
        publicKey: devWallet.publicKey.toString(),
        encryptedKey: btoa(JSON.stringify(Array.from(devWallet.secretKey)))
      },
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(`pb:user:${username}`, JSON.stringify(user));
    showAlert('Account created successfully! Redirecting...');
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
function checkAuth() {
  const user = localStorage.getItem('pb:currentUser');
  if (!user && !window.location.pathname.includes('auth')) {
    window.location.href = 'auth.html';
  }
}

function logout() {
  localStorage.removeItem('pb:currentUser');
  window.location.href = 'auth.html';
}

// Initialize auth check on all pages
document.addEventListener('DOMContentLoaded', checkAuth);