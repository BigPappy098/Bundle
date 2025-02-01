// groups.js
class WalletGroupManager {
  constructor() {
    this.groups = {
      bundled: [],
      bump: []
    };
    this.loadFromStorage();
  }

  createGroup(type, name) {
    const group = {
      id: crypto.randomUUID(),
      name: name || `${type} Group ${this.groups[type].length + 1}`,
      type: type,
      wallets: []
    };
    this.groups[type].push(group);
    this.saveToStorage();
    return group;
  }

  addWalletToGroup(wallet, groupId) {
    const group = this.findGroup(groupId);
    if (group) {
      group.wallets.push(wallet);
      this.saveToStorage();
    }
  }

  findGroup(groupId) {
    return [...this.groups.bundled, ...this.groups.bump]
           .find(g => g.id === groupId);
  }

  saveToStorage() {
    localStorage.setItem('pb:groups', JSON.stringify(this.groups));
  }

  loadFromStorage() {
    const saved = localStorage.getItem('pb:groups');
    if (saved) this.groups = JSON.parse(saved);
  }
}

// Initialize
const groupManager = new WalletGroupManager();
