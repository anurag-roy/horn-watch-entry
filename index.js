require("dotenv").config();
const path = require("path");
const cors = require("cors");
const express = require("express");
const app = express();
const mapperRouter = require("./mapper");
const KiteConnect = require("kiteconnect").KiteConnect;
const KiteTicker = require("kiteconnect").KiteTicker;

const apiKey = process.env.API_KEY;
const accessToken = process.env.ACCESS_TOKEN;

const kc = new KiteConnect({
  api_key: apiKey,
});
kc.setAccessToken(accessToken);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "build")));

app.use("/mapper", mapperRouter);

// Order function
const order = (stock, price) => {
  const timestamp = new Date();
  console.log(
    `Order placed for ${stock.exchange}:${stock.tradingsymbol}, Transaction: ${stock.transactionType}, product: ${stock.product}, quantity: ${stock.quantity}, price: ${price}`,
  );
  console.log(`Time of order: ${timestamp.toUTCString()}`);
};

app.post("/watchHornEntry", ({ body }, response) => {
  watchHornEntry(body.stockA, body.stockB, body.stockC, body.stockD, Number(body.entryPrice));
  response.send("Check console.");
});

const watchHornEntry = (stockA, stockB, stockC, stockD, entryPrice) => {
  // Extract instruments tokens for each stock
  const aToken = parseInt(stockA.instrument_token);
  const bToken = parseInt(stockB.instrument_token);
  const cToken = parseInt(stockC.instrument_token);
  const dToken = parseInt(stockD.instrument_token);

  // Extract quantity for each stock
  const aQty = stockA.quantity;
  const bQty = stockB.quantity;
  const cQty = stockC.quantity;
  const dQty = stockD.quantity;

  // Declare variables which will be updated on each tick
  let aBuyersBid, bSellersBid, cSellersBid, dBuyersBid;

  // Flag to determine if order is already placed or not
  let placedOrder = false;

  // Entry Condition for HORN strategy
  const lookForEntry = () => {
    const a = aBuyersBid * aQty;
    const b = bSellersBid * bQty;
    const c = cSellersBid * cQty;
    const d = dBuyersBid * dQty;

    const net = (a - b - c + d) / 75;

    if (net > entryPrice) {
      console.log(
        `Net: ${net}, Entry Price: ${entryPrice}. Condition satisfied. Would have entered.`,
      );
      return true;
    }

    console.log(`Net: ${net}, Entry Price: ${entryPrice}. Condition not satisfied.`);
    return false;
  };

  const ticker = new KiteTicker({
    api_key: apiKey,
    access_token: accessToken,
  });

  ticker.connect();

  ticker.on("connect", () => {
    // console.log("Subscribing to stocks...");
    const items = [aToken, bToken, cToken, dToken];
    ticker.subscribe(items);
    ticker.setMode(ticker.modeFull, items);
  });

  ticker.on("ticks", (ticks) => {
    if (!placedOrder) {
      // Check tick and update corresponding stock bid price
      // 2nd Seller's Bud for stock to BUY
      // 2nd Buyer's Bid for stock to SELL
      ticks.forEach((t) => {
        if (t.instrument_token == aToken) {
          if (t.depth) {
            if (t.depth.buy) {
              aBuyersBid = t.depth.buy[1].price;
            }
          }
        } else if (t.instrument_token == bToken) {
          if (t.depth) {
            if (t.depth.sell) {
              bSellersBid = t.depth.sell[1].price;
            }
          }
        } else if (t.instrument_token == cToken) {
          if (t.depth) {
            if (t.depth.sell) {
              cSellersBid = t.depth.sell[1].price;
            }
          }
        } else if (t.instrument_token == dToken) {
          if (t.depth) {
            if (t.depth.buy) {
              dBuyersBid = t.depth.buy[1].price;
            }
          }
        }
      });

      // Look for Entry
      if (lookForEntry()) {
        placedOrder = true;
        order(stockA, aBuyersBid);
        order(stockB, bSellersBid);
        order(stockC, cSellersBid);
        order(stockD, dBuyersBid);
      }
    } else if (placedOrder) {
      ticker.disconnect();
    }
  });
};

app.listen(4001, () => {
  console.log("Horn Entry Watch started on http://localhost:4001");
});
