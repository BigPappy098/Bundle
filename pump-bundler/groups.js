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
    if (group && !group.wallets.includes(wallet)) {
      group.wallets.push(wallet);
      this.saveToStorage();
    }
  }

  findGroup(groupId) {
    return [...this.groups.bundled, ...this.groups.bump]
           .find(g => g.id === groupId);
  }

  getGroupSelectOptions() {
    return [...this.groups.bundled, ...this.groups.bump].map(group => 
      `<option value="${group.id}">${group.name} (${group.type})</option>`
    ).join('');
  }

  async getGroupBalance(groupId) {
    const group = this.findGroup(groupId);
    return group ? group.wallets.length * 1.5 : 0;
  }

  saveToStorage() {
    localStorage.setItem('pb:groups', JSON.stringify(this.groups));
  }

  loadFromStorage() {
    const saved = localStorage.getItem('pb:groups');
    if (saved) this.groups = JSON.parse(saved);
  }
}

const groupManager = new WalletGroupManager();