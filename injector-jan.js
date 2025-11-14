(function () {
  'use strict';

  // JANコードの入力欄（class="kb-lookup-search"）
  var PRODUCT_CODE_SELECTOR = 'input.kb-lookup-search';

  // ---- ボタン設置処理（ポーリングで監視） ----
  function attachButtonIfReady() {
    var productCodeInput = document.querySelector(PRODUCT_CODE_SELECTOR);
    if (!productCodeInput) {
      // まだフォームが描画されていない
      return false;
    }

    // 既にボタンがあれば何もしない
    if (document.getElementById('inj-jan-scan-button')) {
      return true;
    }

    // デバッグ用（開発ツールのコンソールで確認できます）
    console.log('JANコード入力欄を発見、ボタンを追加します', productCodeInput);

    // ボタン作成
    var btn = document.createElement('button');
    btn.id = 'inj-jan-scan-button';
    btn.type = 'button';
    btn.textContent = 'JAN読み取り';
    btn.style.marginLeft = '8px';
    btn.style.padding = '4px 8px';
    btn.style.fontSize = '13px';

    btn.addEventListener('click', function () {
      openScanner(productCodeInput);
    });

    // 入力欄の直後にボタンを追加
    
    // 親要素を flex にして横並びにする
    var wrapper = productCodeInput.parentNode;
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';

    // 入力欄を伸ばす（自然な配置）
    productCodeInput.style.flex = '1';

    // ボタンを右側に付ける
    btn.style.marginLeft = '8px';
    wrapper.insertBefore(btn, productCodeInput.nextSibling);


    return true;
  }

  // ページ読み込み直後から 500ms ごとにチェック
  var timerId = setInterval(function () {
    var done = attachButtonIfReady();
    if (done) {
      clearInterval(timerId);
    }
  }, 500);

  // 一応、すぐにも一回試す
  attachButtonIfReady();


  // ---- ここから下はバーコードスキャナ処理 ----

  function closeScanner(overlay, onDetected) {
    try {
      if (window.Quagga) {
        if (onDetected) {
          Quagga.offDetected(onDetected);
        }
        Quagga.stop();
      }
    } catch (e) {
      console.log(e);
    }
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  function openScanner(productCodeInput) {
    if (!window.Quagga) {
      alert('QuaggaJS が読み込まれていません。');
      return;
    }
    if (!productCodeInput) {
      alert('商品コード入力欄が見つかりません。');
      return;
    }

    var lastCode = null;

    var overlay = document.createElement('div');
    overlay.id = 'jan-scanner-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = '#fff';

    var container = document.createElement('div');
    container.style.width = '90%';
    container.style.maxWidth = '480px';
    container.style.backgroundColor = '#222';
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.boxSizing = 'border-box';

    var title = document.createElement('div');
    title.textContent = 'JANコードをスキャン';
    title.style.textAlign = 'center';
    title.style.marginBottom = '8px';
    title.style.fontSize = '14px';

    var scannerView = document.createElement('div');
    scannerView.id = 'jan-scanner-view';
    scannerView.style.width = '100%';
    scannerView.style.height = '60vh';
    scannerView.style.maxHeight = '360px';
    scannerView.style.position = 'relative';
    scannerView.style.overflow = 'hidden';
    scannerView.style.backgroundColor = '#000';

    var resultLine = document.createElement('div');
    resultLine.style.marginTop = '6px';
    resultLine.style.fontSize = '13px';
    resultLine.innerHTML = '読み取り: <span id="jan-result">（未読取）</span>';

    var buttonRow = document.createElement('div');
    buttonRow.style.display = 'flex';
    buttonRow.style.justifyContent = 'space-between';
    buttonRow.style.marginTop = '10px';

    var cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.style.flex = '1';
    cancelBtn.style.marginRight = '5px';

    var okBtn = document.createElement('button');
    okBtn.textContent = 'セット';
    okBtn.style.flex = '1';
    okBtn.style.marginLeft = '5px';

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(okBtn);

    container.appendChild(title);
    container.appendChild(scannerView);
    container.appendChild(resultLine);
    container.appendChild(buttonRow);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    var onDetected = function (result) {
      if (!result || !result.codeResult || !result.codeResult.code) {
        return;
      }
      var code = result.codeResult.code;

      // JANコード（8桁 or 13桁）
      if (!/^\d{8}$/.test(code) && !/^\d{13}$/.test(code)) {
        return;
      }
      lastCode = code;
      var resultSpan = document.getElementById('jan-result');
      if (resultSpan) {
        resultSpan.textContent = code;
      }
    };

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerView,
        constraints: {
          facingMode: 'environment'
        }
      },
      decoder: {
        readers: ['ean_reader']
      },
      locate: true
    }, function (err) {
      if (err) {
        console.error(err);
        alert('カメラ起動に失敗しました。ブラウザのカメラ許可やHTTPS接続を確認してください。');
        closeScanner(overlay, onDetected);
        return;
      }
      Quagga.start();
      Quagga.onDetected(onDetected);
    });

    cancelBtn.onclick = function () {
      closeScanner(overlay, onDetected);
    };

    okBtn.onclick = function () {
      if (!lastCode) {
        alert('まだ読み取れていません');
        return;
      }
      productCodeInput.value = lastCode;
      closeScanner(overlay, onDetected);
    };
  }

})();

