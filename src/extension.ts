// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { pcapViewerProvider } from './pcapviewer';
import { PacketViewProvider } from './packetdetails';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new PacketViewProvider(context.extensionUri);

	context.subscriptions.push(pcapViewerProvider.register(context, provider));
	
	

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(PacketViewProvider.viewType, provider));

}

// This method is called when your extension is deactivated
export function deactivate() {}
