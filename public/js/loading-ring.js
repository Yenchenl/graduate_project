

// 顯示 loading 畫面的函式
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'flex';
}

// 隱藏 loading 畫面的函式
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.style.display = 'none';
}
let ARRRESULT = '';
// 執行大量運算的函式，假設是一個耗時的計算
function performHeavyCalculation() {
    var fileInput = document.getElementById('environment');
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('fileUpload', file);

    return fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => response.text())
        .then(result => {
            const arrResult = result.split('\n');
            ARRRESULT = result;
            for (let i = 0; i < arrResult.length; i++) {
                // console.log(result[i]);
                // document.getElementById(`result${i+1}`).innerText = result[i];
                document.getElementById(`result${i}`).innerText = arrResult[i];
            }
            console.log(arrResult);
            localStorage.setItem('ARRRESULT', JSON.stringify(ARRRESULT));
        })
        .catch(error => {
            console.error('運算錯誤:', error);
        });
}

// 綁定按鈕點擊事件
const calculateButton = document.getElementById('processVideo-button');
calculateButton.addEventListener('click', () => {


    // 顯示 loading 畫面
    showLoading();

    // 開始大量運算
    performHeavyCalculation()
        .then(result => {
            // 運算完成後隱藏 loading 畫面
            hideLoading();
            console.log("arr_result:" + ARRRESULT[0]);
            // 跳轉至下一個頁面
            const redirectToURL = `/CS_showprice?arr_result=${encodeURIComponent(ARRRESULT)}`;
            window.location.href = redirectToURL;
        })
        .catch(error => {
            // 運算發生錯誤時也要隱藏 loading 畫面
            hideLoading();
            console.error(error);
        });
});
