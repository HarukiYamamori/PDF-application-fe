document.getElementById('pdfForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const userInput = document.getElementById('userInput').value;
  if (!userInput) {
    document.getElementById('message').textContent = '入力テキストを入力してください。';
    return;
  }

  const requestBody = { userInput };

  try {
    const response = await fetch('http://localhost:8080/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated.pdf';
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      document.getElementById('message').textContent = 'PDF生成に失敗しました。';
    }
  } catch (error) {
    document.getElementById('message').textContent = 'エラーが発生しました。';
    console.error(error);
  }
});

