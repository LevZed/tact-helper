import * as vscode from 'vscode';
import * as fs from 'fs';
import { checkTactProject, setupNewProject } from './checkTact';

let dontAskFiles: string[] = [];
let checkedFiles: string[] = [];

export function activate(context: vscode.ExtensionContext) {
	console.log(`tact-helper is now active! Time is ${Date.now()}.`);

	const updateToolbarButton = async () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && activeEditor.document.fileName.match(/\.tact$/)) {
			console.log(dontAskFiles);
			console.log(checkedFiles);

			if (!dontAskFiles.includes(activeEditor.document.uri.fsPath) && !checkedFiles.includes(activeEditor.document.uri.fsPath)) {
				const isProject = await checkTactProject(activeEditor.document.uri.fsPath);

				if (!isProject) {
					dontAskFiles.push(activeEditor.document.uri.fsPath);
				} else {
					checkedFiles.push(activeEditor.document.uri.fsPath);
				}
			}

			if (dontAskFiles.includes(activeEditor.document.uri.fsPath)) {
				vscode.commands.executeCommand('setContext', 'showTactSetupButton', true);
				vscode.commands.executeCommand('setContext', 'showTactCompileButton', false);
			}
			if (checkedFiles.includes(activeEditor.document.uri.fsPath)) {
				vscode.commands.executeCommand('setContext', 'showTactSetupButton', false);
				vscode.commands.executeCommand('setContext', 'showTactCompileButton', true);
			}

		} else {
			vscode.commands.executeCommand('setContext', 'showTactSetupButton', false);
			vscode.commands.executeCommand('setContext', 'showTactCompileButton', false);
		}
	};


	if (vscode.window.activeTextEditor?.document.fileName.match(/\.tact$/)) {
		// console.log("test1");
		// vscode.commands.executeCommand('setContext', 'showTactToolbarButton', true);
		updateToolbarButton();
	}


	// Update toolbar button visibility whenever the active editor changes
	vscode.window.onDidChangeActiveTextEditor(updateToolbarButton);


	context.subscriptions.push(
		vscode.commands.registerCommand('tact-helper.setupTactProject', () => {
			if (vscode.window.activeTextEditor) {
				const elIndex = dontAskFiles.indexOf(vscode.window.activeTextEditor.document.uri.fsPath);
				if (elIndex > -1) {
					dontAskFiles.splice(elIndex, 1);
				}
				updateToolbarButton();

			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tact-helper.compileTact', () => {
			// Your command logic here
			vscode.window.showInformationMessage('Compile not implemented!');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('tact-helper.newProjectCmd', async () => {
			const folder = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: false,
				openLabel: 'Select folder'
			});
			if (folder && folder[0]){
				setupNewProject(folder[0].fsPath);
			}
		})
	);
}

export function deactivate() { }
