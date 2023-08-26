function generateQRCode() {
    var previousQRCode = document.getElementById("qrcode").firstChild;
    if (previousQRCode) {
        document.getElementById("qrcode").removeChild(previousQRCode);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/generateQRCode', true);

    xhr.onload = function () {
        if (xhr.status === 200) {
            var qrCodeName = xhr.responseText;

            var qrCodeImage = new Image();
            qrCodeImage.src = 'qrcode/' + qrCodeName;

            var codeValue = qrCodeName.slice(0, -4); // 去除檔案副檔名 ".png"
            // saveQRCodeToDatabase(codeValue); // 儲存 QR Code 編碼到資料庫



            document.getElementById("qrcode").appendChild(qrCodeImage);
        }
    };

    xhr.send();
}

function saveQRCodeToDatabase(code) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/saveQRCode2db', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
        if (xhr.status === 200) {
            console.log('QRcode已儲存於qrcode資料表code中');
        }
    };

    var data = {
        code: code
    }

    xhr.send(JSON.stringify(data));
}