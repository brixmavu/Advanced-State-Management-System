import { deepClone } from '../src/utils/utils.js';
import { MockWebSocketServer, MockWebSocketClient } from '../src/mock/MockWebSocket.js';
import AdvancedStateManager from '../src/manager/AdvancedStateManager.js';

// Demo: Create a mock WebSocket server and clients
const server = new MockWebSocketServer();

// Create two clients
const client1 = new MockWebSocketClient('client1');
const client2 = new MockWebSocketClient('client2');

// Connect clients to server
server.connect(client1);
server.connect(client2);

// Create state managers for each client
const manager1 = new AdvancedStateManager(
  {
    form: {
      title: 'Customer Survey',
      questions: [
        { id: 'q1', text: 'How satisfied are you with our service?', type: 'rating' },
        { id: 'q2', text: 'Would you recommend us to a friend?', type: 'boolean' }
      ],
      settings: {
        allowAnonymous: true,
        notifyOnSubmit: false
      }
    },
    responses: []
  },
  {
    clientId: 'client1',
    sync: true,
    wsClient: client1,
    debug: true,
    maxHistorySize: 20
  }
);

const manager2 = new AdvancedStateManager(
  {
    form: {
      title: 'Customer Survey',
      questions: [
        { id: 'q1', text: 'How satisfied are you with our service?', type: 'rating' },
        { id: 'q2', text: 'Would you recommend us to a friend?', type: 'boolean' }
      ],
      settings: {
        allowAnonymous: true,
        notifyOnSubmit: false
      }
    },
    responses: []
  },
  {
    clientId: 'client2',
    sync: true,
    wsClient: client2,
    debug: true,
    maxHistorySize: 20
  }
);

// Subscribe to changes
manager1.subscribe((newState) => {
  console.log('[client1] State updated:', newState.form.title);
});

manager2.subscribe((newState) => {
  console.log('[client2] State updated:', newState.form.title);
});

// Demo: Undo/Redo functionality
console.log('\n--- Undo/Redo Demo ---\n');

// Make some changes
manager1.setState(state => {
  const newState = deepClone(state);
  newState.form.title = 'Customer Feedback Form';
  return newState;
}, 'Update form title');

manager1.setState(state => {
  const newState = deepClone(state);
  newState.form.questions.push({
    id: 'q3',
    text: 'Any additional comments?',
    type: 'text'
  });
  return newState;
}, 'Add new question');

// Undo the last change
console.log('\nUndoing last change...');
manager1.undo();

// Redo the change
console.log('\nRedoing the change...');
manager1.redo();

// Demo: Transactions
console.log('\n--- Transaction Demo ---\n');

// Start a transaction
manager1.beginTransaction('Update form settings');

// Make multiple changes in the transaction
manager1.setState(state => {
  const newState = deepClone(state);
  newState.form.settings.allowAnonymous = false;
  return newState;
}, 'Disable anonymous responses');

manager1.setState(state => {
  const newState = deepClone(state);
  newState.form.settings.notifyOnSubmit = true;
  return newState;
}, 'Enable notifications');

// Commit the transaction
manager1.commitTransaction();

// Demo: Synchronization between clients
console.log('\n--- Synchronization Demo ---\n');

// Client 2 makes a change
manager2.setState(state => {
  const newState = deepClone(state);
  newState.form.title = 'Customer Experience Survey';
  return newState;
}, 'Update form title on client 2');

// Wait a moment to see the sync
setTimeout(() => {
  console.log('\nClient 1 state after sync:');
  console.log('Form title:', manager1.getState('form.title'));
  
  // Client 1 makes another change
  manager1.setState(state => {
    const newState = deepClone(state);
    newState.form.questions[0].text = 'How would you rate our customer service?';
    return newState;
  }, 'Update question text on client 1');
  
  // Wait to see the sync back to client 2
  setTimeout(() => {
    console.log('\nClient 2 state after sync:');
    console.log('Question 1 text:', manager2.getState('form.questions.0.text'));
    
    // Demo: Time Travel
    console.log('\n--- Time Travel Demo ---\n');
    
    console.log('History entries for client 1:', manager1.getHistory().length);
    
    // Travel back to an earlier state
    console.log('\nTime traveling to index 1...');
    manager1.timeTravel(1);
    
    console.log('Form title after time travel:', manager1.getState('form.title'));
    console.log('Questions count after time travel:', manager1.getState('form.questions').length);
    
    console.log('\nDemo complete!');
  }, 100);
}, 100);