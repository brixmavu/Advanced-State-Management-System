// Mock WebSocket for demonstration purposes
class MockWebSocketServer {
  constructor() {
    this.clients = new Set();
    this.messageHandlers = [];
  }
  
  connect(client) {
    this.clients.add(client);
    client.server = this;
    console.log(`Client connected: ${client.id}`);
    return () => {
      this.clients.delete(client);
      console.log(`Client disconnected: ${client.id}`);
    };
  }
  
  broadcast(senderId, message) {
    console.log(`Broadcasting from ${senderId}:`, message);
    for (const client of this.clients) {
      if (client.id !== senderId) {
        client.onMessage(message);
      }
    }
  }
  
  onMessage(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
}

class MockWebSocketClient {
  constructor(id) {
    this.id = id;
    this.server = null;
    this.messageHandlers = [];
  }
  
  send(message) {
    if (this.server) {
      this.server.broadcast(this.id, message);
    }
  }
  
  onMessage(message) {
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }
  
  addMessageListener(handler) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }
}

export { MockWebSocketServer, MockWebSocketClient };