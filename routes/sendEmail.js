const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "dallin.bergstrom91@ethereal.email",
      pass: "1EuAzmbc3gKTtS6tMd",
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Ananth Joshi" <ananthp0508@gmail.com>', // sender address
    to: options.email, // list of receivers
    subject: "Reset password", // Subject line
    html: `<p>Please reset your password  <a href=${options.resetLink}>from this link.</a> </p>`, // html body
  });

  console.log("Message sent: %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};

module.exports = sendEmail;
