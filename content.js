// 检查是否已经声明过变量
if (typeof isSelecting === 'undefined') {
    var isSelecting = false;
}

if (typeof selectedElement === 'undefined') {
    var selectedElement = null;
}

// 检查是否已经声明过 currentContentType
if (typeof currentContentType === 'undefined') {
    var currentContentType = null;
}

// 开始选择元素的逻辑
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startSelect') {
        isSelecting = true;
        currentContentType = message.contentType; // 记录当前操作的类型
        startSelectingElement(currentContentType);
    }
});

function startSelectingElement(contentType) {
    // 清除现有事件监听器，避免重复监听
    document.removeEventListener('mousemove', highlightElement);
    document.removeEventListener('click', selectElement);

    // 鼠标悬停时高亮显示
    document.addEventListener('mousemove', highlightElement);
    // 鼠标点击选择元素
    document.addEventListener('click', selectElement);

    function highlightElement(event) {
        if (!isSelecting) return;

        // 移除之前的高亮
        if (selectedElement) {
            selectedElement.style.backgroundColor = ''; // 清除背景色
            selectedElement.style.outline = ''; // 清除边框
        }

        selectedElement = event.target;
        // 高亮整个选择区域
        selectedElement.style.backgroundColor = 'rgba(255, 255, 0, 0.5)'; // 设置背景色为半透明黄色
        selectedElement.style.outline = '3px solid red'; // 高亮边框
    }

    function selectElement(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!isSelecting) return;

        const selectedElement = event.target; // 获取点击的元素
        if (selectedElement) {
            selectedElement.style.backgroundColor = ''; // 清除高亮
            selectedElement.style.outline = ''; // 清除边框
        }

        const selectedHtmlWithStyles = getHtmlWithInlineStyles(selectedElement); // 获取带内联样式的HTML

        const elementData = {
            html: selectedHtmlWithStyles // 使用带有内联样式的HTML
        };

        // 根据当前的 contentType 确定存储的内容
        chrome.runtime.sendMessage({
            type: 'elementSelected',
            elemNumber: contentType === 'content1' ? 1 : 2, // 确保正确的 contentType 被存储
            element: elementData
        });

        // 停止选择
        document.removeEventListener('mousemove', highlightElement);
        document.removeEventListener('click', selectElement);

        isSelecting = false;
        currentContentType = null; // 选择完成后清空类型
        alert(contentType === 'content1' ? '内容1已选择' : '内容2已选择');
    }
}

// 提取HTML并将所有计算的样式转换为内联样式
function getHtmlWithInlineStyles(element) {
    const clone = element.cloneNode(true);  // 克隆元素
    applyInlineStyles(clone);  // 将计算的样式应用为内联样式
    return clone.outerHTML;  // 返回带有内联样式的HTML
}

// 将计算的样式应用为内联样式
function applyInlineStyles(element) {
    const computedStyle = getComputedStyle(element);

    for (let i = 0; i < computedStyle.length; i++) {
        const property = computedStyle[i];
        element.style[property] = computedStyle.getPropertyValue(property);  // 应用内联样式
    }

    // 对所有子元素递归应用内联样式
    for (let i = 0; i < element.children.length; i++) {
        applyInlineStyles(element.children[i]);
    }
}
