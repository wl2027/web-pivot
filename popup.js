let content1 = '';
let content2 = '';

let lang = navigator.language.startsWith('zh') ? 'zh' : 'en'; // 检测浏览器语言
let translations = {};

// 加载语言文件
fetch(`locales/${lang}.json`)
    .then(response => response.json())
    .then(data => {
        translations = data;
        applyTranslations(); // 应用语言
    });

// 应用国际化文本
function applyTranslations() {
    document.querySelector('h1').textContent = translations.title;
    document.getElementById('selectContent1').textContent = translations.selectContent1;
    document.getElementById('selectContent2').textContent = translations.selectContent2;
    document.getElementById('clearContent').textContent = translations.clearContent;
    document.getElementById('compareContent').textContent = translations.compareContent;
}

// 初始化时获取存储的选择内容
chrome.storage.local.get(['selectedElement1', 'selectedElement2'], function (result) {
    content1 = result.selectedElement1 || '';
    content2 = result.selectedElement2 || '';
    updateButtonColors();
});

document.getElementById('selectContent1').onclick = function () {
    selectContent('content1');
};

document.getElementById('selectContent2').onclick = function () {
    selectContent('content2');
};

function selectContent(contentType) {
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
    chrome.storage.local.remove(['selectedElement1', 'selectedElement2'], () => {
        resetButtonColors(); // 清除内容后重置按钮颜色
        alert('内容已清除');
    });
};

// 重置按钮颜色的函数
function resetButtonColors() {
    document.getElementById('selectContent1').style.backgroundColor = 'green';
    document.getElementById('selectContent2').style.backgroundColor = 'green';
}

// 更新按钮颜色
function updateButtonColors() {
    if (content1) {
        document.getElementById('selectContent1').style.backgroundColor = 'blue';
    }
    if (content2) {
        document.getElementById('selectContent2').style.backgroundColor = 'blue';
    }
}

// 对比内容按钮事件
document.getElementById('compareContent').onclick = function () {
    if (!content1 || !content2) {
        alert("请先选择两个内容进行对比！");
        return;
    }

    // 调用 HtmlDiff 对比 HTML
    let diffHtml = new HtmlDiff();
    let { oldDiffHtml, newDiffHtml } = diffHtml.diff_launch(content1.html, content2.html);

    // 创建对比弹窗，并展示对比结果
    showComparisonPopup(oldDiffHtml, newDiffHtml);
};

function showComparisonPopup(oldDiffHtml, newDiffHtml) {
    const comparisonWindow = window.open("", "Comparison", "width=800,height=600");
    comparisonWindow.document.body.innerHTML = ''; // 清空对比窗口内容
    comparisonWindow.document.write(`
        <html lang="${lang}">
        <head>
            <title>${translations.comparisonTitle}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #ffffff; /* 背景颜色 */
                    color: #333; /* 字体颜色 */
                    margin: 20px; /* 增加外边距 */
                }
                h2 {
                    text-align: center; /* 中心对齐标题 */
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px; /* 上方间距 */
                    font-size: 14px; /* 调整字体大小 */
                }
                th, td {
                    border: 1px solid #ddd; /* 边框颜色 */
                    padding: 12px; /* 单元格内填充 */
                    text-align: left; /* 左对齐 */
                }
                th {
                    background-color: #f2f2f2; /* 表头背景色 */
                    color: #333; /* 表头字体颜色 */
                }
                ins {
                    background-color: #e6ffe6; /* 新增内容背景色 */
                    color: green; /* 新增内容字体颜色 */
                }
                del {
                    background-color: #ffe6e6; /* 删除内容背景色 */
                    color: red; /* 删除内容字体颜色 */
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
                        <td>
                            ${oldDiffHtml}
                        </td>
                        <td>
                            ${newDiffHtml}
                        </td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
    `);
}
