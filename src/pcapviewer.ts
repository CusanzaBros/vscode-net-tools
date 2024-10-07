import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { Disposable, disposeAll } from './dispose';
import { PCAPNGEnhancedPacketBlock, PCAPNGSimplePacketBlock, PCAPPacketRecord, Section } from "./parsers/file/section";
import { PacketViewProvider } from './packetdetails';

/**
 * Define the document (the data model) used for paw draw files.
 */
class pcapViewerDocument extends Disposable implements vscode.CustomDocument {

	static async create(
		uri: vscode.Uri
	): Promise<pcapViewerDocument | PromiseLike<pcapViewerDocument>> {
		const dataFile = uri;
		const fileData = await pcapViewerDocument.readFile(dataFile);
		return new pcapViewerDocument(uri, fileData);
	}

	private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
		if (uri.scheme === 'untitled') {
			return new Uint8Array();
		}
		return new Uint8Array(await vscode.workspace.fs.readFile(uri));
	}

	private readonly _uri: vscode.Uri;

	private _documentData: Uint8Array;
	private _sections: Array<Section> = [];
	public selectedSection: number = -1;


	private constructor(
		uri: vscode.Uri,
		initialContent: Uint8Array,
	) {
		super();
		this._uri = uri;
		this._documentData = initialContent;

		const bytes = this._documentData;
		const header = Section.create(bytes);
		let offset = header.endoffset;

		let packet = header;
		this._sections.push(packet);

		while(offset < bytes.byteLength) {
			
			try {
				packet = Section.createNext(bytes, packet, header);
				this._sections.push(packet);
			} catch(e) {
				if (e instanceof Error) {
					console.log(`Exception rendering, call stack: ${e.stack}`);
				} else {
					console.log(`Exception rendering`);
				}
				break;
			}
			offset = packet.endoffset;
		}
	}

	public get sections(): Array<Section> {
		return this._sections;
	}
	public get uri() { return this._uri; }

	public get documentData(): Uint8Array { return this._documentData; }

	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
	/**
	 * Fired when the document is disposed of.
	 */
	public readonly onDidDispose = this._onDidDispose.event;

	private readonly _onDidChange = this._register(new vscode.EventEmitter<{
		readonly label: string,
		undo(): void,
		redo(): void,
	}>());
	/**
	 * Fired to tell VS Code that an edit has occurred in the document.
	 *
	 * This updates the document's dirty indicator.
	 */
	public readonly onDidChange = this._onDidChange.event;

	/**
	 * Called by VS Code when there are no more references to the document.
	 *
	 * This happens when all editors for it have been closed.
	 */
	dispose(): void {
		this._onDidDispose.fire();
		super.dispose();
	}

	/**
	 * Called by VS Code when the user saves the document.
	 */
	async save(cancellation: vscode.CancellationToken): Promise<void> {
		await this.saveAs(this.uri, cancellation);
	}

	/**
	 * Called by VS Code when the user saves the document to a new location.
	 */
	async saveAs(targetResource: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> { 
		if (cancellation.isCancellationRequested || !targetResource.path.toLowerCase().endsWith(".txt")) { 
			return; 
		} 
		let textData:string = ""; 
		this._sections.forEach(s => { 
			textData += s.toString + "\n"; 
		}); 
		const encoder = new TextEncoder(); 
		await vscode.workspace.fs.writeFile(targetResource, encoder.encode(textData.trimEnd())); 
	} 

	/**
	 * Called by VS Code when the user calls `revert` on a document.
	 */
	async revert(_cancellation: vscode.CancellationToken): Promise<void> {
		return;
	}

	/**
	 * Called by VS Code to backup the edited document.
	 *
	 * These backups are used to implement hot exit.
	 */
	async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
		await this.saveAs(destination, cancellation);

		return {
			id: destination.toString(),
			delete: async () => {
				try {
					await vscode.workspace.fs.delete(destination);
				} catch {
					// noop
				}
			}
		};
	}
}

/**
 * Provider for paw draw editors.
 *
 * Paw draw editors are used for `.pcapViewer` files, which are just `.png` files with a different file extension.
 *
 * This provider demonstrates:
 *
 * - How to implement a custom editor for binary files.
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Communication between VS Code and the custom editor.
 * - Using CustomDocuments to store information that is shared between multiple custom editors.
 * - Implementing save, undo, redo, and revert.
 * - Backing up a custom editor.
 */
export class pcapViewerProvider implements vscode.CustomReadonlyEditorProvider<pcapViewerDocument> {

	private static newpcapViewerFileId = 1;

	public static register(context: vscode.ExtensionContext, details: PacketViewProvider): vscode.Disposable {
		vscode.commands.registerCommand("packetreader.pcap.new", () => {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders) {
				vscode.window.showErrorMessage("Creating new files currently requires opening a workspace");
				return;
			}

			const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, `new-${pcapViewerProvider.newpcapViewerFileId++}.pcap`)
				.with({ scheme: 'untitled' });

			vscode.commands.executeCommand('vscode.openWith', uri, pcapViewerProvider.viewType);
		});

		return vscode.window.registerCustomEditorProvider(
			pcapViewerProvider.viewType,
			new pcapViewerProvider(context, details),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
					enableFindWidget: true
				},
				supportsMultipleEditorsPerDocument: false,
			});
	}

	private static readonly viewType = "packetreader.pcap";

	/**
	 * Tracks all known webviews
	 */
	private readonly webviews = new WebviewCollection();

	constructor(
		private readonly _context: vscode.ExtensionContext,
		private readonly _details: PacketViewProvider
	) { }

	//#region CustomEditorProvider

	async openCustomDocument(
		uri: vscode.Uri,
		openContext: { backupId?: string },
		_token: vscode.CancellationToken
	): Promise<pcapViewerDocument> {
		const document: pcapViewerDocument = await pcapViewerDocument.create(uri);

		const listeners: vscode.Disposable[] = [];

		listeners.push(document.onDidChange(e => {
			// Tell VS Code that the document has been edited by the use.
			this._onDidChangeCustomDocument.fire({
				document,
				...e,
			});
		}));

		document.onDidDispose(() => disposeAll(listeners));

		return document;
	}

	async resolveCustomEditor(
		document: pcapViewerDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Add the webview to our internal set of active webviews
		this.webviews.add(document.uri, webviewPanel);

		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};

		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

		webviewPanel.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'packetSelected':
					{
						document.selectedSection = data.value;
						this._details.refresh(document.sections[data.value]);
						break;
					}
			}
		
		});

		webviewPanel.onDidChangeViewState(data => {

			const panel = data.webviewPanel;
			if(panel.visible && document.selectedSection !== -1) {
				this._details.refresh(document.sections[document.selectedSection]);

			} else {
				this._details.refresh(undefined);
			}
		});
		
	}

	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<pcapViewerDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	public saveCustomDocument(document: pcapViewerDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.save(cancellation);
	}

	public saveCustomDocumentAs(document: pcapViewerDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.saveAs(destination, cancellation);
	}

	public revertCustomDocument(document: pcapViewerDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.revert(cancellation);
	}

	public backupCustomDocument(document: pcapViewerDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
		return document.backup(context.destination, cancellation);
	}

	//#endregion

	/**
	 * Get the static HTML used for in our editor's webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview, document: pcapViewerDocument): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'main.js'));
		const css = readFileSync(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'vscode.css').with({scheme: 'vscode-resource'}).fsPath, "utf-8");

		let lineOutput: string = "";
		let lineNumberOutput: string = "";
		let lines: number = 0;


		document.sections.forEach((section) => {
			try {
				let _class = "";

				if (section.comments.length) {
					for (const comment of section.comments) {
						if (comment.length) {
							lineNumberOutput += `<span></span>`;
							lineOutput += `<div class="comment" id="${lines}">// ${comment}</div>`;
						}
					}
				}

				if (
					section instanceof PCAPNGEnhancedPacketBlock || 
					section instanceof PCAPPacketRecord ||
					section instanceof PCAPNGSimplePacketBlock
				) {
					_class = ` class="numbered"`;
				}

				lineNumberOutput += `<span${_class}></span>`;
				lineOutput += `<div${_class} id="${lines}">${section.toString}</div>`;
				lines++;
			} catch (e)
			{
				if (e instanceof Error) {
					console.log(`Exception rendering, call stack: ${e.stack}`);
				} else {
					console.log(`Exception rendering`);
				}
			}
		});

		const nonce = getNonce();
		return /* html */`
			<!DOCTYPE html>
			<html lang="en" >
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource} 'nonce-${nonce}'; ; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Packet Viewer</title>
				<style nonce="${nonce}">
				:root {
					--nettools-before: "${"\\00a0".repeat(document.sections.length.toString().length)}";
				}
				@counter-style pad-counter {
					system: numeric;
					symbols: "0" "1" "2" "3" "4" "5" "6" "7" "8" "9";
					pad: ${document.sections.length.toString().length} "\\00a0";
				} 
				${css}
				</style>
			</head>
			<body>
				<div class="text-container">
				${lineOutput}
				</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}


}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

/**
 * Tracks all webviews.
 */
class WebviewCollection {

	private readonly _webviews = new Set<{
		readonly resource: string;
		readonly webviewPanel: vscode.WebviewPanel;
	}>();

	/**
	 * Get all known webviews for a given uri.
	 */
	public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
		const key = uri.toString();
		for (const entry of this._webviews) {
			if (entry.resource === key) {
				yield entry.webviewPanel;
			}
		}
	}

	/**
	 * Add a new webview to the collection.
	 */
	public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
		const entry = { resource: uri.toString(), webviewPanel };
		this._webviews.add(entry);

		webviewPanel.onDidDispose(() => {
			this._webviews.delete(entry);
		});
	}
}
