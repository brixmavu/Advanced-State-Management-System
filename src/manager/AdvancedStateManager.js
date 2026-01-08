import { deepClone, generateId, getTimestamp } from '../utils/utils.js';
import StateDiffer from '../state/StateDiffer.js';

// Advanced State Manager
class AdvancedStateManager {
  constructor(initialState = {}, options = {}) {
    // Core state
    this._currentState = deepClone(initialState);
    this._listeners = new Set();
    
    // Options
    this._debug = options.debug || false;
    this._maxHistorySize = options.maxHistorySize || 50;
    
    // History management
    this._history = [];
    this._future = [];
    this._lastSavedState = deepClone(initialState);
    
    // Transaction support
    this._transaction = null;
    
    // Synchronization
    this._clientId = options.clientId || generateId();
    this._syncEnabled = options.sync || false;
    this._wsClient = options.wsClient || null;
    this._lastSyncedStateId = null;
    
    // Set up synchronization if enabled
    if (this._syncEnabled && this._wsClient) {
      this._setupSync();
    }
    
    // Bind methods
    this.getState = this.getState.bind(this);
    this.setState = this.setState.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.beginTransaction = this.beginTransaction.bind(this);
    this.commitTransaction = this.commitTransaction.bind(this);
    this.rollbackTransaction = this.rollbackTransaction.bind(this);
    
    if (this._debug) {
      console.log(`[${this._clientId}] StateManager initialized with state:`, this._currentState);
    }
  }
  
  // Get the current state (or a specific part of it)
  getState(path) {
    if (!path) return deepClone(this._currentState);
    
    const keys = path.split('.');
    let result = this._currentState;
    
    for (const key of keys) {
      if (result === undefined || result === null) return undefined;
      result = result[key];
    }
    
    return deepClone(result);
  }
  
  // Update the state
  setState(updater, description = 'State update') {
    const prevState = deepClone(this._currentState);
    let newState;
    
    if (typeof updater === 'function') {
      newState = updater(deepClone(this._currentState));
    } else {
      newState = { ...deepClone(this._currentState), ...updater };
    }
    
    // Calculate patches
    const patches = StateDiffer.diff(this._currentState, newState);
    
    if (patches.length === 0) {
      if (this._debug) {
        console.log(`[${this._clientId}] No changes detected, state not updated`);
      }
      return this._currentState;
    }
    
    // Update the state
    this._currentState = newState;
    
    // Create a history entry
    const historyEntry = {
      id: generateId(),
      timestamp: getTimestamp(),
      description,
      patches,
      prevState,
      clientId: this._clientId
    };
    
    // Add to history or transaction
    if (this._transaction) {
      this._transaction.operations.push(historyEntry);
    } else {
      this._addToHistory(historyEntry);
      
      // Clear future history when a new change is made
      this._future = [];
      
      // Sync changes if enabled
      if (this._syncEnabled && this._wsClient) {
        this._syncChanges(historyEntry);
      }
    }
    
    if (this._debug) {
      console.log(`[${this._clientId}] ${description}:`);
      console.log('Patches:', patches);
      console.log('New state:', this._currentState);
    }
    
    // Notify listeners
    this._notifyListeners(prevState);
    
    return this._currentState;
  }
  
  // Subscribe to state changes
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    this._listeners.add(listener);
    
    // Return unsubscribe function
    return () => this.unsubscribe(listener);
  }
  
  // Unsubscribe from state changes
  unsubscribe(listener) {
    this._listeners.delete(listener);
  }
  
  // Undo the last change
  undo() {
    if (this._history.length === 0) {
      if (this._debug) {
        console.log(`[${this._clientId}] Nothing to undo`);
      }
      return false;
    }
    
    const lastEntry = this._history.pop();
    this._future.unshift(lastEntry);
    
    // Restore previous state
    this._currentState = deepClone(lastEntry.prevState);
    
    if (this._debug) {
      console.log(`[${this._clientId}] Undo: ${lastEntry.description}`);
      console.log('Restored state:', this._currentState);
    }
    
    // Notify listeners
    this._notifyListeners();
    
    return true;
  }
  
  // Redo the last undone change
  redo() {
    if (this._future.length === 0) {
      if (this._debug) {
        console.log(`[${this._clientId}] Nothing to redo`);
      }
      return false;
    }
    
    const nextEntry = this._future.shift();
    
    // Apply patches to current state
    this._currentState = StateDiffer.applyPatches(this._currentState, nextEntry.patches);
    
    // Add back to history
    this._history.push(nextEntry);
    
    if (this._debug) {
      console.log(`[${this._clientId}] Redo: ${nextEntry.description}`);
      console.log('New state:', this._currentState);
    }
    
    // Notify listeners
    this._notifyListeners();
    
    return true;
  }
  
  // Begin a transaction (for atomic operations)
  beginTransaction(description = 'Transaction') {
    if (this._transaction) {
      throw new Error('A transaction is already in progress');
    }
    
    this._transaction = {
      id: generateId(),
      description,
      startState: deepClone(this._currentState),
      operations: [],
      timestamp: getTimestamp()
    };
    
    if (this._debug) {
      console.log(`[${this._clientId}] Beginning transaction: ${description}`);
    }
    
    return this._transaction.id;
  }
  
  // Commit a transaction
  commitTransaction() {
    if (!this._transaction) {
      throw new Error('No transaction in progress');
    }
    
    const { description, startState, operations } = this._transaction;
    
    if (operations.length === 0) {
      if (this._debug) {
        console.log(`[${this._clientId}] Committing empty transaction: ${description}`);
      }
      this._transaction = null;
      return this._currentState;
    }
    
    // Create a combined history entry
    const combinedPatches = StateDiffer.diff(startState, this._currentState);
    
    const historyEntry = {
      id: this._transaction.id,
      timestamp: this._transaction.timestamp,
      description: `${description} (${operations.length} operations)`,
      patches: combinedPatches,
      prevState: startState,
      operations,
      clientId: this._clientId
    };
    
    // Add to history
    this._addToHistory(historyEntry);
    
    // Clear future history
    this._future = [];
    
    if (this._debug) {
      console.log(`[${this._clientId}] Committed transaction: ${description}`);
      console.log('Combined patches:', combinedPatches);
    }
    
    // Sync changes if enabled
    if (this._syncEnabled && this._wsClient) {
      this._syncChanges(historyEntry);
    }
    
    // Reset transaction
    this._transaction = null;
    
    return this._currentState;
  }
  
  // Rollback a transaction
  rollbackTransaction() {
    if (!this._transaction) {
      throw new Error('No transaction in progress');
    }
    
    // Restore the state to before the transaction
    this._currentState = deepClone(this._transaction.startState);
    
    if (this._debug) {
      console.log(`[${this._clientId}] Rolled back transaction: ${this._transaction.description}`);
      console.log('Restored state:', this._currentState);
    }
    
    // Reset transaction
    this._transaction = null;
    
    // Notify listeners
    this._notifyListeners();
    
    return this._currentState;
  }
  
  // Get history entries
  getHistory() {
    return deepClone(this._history);
  }
  
  // Time travel to a specific point in history
  timeTravel(historyIndex) {
    if (historyIndex < 0 || historyIndex >= this._history.length) {
      throw new Error(`Invalid history index: ${historyIndex}`);
    }
    
    // Get the state at the specified point
    let targetState;
    
    if (historyIndex === 0) {
      // First entry - use initial state
      targetState = deepClone(this._history[0].prevState);
    } else {
      // Apply all patches up to the specified index
      targetState = deepClone(this._history[0].prevState);
      
      for (let i = 0; i <= historyIndex; i++) {
        targetState = StateDiffer.applyPatches(targetState, this._history[i].patches);
      }
    }
    
    // Update current state
    this._currentState = targetState;
    
    if (this._debug) {
      console.log(`[${this._clientId}] Time traveled to index ${historyIndex}`);
      console.log('State at that point:', this._currentState);
    }
    
    // Notify listeners
    this._notifyListeners();
    
    return this._currentState;
  }
  
  // Helper method to add an entry to history
  _addToHistory(entry) {
    this._history.push(entry);
    
    // Limit history size
    if (this._history.length > this._maxHistorySize) {
      this._history.shift();
    }
  }
  
  // Helper method to notify all listeners
  _notifyListeners(prevState = null) {
    for (const listener of this._listeners) {
      listener(this._currentState, prevState || this._currentState);
    }
  }
  
  // Set up synchronization with other clients
  _setupSync() {
    if (!this._wsClient) return;
    
    // Listen for changes from other clients
    this._wsClient.addMessageListener(message => {
      if (message.clientId === this._clientId) return; // Ignore own messages
      
      if (message.type === 'STATE_UPDATE') {
        this._handleRemoteUpdate(message);
      }
    });
    
    if (this._debug) {
      console.log(`[${this._clientId}] Sync enabled`);
    }
  }
  
  // Sync changes to other clients
  _syncChanges(historyEntry) {
    if (!this._wsClient) return;
    
    const message = {
      type: 'STATE_UPDATE',
      clientId: this._clientId,
      historyEntry: {
        id: historyEntry.id,
        timestamp: historyEntry.timestamp,
        description: historyEntry.description,
        patches: historyEntry.patches,
        clientId: historyEntry.clientId
      }
    };
    
    this._wsClient.send(message);
  }
  
  // Handle updates from other clients
  _handleRemoteUpdate(message) {
    const { historyEntry } = message;
    
    if (this._debug) {
      console.log(`[${this._clientId}] Received update from ${historyEntry.clientId}: ${historyEntry.description}`);
    }
    
    // Check if we've already processed this update
    if (this._history.some(entry => entry.id === historyEntry.id)) {
      if (this._debug) {
        console.log(`[${this._clientId}] Update already applied, skipping`);
      }
      return;
    }
    
    // Apply patches to current state
    const prevState = deepClone(this._currentState);
    this._currentState = StateDiffer.applyPatches(this._currentState, historyEntry.patches);
    
    // Add to history
    this._addToHistory({
      ...historyEntry,
      prevState,
      remote: true
    });
    
    // Clear future history when a new remote change is applied
    this._future = [];
    
    if (this._debug) {
      console.log(`[${this._clientId}] Applied remote update`);
      console.log('New state:', this._currentState);
    }
    
    // Notify listeners
    this._notifyListeners(prevState);
  }
  
  // Resolve conflicts between local and remote changes
  _resolveConflicts(localChanges, remoteChanges) {
    // Simple last-write-wins strategy
    // A more sophisticated approach would merge changes or use operational transforms
    if (remoteChanges.timestamp > localChanges.timestamp) {
      return remoteChanges;
    }
    return localChanges;
  }
}

export default AdvancedStateManager;