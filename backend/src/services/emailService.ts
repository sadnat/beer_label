import nodemailer from 'nodemailer';

// Check if SMTP is configured
export const isEmailConfigured = (): boolean => {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
};

// Create transporter only if configured
const createTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const transport = getTransporter();

  if (!transport) {
    console.log('SMTP not configured, skipping verification email');
    return false;
  }

  const appUrl = process.env.APP_URL || 'http://localhost';
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Vérifiez votre adresse email - Beer Label Editor',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .header h1 { color: #d97706; margin: 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .button {
              display: inline-block;
              background: #d97706;
              color: white !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Beer Label Editor</h1>
            </div>
            <div class="content">
              <h2>Bienvenue !</h2>
              <p>Merci de vous être inscrit sur Beer Label Editor.</p>
              <p>Pour activer votre compte et commencer à créer vos étiquettes de bière, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Vérifier mon email</a>
              </p>
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
              <p>Ce lien expire dans 24 heures.</p>
            </div>
            <div class="footer">
              <p>Si vous n'avez pas créé de compte, ignorez simplement cet email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Bienvenue sur Beer Label Editor !

Merci de vous être inscrit. Pour activer votre compte, veuillez vérifier votre adresse email en visitant ce lien :

${verificationUrl}

Ce lien expire dans 24 heures.

Si vous n'avez pas créé de compte, ignorez simplement cet email.
      `,
    });

    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<boolean> => {
  const transport = getTransporter();

  if (!transport) {
    console.log('SMTP not configured, skipping password reset email');
    return false;
  }

  const appUrl = process.env.APP_URL || 'http://localhost';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Réinitialisation de mot de passe - Beer Label Editor',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .header h1 { color: #d97706; margin: 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
            .button {
              display: inline-block;
              background: #d97706;
              color: white !important;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Beer Label Editor</h1>
            </div>
            <div class="content">
              <h2>Réinitialisation de mot de passe</h2>
              <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
              <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
              </p>
              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
              <p>Ce lien expire dans 1 heure.</p>
            </div>
            <div class="footer">
              <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Réinitialisation de mot de passe - Beer Label Editor

Vous avez demandé à réinitialiser votre mot de passe. Visitez ce lien pour choisir un nouveau mot de passe :

${resetUrl}

Ce lien expire dans 1 heure.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      `,
    });

    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};
