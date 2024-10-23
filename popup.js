let content1 = '';
let content2 = '';
let selecting = false; // 选择进行中的标志

// 引入语言
let lang = navigator.language.startsWith('zh') ? 'zh' : 'en';
let translations = {};

// 加载语言文件
fetch(`locales/${lang}.json`)
    .then(response => response.json())
    .then(data => {
        translations = data;
        applyTranslations();
    });

// 应用国际化文本
function applyTranslations() {
    document.querySelector('h1').textContent = translations.title;
    document.getElementById('selectContent1').textContent = translations.selectContent1;
    document.getElementById('selectContent2').textContent = translations.selectContent2;
    document.getElementById('clearContent').textContent = translations.clearContent;
    document.getElementById('compareContent').textContent = translations.compareContent;
}

// 初始化内容
chrome.storage.local.get(['selectedElement1', 'selectedElement2'], function (result) {
    content1 = result.selectedElement1 || '';
    content2 = result.selectedElement2 || '';
    updateButtonColors();
});

// 选择内容1
document.getElementById('selectContent1').onclick = function () {
    selectContent('content1', 'selectContent1');
};

// 选择内容2
document.getElementById('selectContent2').onclick = function () {
    selectContent('content2', 'selectContent2');
};

// 执行选择内容的函数
function selectContent(contentType, buttonId) {
    if (selecting) return; // 避免重复选择
    selecting = true;

    const button = document.getElementById(buttonId);
    button.disabled = true; // 禁用按钮
    button.style.backgroundColor = '#d3d3d3'; // 置灰效果

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ['content.js']
        }, () => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelect', contentType });
        });
    });
}

// 清除内容按钮事件
document.getElementById('clearContent').onclick = function () {
    content1 = '';
    content2 = '';
    selecting = false; // 重置选择标志
    chrome.storage.local.remove(['selectedElement1', 'selectedElement2'], () => {
        resetButtonColors();
        alert('内容已清除');
    });
};

// 重置按钮颜色
function resetButtonColors() {
    selecting = false; // 允许再次选择
    document.getElementById('selectContent1').disabled = false; // 启用按钮
    document.getElementById('selectContent1').style.backgroundColor = 'green';
    document.getElementById('selectContent2').disabled = false; // 启用按钮
    document.getElementById('selectContent2').style.backgroundColor = 'green';
}

// 更新按钮颜色
function updateButtonColors() {
    if (content1) {
        document.getElementById('selectContent1').style.backgroundColor = 'blue';
        document.getElementById('selectContent1').disabled = false; // 启用按钮
    }
    if (content2) {
        document.getElementById('selectContent2').style.backgroundColor = 'blue';
        document.getElementById('selectContent2').disabled = false; // 启用按钮
    }
}

// 对比内容按钮事件
document.getElementById('compareContent').onclick = function () {
    if (!content1 || !content2) {
        alert("请先选择两个内容进行对比！");
        return;
    }

    let diffHtml = new HtmlDiff();
    let { oldDiffHtml, newDiffHtml } = diffHtml.diff_launch(content1.html, content2.html);
    showComparisonPopup(oldDiffHtml, newDiffHtml);
};

// 显示对比结果的弹窗
function showComparisonPopup(oldDiffHtml, newDiffHtml) {
    const comparisonWindow = window.open("", "Comparison", "width=800,height=600");
    comparisonWindow.document.body.innerHTML = ''; 
    comparisonWindow.document.write(`
        <html lang="${lang}">
        <head>
            <title>${translations.comparisonTitle}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #ffffff;
                    color: #333;
                    margin: 20px;
                }
                h2 {
                    text-align: center;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    font-size: 14px;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                    color: #333;
                }
                ins {
                    background-color: #e6ffe6;
                    color: green;
                }
                del {
                    background-color: #ffe6e6;
                    color: red;
                }
            </style>
        </head>
        <body>
            <h2>${translations.comparisonTitle}</h2>
            <table>
                <thead>
                    <tr>
                        <th>${translations.selectContent1}</th>
                        <th>${translations.selectContent2}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${oldDiffHtml}</td>
                        <td>${newDiffHtml}</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
    `);
}
