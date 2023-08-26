const express = require('express');
const axios = require('axios');
const hmacSHA256 = require('crypto-js/hmac-sha256');
const Base64 = require('crypto-js/enc-base64');

const router = express.Router();
// const sampleOrders = require('../sample/sampleData');
require('dotenv').config();

// 環境變數
const {
  LINEPAY_CHANNEL_ID,
  LINEPAY_RETURN_HOST,
  LINEPAY_SITE,
  LINEPAY_VERSION,
  LINEPAY_CHANNEL_SECRET_KEY,
  LINEPAY_RETURN_CONFIRM_URL,
  LINEPAY_RETURN_CANCEL_URL,
} = process.env;

const orders = {};

// ------------------------------
const mysql = require('mysql');
// 創建 SQL 連接
const connection = mysql.createConnection({
  host: '127.0.0.1',
  // host: '192.168.0.179',
  user: 'mariadbuser1',
  password: 'qimezOFeMInewoY24i5ELi81jIVOrI',
  database: 'shoes',
  port: '3306',
});
// 連接到資料庫
connection.connect();

// 執行查詢語句
connection.query('SELECT * FROM testData', (error, results, fields) => {
  if (error) {
    console.error(error);
  } else {
    // 將SQL查詢結果轉換為JSON格式
    // const orders = {};

    for (const row of results) {
      const orderId = row.id;
      orders[orderId] = {
        amount: row.amount,
        currency: "TWD",
        packages: [
          {
            id: row.package_id,
            amount: row.package_amount,
            products: [
              {
                name: row.product_name,
                quantity: row.product_quantity,
                price: row.product_price
              }
            ]
          }
        ]
      };
    }

    // 輸出JSON格式的資料
    console.log(JSON.stringify(orders, null, 2));
  }
});

// 關閉資料庫連接
// connection.end();
//--------------------------




router
  .get('/', function (req, res, next) {
    res.render('LinePay_index', { title: 'Express' });
  })
  .get('/checkout/:id', (req, res) => {
    const { id } = req.params;
    const order = JSON.parse(JSON.stringify(orders[id]));
    order.orderId = parseInt(new Date().getTime() / 1000);
    orders[order.orderId] = order;

    res.render('LinePay_checkout', { order });
  })
  .get('/success/:id', (req, res) => {
    const { id } = req.params;
    const order = orders[id];

    // res.render('LinePay_success', { order });
    res.render('ordercomplete', { title: 'ordercomplete', active: 'ordercomplete', order });
  })

router
  .post('/linePay/:orderNo', async (req, res) => {
    const { orderNo } = req.params;
    const order = orders[orderNo];

    try {
      // 建立 LINE Pay 請求規定的資料格式
      const linePayBody = createLinePayBody(order);

      // CreateSignature 建立加密內容
      const uri = '/payments/request';
      const headers = createSignature(uri, linePayBody);

      // API 位址
      const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
      const linePayRes = await axios.post(url, linePayBody, { headers });

      // 請求成功...
      if (linePayRes?.data?.returnCode === '0000') {
        res.redirect(linePayRes?.data?.info.paymentUrl.web);
      } else {
        res.status(400).send({
          message: '訂單不存在',
        });
      }
    } catch (error) {
      // 各種運行錯誤的狀態：可進行任何的錯誤處理
      console.log(error);
      res.end();
    }
  })
  .get('/linePay/confirm', async (req, res) => {
    const { transactionId, orderId } = req.query;
    const order = orders[orderId];

    try {
      // 建立 LINE Pay 請求規定的資料格式
      const uri = `/payments/${transactionId}/confirm`;
      const linePayBody = {
        amount: order.amount,
        currency: 'TWD',
      }

      // CreateSignature 建立加密內容
      const headers = createSignature(uri, linePayBody);

      // API 位址
      const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
      const linePayRes = await axios.post(url, linePayBody, { headers });
      console.log(linePayRes);

      // 請求成功...
      if (linePayRes?.data?.returnCode === '0000') {
        res.redirect(`/indexLinepay/success/${orderId}`)
        // res.redirect(`/success/${orderId}`)
      } else {
        res.status(400).send({
          message: linePayRes,
        });
      }
    } catch (error) {
      console.log(error);
      // 各種運行錯誤的狀態：可進行任何的錯誤處理
      res.end();
    }
  });

function createLinePayBody(order) {
  return {
    ...order,
    currency: 'TWD',
    redirectUrls: {
      confirmUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CONFIRM_URL}`,
      cancelUrl: `${LINEPAY_RETURN_HOST}${LINEPAY_RETURN_CANCEL_URL}`,
    },
  };
}

function createSignature(uri, linePayBody) {
  const nonce = new Date().getTime();
  const encrypt = hmacSHA256(
    `${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(
      linePayBody,
    )}${nonce}`,
    LINEPAY_CHANNEL_SECRET_KEY,
  );
  const signature = Base64.stringify(encrypt);

  const headers = {
    'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
    'Content-Type': 'application/json',
    'X-LINE-Authorization-Nonce': nonce,
    'X-LINE-Authorization': signature,
  };
  return headers;
}

module.exports = router;
