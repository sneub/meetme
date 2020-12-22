const httpServer = require('http').createServer()
const io = require('socket.io')(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

const PORT = process.env.PORT || 8090

const sessionRoomMap = {}

io.on('connection', socket => {
  console.log(`[${socket.id}] New session`)
})

io.on('connect', socket => {
  socket.emit('hello', socket.id)

  socket.on('meetingid', meetingId => {
    console.log(`[${socket.id}] Join meeting room: ${meetingId}`)
    socket.join(meetingId)
    sessionRoomMap[socket.id] = meetingId
    socket.emit('ready', meetingId)
  })

  socket.on('data', data => {
    if (! socket.id in sessionRoomMap) {
      throw Error('Bad handshake. Must join meeting room before sending data.')
    }

    const bytes = JSON.stringify(data).length
    console.log(`[${socket.id}] Message: ${data.type} (${bytes} bytes)`)
    socket.to(sessionRoomMap[socket.id]).emit('data', data)
  })

  // TODO: clean up sessionRoomMap on disconnect (otherwise memory leak)
})

httpServer.listen(PORT)