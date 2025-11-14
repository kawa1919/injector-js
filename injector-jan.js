(function () {
  'use strict';

  // ★JANコードの入力欄（class="kb-lookup-search"）
  const PRODUCT_CODE_SELECTOR = 'input.kb-lookup-search';

  function init() {
    console.log('Injector JAN init start');

    const productCodeInput = document.querySelector(PRODUCT_CODE_SELECTOR);
    console.log('productCodeInput = ', productCodeInput);

    if (!productCodeInput) {
      // 見つからないときは何もしない（ログだけ）
      return;
    }

    // 既にボタンがあるなら再追加しない
    if (document.getElementById('inj-jan-scan-button')) {
      return;
    }

    // ボタン作成
    const btn = document.createElement('button');
    btn.id = 'inj-jan-scan-button';
    btn.type = 'button';
    btn.textContent = 'JAN読み取り';
    btn.style.marginLeft = '8px';
    btn.style.padding = '4px 8px';
    btn.style.fontSize = '13px';

    btn.addEventListener('click', function () {
      openScanner(productCodeInput);
    });

    // JANコード入力のすぐ後ろにボタンを追加
    productCodeInput.parentNode.insertBefore(btn, productCodeInput.nextSibling);

    console.log('JAN読み取りボタンを追加しました');
  }

  // DOMの状態に応じて init を呼び分け
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // すでにDOMが出来上がっている場合はこちら
    init();
  }

  // ==== ここから下はスキャナ処理（前に渡したものとほぼ同じ） ====

  function closeScanner(overlay, onDetected) {
    try {
      if (window.Quagga) {
        if (onDetected) Quagga.offDetected(onDetected);
        Quagga.stop();
      }
    } catch (e) { console.log(e); }

    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }

  function openScanner(productCodeInput) {
    if (!window.Quagga) {
      alert('QuaggaJS が読み込まれていません。');
      return;
    }

    let lastCode = null;

    const overlay = document.createElement('div');
    overlay.id = 'jan-scanner-overlay';
    overlay.style = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.7); z-index:9999;
      display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff;
    `;

    const container = document.createElement('div');
    container.style = `
      width:90%; max-width:480px; background:#222; padding:10px;
      border-radius:8px; box-sizing:border-box;
    `;

    const title = document.createElement('div');
    title.textContent = 'JANコードをスキャン';
    title.style = 'text-align:center; margin-bottom:8px; font-size:14px;';

    const scannerView = document.createElement('div');
    scannerView.id = 'jan-scanner-view';
    scannerView.style = `
      width:100%; height:60vh; max-height:360px; background:#000;
      position:relative; overflow:hidden;
    `;

    const resultLine = document.createElement('div');
    resultLine.style = 'margin-top:6px; font-size:13px;';
    resultLine.innerHTML = '読み取り: <span id="jan-result">（未読取）</span>';

    const buttonRow = document.createElement('div');
    buttonRow.style = 'display:flex; justify-content:space-between; margin-top:10px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.style = 'flex:1; margin-right:5px;';

    const okBtn = document.createElement('button');
    okBtn.textContent = 'セット';
    okBtn.style = 'flex:1; margin-left:5px;';

    buttonRow.append(cancelBtn, okBtn);
    container.append(title, scannerView, resultLine, buttonRow);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const onDetected = (result) => {
      if (!result?.codeResult?.code) return;

      const code = result.codeResult.code;

      if (!/^\d{8}$/.test(code) && !/^\d{13}$/.test(code)) return;

      lastCode = code;
      document.getElementById('jan-result').textContent = code;
    };

    Quagga.init({
      inputStream: {
        type: 'LiveStream',
        target: scannerView,
        constraints: { facingMode: 'environment' }
      },
      decoder: { readers: ['ean_reader'] },
      locate: true
    }, function (err) {
      if (err) {
        console.error(err);
        alert('カメラ起動に失敗しました。');
        closeScanner(overlay, onDetected);
        return;
      }
      Quagga.start();
      Quagga.onDetected(onDetected);
    });

    cancelBtn.onclick = () => closeScanner(overlay, onDetected);

    okBtn.onclick = () => {
      if (!lastCode) {
        alert('まだ読み取れていません');
        return;
      }
      productCodeInput.value = lastCode;
      closeScanner(overlay, onDetected);
    };
  }
})();
