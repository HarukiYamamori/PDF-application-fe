// 単語帳のリストを取得してプルダウンに追加する関数
async function fetchWordBooks() {
  try {
    const response = await fetch('http://18.182.13.89:8080/word-books'); // 単語帳を取得するAPI
    const wordBooks = await response.json();

    const select = document.getElementById('wordBookSelect');
    wordBooks.forEach(book => {
      const option = document.createElement('option');
      option.value = book;
      option.textContent = book;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching word books:', error);
  }
}

// 選択した単語帳に基づいてセクションを取得する関数
async function fetchSectionsForWordBook() {
  const wordBook = document.getElementById('wordBookSelect').value;
  const sectionContainer = document.getElementById('sectionCheckboxes');
  sectionContainer.innerHTML = ''; // 前のチェックボックスをクリア

  if (!wordBook) {
    sectionContainer.disabled = true;
    return;
  }

  try {
    const response = await fetch(`http://18.182.13.89:8080/test-options?wordBook=${encodeURIComponent(wordBook)}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const sectionWordCount = await response.json();

    // 全選択/全解除チェックボックスの追加
    const selectAllLabel = document.createElement('label');
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'selectAll';
    selectAllCheckbox.onclick = toggleSelectAll; // 全選択/全解除用の関数を追加
    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(document.createTextNode('全選択/全解除'));
    sectionContainer.appendChild(selectAllLabel);
    sectionContainer.appendChild(document.createElement('br')); // 改行

    // チェックボックスを生成
    for (const [section, count] of Object.entries(sectionWordCount)) {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = section;
      checkbox.name = 'sectionCheckBox';
      checkbox.classList.add('sectionCheckBox');
      checkbox.dataset.count = count; // 単語数をデータ属性に保存
      checkbox.onchange = change;

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(`${section}`));
      sectionContainer.appendChild(label);
      sectionContainer.appendChild(document.createElement('br')); // 改行
    }
    sectionContainer.disabled = false; // チェックボックス選択を有効化
  } catch (error) {
    console.error('Error fetching sections:', error);
  }
}

// 全選択/全解除のトグル関数
function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('.sectionCheckBox');
  checkboxes.forEach(checkbox => checkbox.checked = this.checked); // this.checkedの状態に応じて全て選択/解除
  change();
}

function change() {
  console.log('change func');

  const submitBtn = document.getElementById('selectSectionsButton');
  const checkBoxes = document.querySelectorAll('input[name="sectionCheckBox"]');
  const checkedBoxes = document.querySelectorAll('input[name="sectionCheckBox"]:checked');

  // ボタンの有効/無効状態の設定
  if (checkedBoxes.length === 0) {
    submitBtn.disabled = true;
  } else {
    submitBtn.disabled = false;
  }

  // 全選択チェックボックスの状態更新
  const selectAllCheckbox = document.getElementById('selectAll');
  selectAllCheckbox.checked = (checkBoxes.length === checkedBoxes.length);
}

function displayWordCountOptions() {
  const sectionCheckboxes = document.querySelectorAll('#sectionCheckboxes input[type="checkbox"][name]:checked');
  const wordCountInput = document.getElementById('wordCountInput');
  const errorMessage = document.getElementById('errorMessage');
  const maxWordCountDisplay = document.getElementById('maxWordCount');
  const wordCountSection = document.getElementById('wordCountSection'); // 新たに追加したdivを取得
  let totalWordCount = 0; // 単語数の合計を初期化

  // チェックされたセクションから単語数を取得
  sectionCheckboxes.forEach(checkbox => {
    const count = parseInt(checkbox.dataset.count);
    totalWordCount += count; // 単語数を合計
  });

  // 最大単語数を表示
  maxWordCountDisplay.textContent = totalWordCount;

  // 数値入力フィールドの値をクリア
  wordCountInput.value = '';
  errorMessage.style.display = 'none'; // エラーメッセージを隠す

  // 合計単語数に応じて入力フィールドを表示
  if (totalWordCount > 0) {
    wordCountSection.style.display = 'block'; // セクションが選択されたら表示
  } else {
    wordCountSection.style.display = 'none'; // 何も選択されていない場合は非表示
  }

  wordCountInput.disabled = totalWordCount === 0; // 合計が0の場合は入力フィールドを無効化

  // 入力フィールドの入力時にバリデーションを実施
  wordCountInput.addEventListener('input', function() {
    const value = parseInt(wordCountInput.value);

    // 最大値を超えた場合と数値以外が入力された場合のエラーメッセージを表示
    if (value > totalWordCount) {
      errorMessage.textContent = `最大値は ${totalWordCount} です。`;
      errorMessage.style.display = 'block';
    } else if (isNaN(value) || value < 1) {
      errorMessage.textContent = '1以上の数値を入力してください。';
      errorMessage.style.display = 'block';
    } else {
      errorMessage.style.display = 'none'; // エラーメッセージを隠す
    }
  });
}

// テストを生成するためのAPIを呼び出す関数
async function generateTest() {
  const wordBook = document.getElementById('wordBookSelect').value;
  const selectedSections = Array.from(document.querySelectorAll('#sectionCheckboxes input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value); // 選択されたセクションのリストを取得
  const wordNum = parseInt(document.getElementById('wordCountInput').value); // 出題数を取得

  // リクエストデータを作成
  const requestData = {
    word_book: wordBook,
    sections: selectedSections,
    word_num: wordNum,
  };

  try {
    const response = await fetch('http://18.182.13.89:8080/create-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // レスポンスがJSONの場合
    const data = await response.json();

    // PDF作成処理を呼び出し
    createPDF(data, wordBook);

  } catch (error) {
    console.error('Error generating test:', error);
    alert('テストの生成に失敗しました。');
  }
}

async function createPDF(data, wordBook) {
    const FONT_URL = 'https://h-yamamori.s3.ap-northeast-1.amazonaws.com/english.test.creator/font-file/ipaexg.ttf'; // フォントのURL
    const { PDFDocument, rgb } = PDFLib; // PDFLibのクラスをインポート
    const fontkit = window.fontkit;

    // 新しいPDFドキュメントを作成
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // フォントファイルを埋め込む
    const fontBytes = await (await fetch(FONT_URL)).arrayBuffer();
    const customFont = await pdfDoc.embedFont(fontBytes);

    // 共通設定
    const pageWidth = 600; // ページ幅
    const pageHeight = 800; // ページ高さ
    const margin = 50; // マージン
    const lineHeight = 30; // 行の高さ
    const fontSize = 12; // フォントサイズ
    const maxLineWidth = pageWidth - 2 * margin; // テキストの最大幅

    // 横幅をチェックして改行処理をする関数
    function splitTextToLines(text, maxWidth, font, fontSize) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const textWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (textWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // 問題用ページ
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin; // ページの最上部からスタート
    page.drawText(`問題　${wordBook}`, {
        x: margin,
        y: yPosition,
        size: fontSize + 4,
        font: customFont,
        color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight * 2;
    data.forEach((item, index) => {
        if (yPosition < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
        }

        const lines = splitTextToLines(item.word, maxLineWidth, customFont, fontSize);
        lines.forEach(line => {
            if (yPosition < margin) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPosition = pageHeight - margin;
            }

            page.drawText(`${index + 1}.  ${line}`, {
                x: margin,
                y: yPosition,
                size: fontSize,
                font: customFont,
                color: rgb(0, 0, 0),
            });
        });

        if (yPosition < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
        }

        // ここで改行を追加
        yPosition -= lineHeight; // 「＿＿＿＿＿」の前に余白を作る

        page.drawText('＿＿＿＿＿＿＿＿＿＿＿＿', {
            x: margin + 100,
            y: yPosition,
            size: fontSize,
            font: customFont,
            color: rgb(0, 0, 0),
        });

        yPosition -= lineHeight; // 「＿＿＿＿＿」の後にスペースを追加
    });

    // 解答用ページ
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    yPosition = pageHeight - margin;
    page.drawText(`解答　${wordBook}`, {
        x: margin,
        y: yPosition,
        size: fontSize + 4,
        font: customFont,
        color: rgb(0, 0, 0),
    });

    yPosition -= lineHeight * 2;
    data.forEach((item, index) => {
        if (yPosition < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
        }

        const answerText = `${index + 1}.  ${item.meaning} (${item.section} No.${item.wordNum})`;
        const lines = splitTextToLines(answerText, maxLineWidth, customFont, fontSize);

        lines.forEach(line => {
            if (yPosition < margin) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                yPosition = pageHeight - margin;
            }

            page.drawText(line, {
                x: margin,
                y: yPosition,
                size: fontSize,
                font: customFont,
                color: rgb(0, 0, 0),
            });

            yPosition -= lineHeight;
        });
    });

    // PDFのバイナリデータを作成してダウンロード
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${wordBook}.pdf`;
    link.click();
}



// ページが読み込まれたら単語帳を取得
document.addEventListener('DOMContentLoaded', fetchWordBooks);

// 単語帳が選択されたときにセクションを取得
document.getElementById('wordBookSelect').addEventListener('change', fetchSectionsForWordBook);

// 「選択」ボタンがクリックされた時に単語数の選択肢を表示
document.getElementById('selectSectionsButton').addEventListener('click', displayWordCountOptions);

// 出題数が入力された時点でボタンを表示し、テストを生成する
document.getElementById('wordCountInput').addEventListener('input', function() {
  const value = parseInt(this.value);
  const generateTestButton = document.getElementById('generateTestButton');
  generateTestButton.style.display = (value >= 1 && value <= parseInt(document.getElementById('maxWordCount').textContent)) ? 'block' : 'none'; // 条件を満たすとボタン表示
});

// テスト生成ボタンがクリックされたときのイベントリスナーを追加
document.getElementById('generateTestButton').addEventListener('click', generateTest);
