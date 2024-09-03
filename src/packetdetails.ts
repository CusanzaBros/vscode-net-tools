import * as vscode from "vscode";
import { Section } from "./parsers/file/section";

export class PacketViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "packetDetails.detailsView";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public refresh(section?: Section) {
    if (this._view === undefined) {
      return;
    }
    this._view.webview.html = this._getHtmlForWebview(
      this._view.webview,
      section
    );
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "colorSelected": {
          vscode.window.activeTextEditor?.insertSnippet(
            new vscode.SnippetString(`#${data.value}`)
          );
          break;
        }
      }
    });
  }

  public addColor() {
    if (this._view) {
      this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
      this._view.webview.postMessage({ type: "addColor" });
    }
  }

  public clearColors() {
    if (this._view) {
      this._view.webview.postMessage({ type: "clearColors" });
    }
  }

  private printArray(pa: Array<any>, depth: number): string {
    let ret = "";

    let bFirst = true;

    let bBranch = false;

    if (depth === 0) {
      ret += `<ul class="tree">`;
    }

    pa.forEach((a) => {
      if (Array.isArray(a)) {
        ret += this.printArray(a, depth + 1);

        ret += "</ul>";

        ret += "</details>";

        ret += "</li>";
      } else {
        let textNode = a.toString();

        let textOpen = "";

        if (textNode[0] === "*") {
          textOpen = " open";

          textNode = textNode.slice(1);
        }

        if (depth && bFirst) {
          bFirst = false;

          ret += `<li><details${textOpen}>`;

          ret += `<summary><span>${textNode}</span></summary>`;

          ret += "<ul>";
        } else {
          ret += `<li><span>${textNode}</span></li>`;
        }
      }
    });

    if (depth === 0) {
      ret += "</ul>";
    }

    return ret;
  }

  // const arr:Array<any> = ["a", "b", "b2", ["c", ["e", "f"], "d"]];

  // printArray(arr, 0);

  private _getHtmlForWebview(webview: vscode.Webview, section?: Section) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    let strProperties = "";
    let strHex = "";
    let strASCII = "";
    if (section !== undefined) {
      strProperties = this.printArray(section.getProperties, 0);

      strHex = section.getHex;
      strASCII = section.getASCII;
    } else {
      strProperties = "Select a packet in a pcap or pcapng file to display details.";
    }

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>
				<div class="packet-details">
					<span class="packet-properties"> ${strProperties} </span>
					<span class="packet-hex"> ${strHex} </span>
					<span class="packet-ascii"> ${strASCII} </span>
				</div>
			</body>
			</html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
