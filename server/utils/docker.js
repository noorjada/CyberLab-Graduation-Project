const Docker = require('dockerode');

const docker = new Docker();

const startLabContainer = async (dockerImage, sessionId) => {
  try {
    // Pull image if not exists
    await new Promise((resolve, reject) => {
      docker.pull(dockerImage, (err, stream) => {
        if (err) {
          console.log('Image already exists or pull failed, trying to use local');
          resolve();
          return;
        }
        docker.modem.followProgress(stream, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    // Create container
    const container = await docker.createContainer({
      Image: dockerImage,
      name: `cyberlab-${sessionId}`,
      Tty: true,
      OpenStdin: true,
      User: '1000:1000',
      ExposedPorts: { '80/tcp': {}, '22/tcp': {} },
      HostConfig: {
        PortBindings: {
          '80/tcp': [{ HostPort: '0' }],
          '22/tcp': [{ HostPort: '0' }]
        },
        Memory: 512 * 1024 * 1024,
        MemorySwap: 512 * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000,
        PidsLimit: 100,
        NetworkMode: 'bridge',
        ReadonlyRootfs: false,
        CapDrop: ['ALL'],
        CapAdd: ['CHOWN', 'DAC_OVERRIDE', 'SETGID', 'SETUID', 'NET_BIND_SERVICE'],
        SecurityOpt: ['no-new-privileges'],
        AutoRemove: false
      },
      Labels: {
        'cyberlab': 'true',
        'session': sessionId
      }
    });

    await container.start();

    // Get assigned ports
    const info = await container.inspect();
    const ports = info.NetworkSettings.Ports;
    const httpPort = ports['80/tcp']?.[0]?.HostPort;
    const sshPort = ports['22/tcp']?.[0]?.HostPort;

    return {
      containerId: container.id,
      httpPort: httpPort ? parseInt(httpPort) : null,
      sshPort: sshPort ? parseInt(sshPort) : null
    };
  } catch (err) {
    console.error('Docker error:', err);
    throw err;
  }
};

const stopLabContainer = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 5 });
    await container.remove();
    console.log(`Container ${containerId} stopped and removed`);
  } catch (err) {
    console.error('Error stopping container:', err);
  }
};

const execInContainer = async (containerId, command) => {
  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ['/bin/bash', '-c', command],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await exec.start({ hijack: true, stdin: true });

    return new Promise((resolve, reject) => {
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString('utf8').replace(/[\x00-\x08\x0b-\x1f\x7f]/g, '');
      });
      stream.on('end', () => resolve(output));
      stream.on('error', reject);
      setTimeout(() => resolve(output), 5000);
    });
  } catch (err) {
    console.error('Exec error:', err);
    throw err;
  }
};

const getContainerStatus = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    return info.State.Status;
  } catch (err) {
    return 'stopped';
  }
};

const cleanupExpiredSessions = async () => {
  try {
    const LabSession = require('../models/LabSession');
    const expired = await LabSession.find({
      status: 'running',
      expiresAt: { $lt: new Date() }
    });

    for (const session of expired) {
      if (session.containerId) {
        await stopLabContainer(session.containerId).catch(() => {});
      }
      session.status = 'stopped';
      await session.save();
    }

    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired lab session(s)`);
    }
  } catch (err) {
    console.error('Session cleanup error:', err);
  }
};

module.exports = {
  startLabContainer,
  stopLabContainer,
  execInContainer,
  getContainerStatus,
  cleanupExpiredSessions
};