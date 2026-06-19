const jwt = require('jsonwebtoken');
const Docker = require('dockerode');
const LabSession = require('../models/LabSession');

const docker = new Docker();

function setupLabWebSocket(app) {
  app.ws('/api/labs/:labId/terminal', async (ws, req) => {
    try {
      const token = req.query.token;
      if (!token) { ws.close(4001, 'No token'); return; }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const session = await LabSession.findOne({
        user: decoded.userId,
        lab: req.params.labId,
        status: 'running'
      });

      if (!session?.containerId) {
        ws.close(4004, 'No active session');
        return;
      }

      const container = docker.getContainer(session.containerId);
      const exec = await container.exec({
        Cmd: ['/bin/bash'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true
      });

      const stream = await exec.start({ hijack: true, stdin: true });

      stream.on('data', (chunk) => {
        if (ws.readyState === 1) ws.send(chunk.toString('utf8'));
      });

      ws.on('message', (msg) => {
        stream.write(msg);
      });

      ws.on('close', () => stream.destroy());
      stream.on('end', () => ws.close());
    } catch (err) {
      console.error('WS terminal error:', err.message);
      ws.close(1011, 'Terminal error');
    }
  });
}

module.exports = { setupLabWebSocket };
