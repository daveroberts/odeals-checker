const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { mkdirp } = require("mkdirp");
const csv_parse = require("papaparse").parse;
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

let to_filename = (str) => str.replace(/[^a-z0-9]/gi, "");

let watchlist_txt = fs.readFileSync("watchlist.csv").toString();
let watchlist_rows = csv_parse(watchlist_txt).data;
watchlist = watchlist_rows.map((row) => {
  return {
    title: row[0],
    url: row[1],
    email_when_below: row[2],
    perform_check: parseInt(row[3]),
  };
});

(async function run() {
  console.log("Running report...");
  let now = new Date();
  try {
    await gather_prices();
  } catch (err) {
    await send_email(
      "Meta Quest error gathering prices",
      "There was an error when trying to gather prices"
    );
  }
})();

async function gather_prices() {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  let prices = {};
  for (let item of watchlist) {
    if (!item.perform_check) {
      continue;
    }
    let price = await gather_price(page, item);
    prices[item.title] = price;
  }
  await send_discount_email(prices);
  await browser.close();
}

async function record_price(title, price) {
  await mkdirp("history");
  let filepath = path.join("history", `${to_filename(title)}.csv`);
  fs.appendFileSync(filepath, `${new Date().toISOString()},${price}\n`);
}

async function send_discount_email(prices) {
  let items_to_alert = [];
  for (let title of Object.keys(prices)) {
    let price = prices[title];
    let item = watchlist.find((item) => item.title == title);
    if (parseFloat(price) < parseFloat(item.email_when_below)) {
      let threshold = item.email_when_below;
      items_to_alert.push({ item, price, threshold });
    }
  }
  if (items_to_alert.length > 0) {
    await send_email(
      "Meta Quest deals found",
      items_to_alert
        .map(
          (struct) =>
            `Title: ${struct.item.title}, Price: $${struct.price} (below $${struct.threshold})`
        )
        .join("\n")
    );
  } else {
    await send_email("Meta Quest - No deals found", "Better luck tomorrow");
  }
}

async function gather_price(page, item) {
  console.log(`Trying to gather price for ${item.title}`);
  await page.goto(item.url, { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, WAIT_SECONDS * 1000));
  let price = await page.evaluate(() => {
    let txt = document.documentElement.innerHTML;
    let price_matches = txt.matchAll(
      /<span[\sa-z="0-9]+>\$(\d+\.\d+)<\/span>/g
    );
    let prices = [];
    for (let price_match of price_matches) {
      if (price_match[0] == "$0.00") {
        continue;
      }
      prices.push(price_match[1]);
    }
    if (prices.length == 0) {
      throw new Error("Could not find a price");
    }
    return prices[prices.length - 1];
  });
  record_price(item.title, price);
  console.log(`${item.title} is $${price}`);
  if (parseFloat(price) < parseFloat(item.email_when_below)) {
    console.log(`Price is below threshold! ($${item.email_when_below})`);
  }
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
