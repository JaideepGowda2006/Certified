const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer, corsOrigins = []) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => io;

const emitCertificateEvent = (type, data) => {
  if (!io) {
    return;
  }

  const payload = {
    ...data,
    certificate: data,
    type,
    certificateId: data?.certificateId,
  };

  // Specific event, e.g. certificate:created, certificate:updated, certificate:revoked, certificate:deleted
  io.emit(`certificate:${type}`, payload);

  // General activity broadcast event
  io.emit('certificate:activity', {
    type,
    certificateId: data?.certificateId,
    title: data?.certificateTitle,
    candidateName: data?.candidateName,
    timestamp: new Date().toISOString(),
    data,
  });
};

module.exports = {
  initSocket,
  getIO,
  emitCertificateEvent,
};
