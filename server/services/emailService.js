import nodemailer from 'nodemailer';

export const sendEmailAlert = async ({ to, subject, text }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('Mock email sent:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    return { success: true, mock: true };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  await transporter.sendMail({
    from: emailUser,
    to,
    subject,
    text
  });

  return { success: true, mock: false };
};
