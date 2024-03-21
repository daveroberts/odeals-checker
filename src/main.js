require('dotenv').config()
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOSTNAME,
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD
  }
});

const DAY_SUNDAY = 0;
const DAY_WEDNESDAY = 3;
const DAY_THURSDAY = 4;
const DAY_SATURDAY = 6;
const HOUR_6AM = 10;
const HOUR_12PM = 16;
const HOUR_6PM = 22;

(async function run() {
  console.log('Running report...');
  let now = new Date()
  let day_of_month = now.getDate()
  let day_of_week = now.getDay()
  let hour = now.getHours()
  if (day_of_week == DAY_SUNDAY && hour == HOUR_6PM){ await send_email("Task: Take out trash") }
  if (day_of_week == DAY_WEDNESDAY && hour == HOUR_6PM){ await send_email("Task: Take out trash") }
  if (day_of_month == 28 && hour == HOUR_6AM){ await send_email("Task: Pay Citi CC Bill") }
  if (day_of_week == DAY_THURSDAY && hour == HOUR_12PM){ await send_email("Task: Epic Games free game of the week") }
  if (day_of_week == DAY_SATURDAY && hour == HOUR_12PM){ await send_email("Task: Download Kindercare Pictures") }
})();

async function send_email(subject){
  await transporter.sendMail({
    from: process.env.SMTP_USERNAME,
    to: process.env.SMTP_USERNAME,
    subject: subject,
    text: ''
  });
}