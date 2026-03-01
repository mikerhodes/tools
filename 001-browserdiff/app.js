/**
 * Render a split diff view comparing two text strings.
 * @param {string} oldText - The original text
 * @param {string} newText - The modified text
 * @returns {string} HTML string for the split diff view
 */
function renderSplitDiff(oldText, newText) {
    const changes = Diff.diffWords(oldText, newText);

    let leftHtml = '';
    let rightHtml = '';

    for (const change of changes) {
        const escapedValue = escapeHtml(change.value);

        if (change.removed) {
            leftHtml += `<span class="diff-removed">${escapedValue}</span>`;
        } else if (change.added) {
            rightHtml += `<span class="diff-added">${escapedValue}</span>`;
        } else {
            leftHtml += escapedValue;
            rightHtml += escapedValue;
        }
    }

    return `<div class="diff-container">
        <div class="diff-left">${leftHtml}</div>
        <div class="diff-right">${rightHtml}</div>
    </div>`;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize the diff tool UI
 */
function initDiffTool() {
    const diffButton = document.getElementById('diff-button');
    const leftInput = document.getElementById('left-input');
    const rightInput = document.getElementById('right-input');
    const diffOutput = document.getElementById('diff-output');

    if (!diffButton || !leftInput || !rightInput || !diffOutput) {
        return; // Not on the main page
    }

    diffButton.addEventListener('click', () => {
        const oldText = leftInput.value;
        const newText = rightInput.value;
        diffOutput.innerHTML = renderSplitDiff(oldText, newText);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiffTool);
} else {
    initDiffTool();
}
