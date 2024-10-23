// 检查全局变量是否已经定义
if (typeof isSelecting === 'undefined') {
    var isSelecting = false;
}

if (typeof selectedElement === 'undefined') {
    var selectedElement = null;
}

if (typeof currentContentType === 'undefined') {
    var currentContentType = null;
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startSelect') {
        if (isSelecting) {
            cancelSelection(); // 取消当前的选择
        }
        isSelecting = true;
        currentContentType = message.contentType;
        startSelectingElement(currentContentType);
    }
});

// 取消选择操作的函数
function cancelSelection() {
    isSelecting = false;
    currentContentType = null;

    // 移除事件监听器
    document.removeEventListener('mousemove', highlightElement);
    document.removeEventListener('click', selectElement);

    // 清除高亮
    if (selectedElement) {
        selectedElement.style.backgroundColor = '';
        selectedElement.style.outline = '';
    }
}

function startSelectingElement(contentType) {
    // 鼠标悬停时高亮显示
    document.addEventListener('mousemove', highlightElement);
    // 鼠标点击选择元素
    document.addEventListener('click', selectElement);
}

function highlightElement(event) {
    if (!isSelecting) return;

    // 移除之前的高亮
    if (selectedElement) {
        selectedElement.style.backgroundColor = '';
        selectedElement.style.outline = '';
    }

    selectedElement = event.target;
    // 高亮整个选择区域
    selectedElement.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
    selectedElement.style.outline = '3px solid red';
}

function selectElement(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isSelecting) return;

    const selectedElement = event.target;
    if (selectedElement) {
        selectedElement.style.backgroundColor = '';
        selectedElement.style.outline = '';
    }

    const selectedHtmlWithStyles = getHtmlWithInlineStyles(selectedElement);

    const elementData = {
        html: selectedHtmlWithStyles
    };

    chrome.runtime.sendMessage({
        type: 'elementSelected',
        elemNumber: currentContentType === 'content1' ? 1 : 2,
        element: elementData
    });

    cancelSelection();
    alert(currentContentType===null?'success':(currentContentType === 'content1' ? '内容1已选择' : '内容2已选择'));
}

// 提取HTML并将所有计算的样式转换为内联样式
function getHtmlWithInlineStyles(element) {
    const clone = element.cloneNode(true);
    applyInlineStyles(clone);
    return clone.outerHTML;
}

// 将计算的样式应用为内联样式
function applyInlineStyles(element) {
    const computedStyle = getComputedStyle(element);

    for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle[i];
        element.style[property] = computedStyle.getPropertyValue(property);
    }

    for (let i = 0; i < element.children.length; i++) {
        applyInlineStyles(element.children[i]);
    }
}
