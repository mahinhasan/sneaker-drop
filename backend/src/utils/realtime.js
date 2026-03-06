module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('client connected', socket.id);
    socket.on('disconnect', () => console.log('client disconnected', socket.id));
  });
};
