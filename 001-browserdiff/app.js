/**
 * Render a line with word-level diff highlighting
 * @param {string} oldLine - The original line
 * @param {string} newLine - The modified line
 * @returns {{left: string, right: string}} HTML for left and right sides
 */
function renderLineDiff(oldLine, newLine) {
    const changes = Diff.diffWords(oldLine, newLine);

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

    return { left: leftHtml, right: rightHtml };
}

/**
 * Render a split diff view comparing two text strings.
 * @param {string} oldText - The original text
 * @param {string} newText - The modified text
 * @returns {string} HTML string for the split diff view
 */
function renderSplitDiff(oldText, newText) {
    const lineChanges = Diff.diffLines(oldText, newText);

    let rows = [];
    let leftLineNum = 1;
    let rightLineNum = 1;

    // Process changes, pairing adjacent removed/added blocks
    for (let i = 0; i < lineChanges.length; i++) {
        const change = lineChanges[i];
        const lines = change.value.replace(/\n$/, '').split('\n');

        if (change.removed) {
            // Check if next change is an addition (paired change)
            const nextChange = lineChanges[i + 1];
            if (nextChange && nextChange.added) {
                // Pair removed and added lines side by side
                const addedLines = nextChange.value.replace(/\n$/, '').split('\n');
                const maxLen = Math.max(lines.length, addedLines.length);

                for (let j = 0; j < maxLen; j++) {
                    const leftLine = lines[j];
                    const rightLine = addedLines[j];

                    rows.push({
                        left: leftLine !== undefined ? {
                            num: leftLineNum++,
                            content: `<span class="diff-removed">${escapeHtml(leftLine)}</span>`,
                            type: 'removed'
                        } : null,
                        right: rightLine !== undefined ? {
                            num: rightLineNum++,
                            content: `<span class="diff-added">${escapeHtml(rightLine)}</span>`,
                            type: 'added'
                        } : null
                    });
                }
                i++; // Skip the next change since we processed it
            } else {
                // Removed only
                for (const line of lines) {
                    rows.push({
                        left: {
                            num: leftLineNum++,
                            content: `<span class="diff-removed">${escapeHtml(line)}</span>`,
                            type: 'removed'
                        },
                        right: null
                    });
                }
            }
        } else if (change.added) {
            // Added only (not paired with a removal)
            for (const line of lines) {
                rows.push({
                    left: null,
                    right: {
                        num: rightLineNum++,
                        content: `<span class="diff-added">${escapeHtml(line)}</span>`,
                        type: 'added'
                    }
                });
            }
        } else {
            // Unchanged lines
            for (const line of lines) {
                rows.push({
                    left: {
                        num: leftLineNum++,
                        content: escapeHtml(line),
                        type: 'unchanged'
                    },
                    right: {
                        num: rightLineNum++,
                        content: escapeHtml(line),
                        type: 'unchanged'
                    }
                });
            }
        }
    }

    // Render HTML
    let html = '<div class="diff-container"><table class="diff-table">';

    for (const row of rows) {
        const leftNum = row.left ? row.left.num : '';
        const leftContent = row.left ? row.left.content : '';
        const leftClass = row.left ? `diff-line-${row.left.type}` : 'diff-line-empty';

        const rightNum = row.right ? row.right.num : '';
        const rightContent = row.right ? row.right.content : '';
        const rightClass = row.right ? `diff-line-${row.right.type}` : 'diff-line-empty';

        html += `<tr>
            <td class="diff-line-num ${leftClass}">${leftNum}</td>
            <td class="diff-line-content ${leftClass}">${leftContent}</td>
            <td class="diff-line-num ${rightClass}">${rightNum}</td>
            <td class="diff-line-content ${rightClass}">${rightContent}</td>
        </tr>`;
    }

    html += '</table></div>';
    return html;
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
 * Set up drag and drop file reading for a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element
 */
function setupFileDrop(textarea) {
    textarea.addEventListener('dragover', (e) => {
        e.preventDefault();
        textarea.classList.add('drag-over');
    });

    textarea.addEventListener('dragleave', () => {
        textarea.classList.remove('drag-over');
    });

    textarea.addEventListener('drop', (e) => {
        e.preventDefault();
        textarea.classList.remove('drag-over');

        const file = e.dataTransfer.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            textarea.value = event.target.result;
        };
        reader.readAsText(file);
    });
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

    setupFileDrop(leftInput);
    setupFileDrop(rightInput);

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
