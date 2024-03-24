const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { mkdirp } = require("mkdirp");
require("dotenv").config();
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOSTNAME,
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

const WAIT_SECONDS = 10;
const DAY_SUNDAY = 0;
const DAY_WEDNESDAY = 3;
const DAY_THURSDAY = 4;
const DAY_SATURDAY = 6;
const HOUR_6AM = 10;
const HOUR_12PM = 16;
const HOUR_6PM = 22;

let watchlist_txt = fs.readFileSync("watchlist.csv").toString();
let watchlist_rows = watchlist_txt.split("\n").map((line) => line.split(","));
watchlist = watchlist_rows.map((row) => {
  return {
    title: row[0],
    url: row[1],
    email_when_below: row[2],
  };
});

(async function run() {
  console.log("Running report...");
  let now = new Date();
  let day_of_month = now.getDate();
  let day_of_week = now.getDay();
  let hour = now.getHours();
  //await send_email("This is a test email");
  await gather_prices();
})();

async function gather_prices() {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  let prices = {};
  for (let item of watchlist) {
    let price = await gather_price(page, item);
    prices[item.title] = price;
    //await new Promise((r) => setTimeout(r, 10 * 1000));
  }
  await record_prices(prices);
  await send_discount_email(prices);
  await browser.close();
}

async function record_prices(prices) {
  let keys = Object.keys(prices);
  for (let title of Object.keys(prices)) {
    let price = prices[title];
    await mkdirp("history");
    let filepath = path.join("history", `${title}.csv`);
    fs.appendFileSync(filepath, `${new Date().toISOString()},${price}\n`);
  }
}

async function send_discount_email(prices) {
  let items_to_alert = [];
  for (let title of Object.keys(prices)) {
    let price = prices[title];
    let item = watchlist.find((item) => item.title == title);
    if (parseFloat(price) < parseFloat(item.email_when_below)) {
      items_to_alert.push({ item, price });
    }
  }
  if (items_to_alert.length > 0) {
    await send_email(
      "Meta Quest deals found",
      items_to_alert
        .map((struct) => `Title: ${struct.item.title}, Price: ${struct.price}`)
        .join("\n")
    );
  }
}

async function gather_price(page, item) {
  console.log(`Trying to gather price for ${item.title}`);
  await page.goto(item.url, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, WAIT_SECONDS * 1000));
  let price = await page.evaluate(() => {
    let price_boxes = document.getElementsByClassName("app-purchase-price");
    let prices = Array.from(price_boxes).map((pb) => pb.innerText);
    prices = prices.filter((p) => p.startsWith("$"));
    prices = prices.map((p) => p.substring(1));
    prices = [...new Set(prices)];
    if (prices.length == 0) {
      throw new Error(`No price found`);
    }
    return prices[0];
  });
  console.log(`${item.title} is $${price}`);
  return price;
}

async function send_email(subject, text = "") {
  await transporter.sendMail({
    from: process.env.SMTP_USERNAME,
    to: process.env.SMTP_USERNAME,
    subject: subject,
    text: text,
  });
}
