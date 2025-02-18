// Replace with your server URL and port
const socketUrl = 'http://localhost:3000';
const token = 'jwt';
const userId = 'userId';

const socket = io(socketUrl, {
  transports: ['websocket'],
  auth: {
    authorization: `Bearer ${token}`,
  },
});

socket.on('connect', () => {
  console.log('Connected to Socket server');
  socket.emit('messages', 'Hello, Socket server!');
  socket.emit('join', `USER::${userId}`);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket server');
});

socket.on('error', (error) => {
  console.error('Connection error:', error);
});

socket.on('ORDER_REQUEST', (data) => {
  console.log('ORDER_REQUEST', data);
});

socket.on('ORDER_RESULT', (data) => {
  console.log('ORDER_RESULT', data);
});
