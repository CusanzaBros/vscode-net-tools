// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { pcapViewerProvider } from './pcapviewer';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "packetreader" is now active!');
	context.subscriptions.push(pcapViewerProvider.register(context));
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	/*const disposable = vscode.commands.registerCommand('packetreader.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from PacketReader!');

		const fileBuffer = fs.readFileSync('c:\\users\\zach\\downloads\\ipp.pcap');
		const bytes = new Uint8Array(fileBuffer);

		const header = new HeaderRecord(bytes);
		let offset = header.endoffset;
		console.log(bytes.byteLength);
		while(offset < bytes.byteLength) {
			const packet = new PacketRecord(bytes, offset);
			offset = packet.endoffset;
			console.log(packet.toString);
		}

	});

	context.subscriptions.push(disposable);*/
}

// This method is called when your extension is deactivated
export function deactivate() {}
