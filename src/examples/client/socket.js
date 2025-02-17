// Replace with your server URL and port
const socketUrl = 'http://localhost:3000';
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjYyOTE1MjU4IiwidXNlck5hbWUiOiJ0aGFuaGx0dCIsImRpc3BsYXlOYW1lIjoiSnVzdGluIiwiaWFwIjpudWxsLCJpYXQiOjE3Mzg2NjE0OTgsImV4cCI6MTc0MTI1MzQ5OH0.PAwHc95AYwD8FFAeiyPFqadONdhglgACkiOuHuCulSE';
const userId = '1262915258';

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
