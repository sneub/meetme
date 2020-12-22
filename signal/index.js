const httpServer = require('http').createServer();
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 8090;

io.on('connection', socket => {
  console.log(`[${socket.id}] New session`)
});

io.on('connect', socket => {
  socket.join('room')

  socket.emit('ready', {sid: socket.id})

  socket.on('data', data => {
    const bytes = JSON.stringify(data).length
    console.log(`[${socket.id}] Message: ${data.type} (${bytes} bytes)`)
    socket.to('room').emit('data', data)
  })
})

httpServer.listen(PORT);