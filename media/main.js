//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    /** @type {Array<{ value: string }>} */
    let selected = null;

    document.querySelectorAll('div.text-container > div').forEach((element) => {
        element.addEventListener('click', (e) => {
            vscode.postMessage({ type: 'packetSelected', value: e.target.id});
            if(selected !== null) {
                selected.classList.toggle(`active`);
            }
            e.target.classList.toggle(`active`);
            selected = e.target;
        });
    });

}());


