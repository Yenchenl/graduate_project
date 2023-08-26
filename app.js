const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');
const mysql = require('mysql');
const qrcode = require('qrcode');
const { spawn } = require('child_process')
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const server = http.Server(app);
const wss = new WebSocket.Server({ server });
let randomCode;
let webuuid;

//Linepay add start---
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// var linepayRouter = require('./routes/LinePay_index');
// var lineusersRouter = require('./routes/LinePay_users');

// 資料庫用qrcode_status欄位order_id 六位數流水號
let currentSerialNumber = 0;
let user_id;
let user_email;
let user_name;
let order_id;

// 宣告一個全局變數，用來存儲 WebSocket 連接對象
let wsConnection;

wss.on('connection', (ws) => {
  ws.id = uuidv4();   // 客戶端連線時，即 給定一個 uuid
  console.log('新的客戶端已連線，ID：' + ws.id);
  wsConnection = ws; // 將連接對象存儲在全局變數中
  ws.on('message', (message) => {
    message = message.toString();
    console.log(`收到來自 ${ws.id} 的訊息：${message}`);

    if (message.startsWith('goToNewPage:')) {
      var targetId = message.split(':')[1];
      console.log("收到的處理完的targetId[1]為:" + targetId + " -> 已跳轉至新的頁面")

      wss.clients.forEach((client) => {
        if (client.id === targetId) {
          client.send('goToNewPage');

        }
      });
    }
  });

  ws.send('歡迎使用我們的伺服器，你的 ID 是 ' + ws.id);
});
// end連線websocket //

// view engine setup
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
// app.set('views', path.join(__dirname, 'views'));


//解決本來無法呈現css的問題//
app.use(express.static(__dirname + '/public', {
  setHeaders: function (res, path, stat) {
    if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
  }
}));
//解決本來無法呈現css的問題//

//Linepay add app.use
// app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use('/indexlinePay', linepayRouter);
// app.use('/users', lineusersRouter);
// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// linepay add end---


const mariadb = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  // user: 'aicsac',
  password: 'password',
  // password: '123456',
  database: 'aicsbox',
  port: '3306',
});

mariadb.connect((err) => {
  if (err) {
    console.error('錯誤連線至 MySQL database:', err);
  } else {
    console.log('成功連線至 MySQL database');
  }
});

// 連接資料庫 //
// const connection = mysql.createConnection({
//   // host: '192.168.0.117',
//   host: '192.168.0.117',
//   user: 'mariadbuser1',
//   password: 'qimezOFeMInewoY24i5ELi81jIVOrI',
//   database: 'aicsbox',
// });

// // 建立連線
// connection.connect((err) => {
//   if (err) {
//     console.error('無法連線到資料庫：', err);
//     return;
//   }
//   console.log('已成功連線到資料庫！');
// });
// 連接資料庫 //


//PAGE start//
app.get('/', function (req, res) {
  res.render('index', { title: 'Index', active: 'index' });
});

app.get('/about', function (req, res) {
  res.render('about', { title: 'About', active: 'about' });
});

app.get('/service', function (req, res) {
  res.render('service', { title: 'Service', active: 'service' });
});

app.get('/service_2', function (req, res) {
  res.render('service_2', { title: 'Service_2', active: 'service_2' });
});

app.get('/product', function (req, res) {
  res.render('product', { title: 'Product', active: 'product' });
});

app.get('/contact', function (req, res) {
  res.render('contact', { title: 'Contact', active: 'contact' });
});

app.get('/schedule', function (req, res) {
  res.render('schedule', { title: 'Schedule', active: 'schedule' });
});

app.get('/faq', function (req, res) {
  res.render('faq', { title: 'Faq', active: 'faq' });
});

app.get('/privacypolicy', function (req, res) {
  res.render('privacypolicy', { title: 'Privacypolicy', active: 'privacypolicy' });
});



app.get('/schedulecomplete', function (req, res) {
  res.render('schedulecomplete', { title: 'Schedulecomplete', active: 'schedulecomplete' });
});

app.get('/test', function (req, res) {
  res.render('test', { title: 'Test', active: 'test' });
});
/* Line login 暫時用不到
app.get('/login', function(req, res) {
  res.render('login', { title: 'Login', active: 'login' });
});
*/

//Line Pay 



//end of Line Payment


// 讀取傳回值
// 使用 bodyParser 中間件來解析 URL-encoded 請求
app.use(bodyParser.urlencoded({ extended: true }));

// 設定 Line Bot 的相關資訊
const client_id = "1661489480"; // 請填入您的 Line Bot 客戶端 ID
const client_secret = "f2aae745f05db0c0e085e2e0d54fecac"; // 請填入您的 Line Bot 客戶端密鑰
const redirect_uri = "http://localhost:3000/callback"; // 請根據您的設定修改此 URL

// 當用戶訪問 /authorize 路徑時，將其重定向到 Line 授權頁面
app.get('/authorize', (req, res) => {
  const scope = "openid%20profile%20email";
  const state = "123456789"; // 用於防止 CSRF 攻擊的狀態值

  const auth_url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${scope}&bot_prompt=normal&state=${state}`;
  res.redirect(auth_url);
});


//CS櫃頁面//
app.get('/QRcodepage', function (req, res) {
  res.render('QRcodepage', { title: 'QRcodepage', active: 'QRcodepage' });
});

//LINE加入會員頁面
app.get('/LINEmember', (req, res) => {
  const { qrcodetext, webuuid, brand, series, type,material, shoePrice, price } = req.query;
  res.render('LINEmember', {
    title: 'LINEmember',
    active: 'linemember',
    qrcodetext,
    webuuid,
    brand,
    series,
    type,
    material,
    shoePrice,
    price,
  });
});


// 訂單確認頁面
app.get('/OrderConfirmation', function (req, res) {
  res.render('OrderConfirmation', { title: 'OrderConfirmation', active: 'OrderConfirmation' });
})

// 步進馬達測試頁面
app.get('/stepperMotorTest', function (req, res) {
  res.render('stepperMotorTest', { title: 'Stepper Motor Test', active: 'stepperMotorTest' });
});
let shoeDataArray;
app.get('/CS_showprice', function (req, res) {
  // 取得參數值
  const arrResultParam = req.query.arr_result;
  // const {
  //   brand,
  //   series,
  //   material,
  //   shoePrice,
  //   price,
  // } = req.query;
  // 將參數值轉換成陣列
  const dataArray = arrResultParam ? arrResultParam.split('\n') : [];
  shoeDataArray = dataArray;
  // console.log(arr_result + brand + series + material + shoePrice + price);
  // 將 dataArray 傳遞給模板引擎，以供在 CS_showprice 頁面中使用
  res.render('CS_showprice', {
    title: 'CS_showprice', active: 'CS_showprice',
    DataArray: dataArray,
    // webuuid: webuuid,
    // Brand: brand,
    // Series: series,
    // Material: material,
    // ShoePrice: shoePrice,
    // Price: price
  });
});


app.get('/CS_joinline', function (req, res) {
  const { qrcodetext, webuuid, brand, series, type, material, shoePrice, price } = req.query;
  res.render('CS_joinline',
    {
      title: 'CS_joinline',
      active: 'CS_joinline',
      qrcodetext,
      webuuid,
      brand,
      series,
      type,
      material,
      shoePrice,
      price,
    });
});

app.get('/ordercomplete', function (req, res) {
  res.render('ordercomplete', { title: 'Ordercomplete', active: 'ordercomplete' });
});

app.get('/CS_start', function (req, res) {
  res.render('CS_start', { title: 'CS_start', active: 'CS_start' });
});

app.get('/CS_tryagain', function (req, res) {
  res.render('CS_tryagain', { title: 'CS_tryagain', active: 'CS_tryagain' });
});

app.get('/CS_identifying', function (req, res) {
  res.render('CS_identifying', { title: 'CS_identifying', active: 'CS_identifying' });
});

// 當 Line 授權頁面完成授權並導回 /callback 路徑時，處理授權碼
app.get('/callback', (req, res) => {
  const authorization_code = req.query.code; // 獲取"code"參數

  // 執行 Python 程式碼，將授權碼當作參數傳遞給 Python 檔案
  const pythonProcess = spawn('python', ['line_official/script.py', encodeURIComponent(authorization_code)]);

  // 監聽 Python 程式碼的輸出
  pythonProcess.stdout.on('data', (data) => {
    // 在這裡處理 Python 程式碼的輸出，例如印出回應或其他操作
    const decodedData = decodeURIComponent(data.toString());
    // 使用 split 方法將資料分割成陣列，並存放到不同的變數中
    const userDataArray = decodedData.split(',');
    user_id = userDataArray[0];
    user_email = userDataArray[1];
    user_name = userDataArray[2];
    const url = '/CS_linepay?'
      + 'qrcodetext=' + randomCode
      + '&webuuid=' + webuuid
      + '&brand=' + encodeURIComponent(shoeDataArray[0])
      + '&series=' + encodeURIComponent(shoeDataArray[1])
      + '&type=' + encodeURIComponent(shoeDataArray[2])
      + '&material=' + encodeURIComponent(shoeDataArray[3])
      + '&shoePrice=' + encodeURIComponent(shoeDataArray[4])
      + '&price=' + encodeURIComponent(shoeDataArray[5])
      + '&user_id=' + user_id
      + '&user_email=' + user_email
      + '&user_name=' + user_name; // 使用 req.query.qrcode 作為參數值

    // 輸出結果
    console.log("用戶ID：" + user_id + '\n' + "用戶Email：" + user_email + '\n' + "用戶姓名：" + user_name + '\n');
    // 導回到前端頁面或其他處理
    generateOrder_id();
    res.redirect(url);
  });


});
//PAGE end//




// QR code 生成 start//
app.get('/generateQRCode', (req, res) => {
  randomCode = generateRandomCode(6);
  webuuid = wsConnection.id;
  const url = 'http://127.0.0.1:3000/CS_joinline?'
    + 'qrcodetext=' + randomCode
    + '&webuuid=' + webuuid
    + '&brand=' + encodeURIComponent(shoeDataArray[0])
    + '&series=' + encodeURIComponent(shoeDataArray[1])
    + '&type=' + encodeURIComponent(shoeDataArray[2])
    + '&material=' + encodeURIComponent(shoeDataArray[3])
    + '&shoePrice=' + encodeURIComponent(shoeDataArray[4])
    + '&price=' + encodeURIComponent(shoeDataArray[5]); // 使用 req.query.qrcode 作為參數值
  const qrCodeFileName = randomCode + '.png';
  const qrCodeFilePath = path.join(__dirname, 'public', 'qrcode', qrCodeFileName);

  qrcode.toFile(qrCodeFilePath, url, { width: 350, height: 350 }, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.send(qrCodeFileName);
    }
  });
});

// QRcodepage掃描完成並按下送出之後的頁面
app.get('/newPage', (req, res) => {
  const brand = shoeDataArray[0];
  const series = shoeDataArray[1];
  const type = shoeDataArray[2];
  const material = shoeDataArray[3];
  const shoePrice = shoeDataArray[4];
  const price = shoeDataArray[5];
  res.render('confirmationAccess', {
    title: 'confirmationAccess',
    active: 'confirmationAccess',
    brand: brand,
    series: series,
    type: type,
    material: material,
    shoePrice: shoePrice,
    price: price,
    user_id: user_id,
    user_email: user_email,
    user_name: user_name
  });
});

app.get('/formconfirmation', function (req, res) {
  const brand = shoeDataArray[0];
  const series = shoeDataArray[1];
  const type = shoeDataArray[2];
  const material = shoeDataArray[3];
  const shoePrice = shoeDataArray[4];
  const price = shoeDataArray[5];
  res.render('formconfirmation', {
    title: 'Formconfirmation',
    active: 'formconfirmation',
    brand: brand,
    series: series,
    type:type,
    material: material,
    shoePrice: shoePrice,
    price: price,
    user_id: user_id,
    user_email: user_email,
    user_name: user_name
  });
});

function generateRandomCode(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

function generateOrder_id(req) {
  const now = new Date(); // 獲取現在時間
  const year = now.getFullYear(); // 獲取年份（例如：2023）
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 獲取月份（注意要+1，並補0）
  const date = String(now.getDate()).padStart(2, '0'); // 獲取日期（補0）
  const hours = String(now.getHours()).padStart(2, '0'); // 獲取小時（補0）
  const minutes = String(now.getMinutes()).padStart(2, '0'); // 獲取分鐘（補0）

  const formattedTimestamp = `${year}${month}${date}${hours}${minutes}`;

  // 生成六位數的流水號
  // 注意：這只是一個簡單示例，實際應用中，流水號的生成可能需要更複雜的邏輯
  // 這裡假設當前流水號不超過 999999，如果超過需做額外處理
  currentSerialNumber += 1;
  const serialNumber = currentSerialNumber.toString().padStart(6, '0');

  // 將各部分組合成 order_id
  order_id = `ORDER${formattedTimestamp}${serialNumber}`;
}
// QR code 生成 end//
let status;
app.post('/saveQRCode2db', (req, res) => {
  const { code } = req.body;
  generateOrder_id();
  status = 0;
  const query = 'INSERT INTO qrcode_status (qrcode_id, status, order_id) VALUES (?, ?, ?)';

  mariadb.query(query, [code, status, order_id], (err, result) => {
    if (err) {
      console.error('Error saving QR Code code to database:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.sendStatus(200);
    }
  });
});

app.get('/CS_linepay', function (req, res) {
  let { qrcodetext, webuuid, brand, series, type, material, shoePrice, price, user_id, user_email, user_name } = req.query;
  console.log("已取得order_id為" + order_id);
  res.render('CS_linepay', {
    title: 'CS_linepay',
    active: 'CS_linepay',
    qrcodetext,
    webuuid,
    brand,
    series,
    type,
    material,
    shoePrice,
    price,
    user_id,
    user_email,
    user_name,
    order_id: order_id
  });
});



// Schedule 表單上傳 //
app.use(bodyParser.json());

const multer = require('multer');
var storage = multer.diskStorage({
  destination: 'schedule/',
  filename: function (req, file, callback) {
    callback(null, 'schedule.json');
  }
});
var upload = multer({ storage: storage }).none();

app.post('/schedulecomplete', function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      return console.log(err);
    }

    const data = req.body;

    try {
      fs.writeFileSync('schedule/' + req.body.phone.slice(-5) + '_' + req.body['DEL-date'] + '.json', JSON.stringify(data));
      console.log('Schedule saved to file');
    } catch (err) {
      console.log('儲存錯誤 ' + req.body.name + '.json');
    }
    res.redirect('/schedulecomplete');
  });
});

// 估價上傳影片 //
const videoStorage = multer.diskStorage({
  destination: 'uploads',
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});

// const { spawn } = require('child_process');
const videoUpload = multer({ storage: videoStorage }).single('fileUpload');

app.post('/upload', function (req, res) {
  videoUpload(req, res, function (err) {
    if (err) {
      return res.send(file.originalname + '檔案上傳失敗');
    }
    // 暫時避免跳轉，跳轉會Cli端檔案上傳失敗導致Ser端死掉
    // res.redirect('/schedulecomplete');

    // 呼叫 Python 腳本進行影片運算
    const videoPath = req.file.path;
    const pythonProcess = spawn('python', ['WebFeatures/CLIP_Classification/video2text.py', videoPath]);
    let result = '';
    // const allResults = []; // 用于存储每次的结果

    // 監聽 Python 腳本的輸出
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
      // console.log(data.toString())
      // result = data.toString();
      // allResults.push(result); // 将结果存储到数组中
    });

    // 監聽 Python 腳本的錯誤訊息
    pythonProcess.stderr.on('data', (data) => {
      console.error('Python錯誤:', data.toString());
      res.status(500).send('影片運算錯誤');
    });

    // 等待 Python 腳本執行完成
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.send(result);
        // res.send(allResults); // 将所有结果一次性返回给客户端
      }
    });
  });
});
// 估價上傳影片 //

//Contact Send email//

app.get('/sendMSG', (req, res) => {
  var nodemailer = require('nodemailer');
  //宣告發信物件
  var tp = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'ezbreezyservice@gmail.com',
      pass: 'fewazjndlvpjfesk'
    }
  });
  var options = {
    to: req.query.email, //收件者
    cc: 'a109221065@mail.shu.edu.tw',		//副本寄回給客服
    subject: '已收到您的諮詢-' + req.query.subject, 	// 主旨req.query.subject
    /*html: '<h2>Hello ' +req.query.name+',</h2> <br>just let you know - we have received your message! <br><p>"'+ //嵌入 html 的內文
       req.query.message+'"</p>', */
    html: '<h4>哈囉' + req.query.name + '：</h4><p>我們已經收到您的諮詢，客服人員將會盡快回覆您，請隨時注意信箱！</p><p></p> <h5>Best Regards,<br><br> EasyBreezy</h5>'

  };

  //發送信件方法
  tp.sendMail(options, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(' 訊息發送: ' + info.response);
    }
  });
  res.render('sendMSG', req.query);

})
//Send email//

//啟動伺服器//
// app.listen(3000, function () {
//   console.log('Server started on port 3000.');
//   console.log('Use this link to open the website: http://localhost:3000/');
// });

const port = 3000;

// 加入arduino //
server.listen(port, () => {
  console.log('伺服器已啟動，請在瀏覽器中訪問 http://localhost:' + port);
});
module.exports = app;