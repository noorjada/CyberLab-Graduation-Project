const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendPasswordResetEmail = async (email, resetToken, username) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🔐 CyberLab Password Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #0a0e1a; color: #e0e0e0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 2rem; }
          .header { text-align: center; padding: 2rem 0; border-bottom: 1px solid #1f6feb; }
          .header h1 { color: #58a6ff; font-size: 1.8rem; margin: 0; }
          .content { padding: 2rem 0; }
          .content p { color: #c9d1d9; line-height: 1.6; }
          .btn { display: inline-block; background: #1f6feb; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-size: 1rem; margin: 1rem 0; }
          .warning { background: #2d1a00; border: 1px solid #f0c04040; border-radius: 8px; padding: 1rem; color: #f0c040; font-size: 0.85rem; margin-top: 1rem; }
          .footer { text-align: center; padding: 1rem 0; border-top: 1px solid #21262d; color: #8b949e; font-size: 0.82rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ CyberLab</h1>
            <p style="color: #8b949e;">Cybersecurity Training Platform</p>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>,</p>
            <p>We received a request to reset your CyberLab password. Click the button below to set a new password:</p>
            <a href="${resetUrl}" class="btn">🔐 Reset My Password</a>
            <p>Or copy this link into your browser:</p>
            <p style="color: #58a6ff; word-break: break-all;">${resetUrl}</p>
            <div class="warning">
              ⚠️ This link expires in <strong>10 minutes</strong>. If you didn't request a password reset, please ignore this email — your account is safe.
            </div>
          </div>
          <div class="footer">
            <p>CyberLab — Learn. Hack. Defend.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, username, verifyToken = null) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🛡️ Welcome to CyberLab!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #0a0e1a; color: #e0e0e0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 2rem; }
          .header { text-align: center; padding: 2rem 0; border-bottom: 1px solid #1f6feb; }
          .header h1 { color: #58a6ff; font-size: 1.8rem; margin: 0; }
          .content { padding: 2rem 0; }
          .content p { color: #c9d1d9; line-height: 1.6; }
          .feature { background: #0d1117; border: 1px solid #21262d; border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
          .feature h4 { color: #58a6ff; margin: 0 0 0.3rem 0; }
          .feature p { color: #8b949e; margin: 0; font-size: 0.85rem; }
          .btn { display: inline-block; background: #1f6feb; color: white; padding: 1rem 2rem; border-radius: 8px; text-decoration: none; font-size: 1rem; margin: 1rem 0; }
          .footer { text-align: center; padding: 1rem 0; border-top: 1px solid #21262d; color: #8b949e; font-size: 0.82rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ CyberLab</h1>
            <p style="color: #8b949e;">Welcome to your cybersecurity journey!</p>
          </div>
          <div class="content">
            <p>Hi <strong>${username}</strong>! 👋</p>
            <p>Welcome to CyberLab! You're about to start an amazing cybersecurity learning journey. Here's what you can do:</p>
            <div class="feature">
              <h4>🚩 CTF Challenges</h4>
              <p>Solve real-world security challenges and earn points</p>
            </div>
            <div class="feature">
              <h4>🗺️ Learning Roadmap</h4>
              <p>Follow structured paths from beginner to advanced</p>
            </div>
            <div class="feature">
              <h4>💻 Linux Terminal</h4>
              <p>Practice Linux commands in a safe environment</p>
            </div>
            <div class="feature">
              <h4>🔥 Daily Challenges</h4>
              <p>Solve daily challenges and build your streak</p>
            </div>
            <div class="feature">
              <h4>🤖 AI Mentor</h4>
              <p>Get hints and guidance from CyberBot</p>
            </div>
            ${verifyToken ? `
            <div style="background: #1a2d1a; border: 1px solid #3fb95040; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
              <p style="color: #3fb950; margin: 0 0 0.5rem 0;">✅ Please verify your email to get started:</p>
              <a href="${process.env.CLIENT_URL}/verify-email/${verifyToken}" class="btn" style="background: #238636;">✅ Verify My Email</a>
            </div>
            ` : `
            <a href="${process.env.CLIENT_URL}/dashboard" class="btn">🚀 Start Hacking</a>
            `}
          </div>
          <div class="footer">
            <p>CyberLab — Learn. Hack. Defend.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendDigestEmail = async (user, stats) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '📬 Your CyberLab Weekly Digest',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:2rem;background:#0d1117;color:#c9d1d9;">
        <h1 style="color:#58a6ff;">🛡️ CyberLab Weekly Digest</h1>
        <p>Hey ${user.username}!</p>
        <ul>
          <li>⚡ Your XP: <strong>${user.xp || 0}</strong></li>
          <li>🏆 Points: <strong>${user.points || 0}</strong></li>
          <li>🔥 Streak: <strong>${user.dailyStreak || 0} days</strong></li>
          <li>🚩 New challenges this week: <strong>${stats.newChallenges || 0}</strong></li>
        </ul>
        <p><a href="${process.env.CLIENT_URL}/daily" style="color:#58a6ff;">Solve today's daily challenge →</a></p>
        <p style="color:#8b949e;font-size:0.85rem;">Disable digests in your profile settings.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, sendDigestEmail };