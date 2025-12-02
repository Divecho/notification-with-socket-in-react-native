// server.js
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws'; // ✅ Use named import for ESM

// Create Express app
const app = express();
const PORT = 4000;

// Middleware to parse JSON
app.use(express.json());

// In-memory notification store
let notifications = [];

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Broadcast function to send data to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // 1 = WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// POST /notifications - add a notification
app.post('/notifications', (req, res) => {
  const { title, message, userId, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message required' });
  }

  const newNotification = { title, message, userId, type, id: Date.now() };
  notifications.push(newNotification);
  console.log("📬 Dummy Notification Received:", newNotification);

  // Broadcast to WebSocket clients
  broadcast({ type: 'new_notification', notification: newNotification });

  res.status(200).json({ success: true, message: 'Notification received successfully' });
});

// POST /push - manual push notification
app.post('/push', (req, res) => {
  const { title, message, userId, type } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message required' });
  }

  const manualNotification = { title, message, userId, type, id: Date.now() };
  notifications.push(manualNotification);

  // Broadcast to WebSocket clients
  broadcast({ type: 'new_notification', notification: manualNotification });

  res.status(200).json({ success: true, message: 'Notification pushed successfully' });
});

// GET /notifications - get notifications after certain ID (timestamp)
app.get('/notifications', (req, res) => {
  const since = parseInt(req.query.since || 0, 10);
  const newNotifications = notifications.filter(n => n.id > since);
  res.json(newNotifications);
});

// Function to send automatic notification every second
function sendNotificationEverySecond() {
  setInterval(() => {
    const notification = {
      title: "Auto Notification",
      message: `Message sent at ${new Date().toLocaleTimeString()}`,
      userId: "auto",
      type: "info",
      id: Date.now(),
    };

    notifications.push(notification);

    // Broadcast to WebSocket clients
    broadcast({ type: 'new_notification', notification });

    // Log to console
    console.log("Sent auto notification:", notification);
  }, 1000); // every 1 second
}

// Start HTTP server and WebSocket
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Start sending auto notifications every second
  sendNotificationEverySecond();
});
