import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

const DEPENDENCIES: string[] = ['@tact-lang/compiler', '@tact-lang/emulator', 'ton-core', 'ton-crypto'];

const checkTactProject = async (file: string) => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        // no workspace folders opened
        return false;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const packageJsonPath = path.join(rootPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        // package.json does not exist, suggest to clone the template repository
        const choice = await vscode.window.showInformationMessage(
            'TACT project not found. Do you want to create a new TACT project from the template?',
            'Yes',
            'No'
        );
        if (choice === 'Yes') {
            const projectFolder = path.join(rootPath, 'new-tact-project');
            const gitCloneCommand = `git clone https://github.com/tact-lang/tact-template ${projectFolder}`;

            // Show progress bar while cloning template repository
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Cloning template repository...",
                cancellable: false
            }, async () => {
                await new Promise((resolve) => {
                    exec(gitCloneCommand, () => {
                        // Called when the clone command is finished
                        resolve(undefined);
                    });

                });
                await new Promise((resolve) => {
                    // Install dependencies after cloning the repository
                    exec(`cd ${projectFolder} && npm install`, () => {
                        resolve(undefined);
                    });
                });
                await new Promise((resolve) => {
                    exec(`cd ${projectFolder} && git remote rm origin`, () => {
                        // Called when the clone command is finished
                        resolve(undefined);
                    });

                });

            });

            vscode.window.showInformationMessage('TACT project created successfully.');
            const folderUri = vscode.Uri.file(projectFolder);

            const oldFilePath = file;
            const fileName = path.basename(file);
            const newFolder = path.join(projectFolder, 'sources');
            const newFilePath = path.join(newFolder, fileName);

            fs.mkdirSync(newFolder, { recursive: true }); // create the new folder if it doesn't exist
            fs.renameSync(oldFilePath, newFilePath); // move the file to the new folder with the new name

            // const filePath = path.join(folderUri.fsPath, "Sources", fileName);

            // vscode.workspace.openTextDocument(filePath).then((doc) => {
            //     vscode.window.showTextDocument(doc);
            // });


            vscode.commands.executeCommand('vscode.openFolder', folderUri);
            return true;
        }


        return false;
    }

    const packageJson = require(packageJsonPath);
    let isDependencies = true;

    if (!packageJson.dependencies) {
        isDependencies = false;
    } else {
        for (let dependency of DEPENDENCIES) {
            if (!packageJson.dependencies[dependency]) {
                isDependencies = false;
            }
        }

    }

    if (!isDependencies) {
        // required dependencies are not found, suggest to add them
        const choice = await vscode.window.showInformationMessage(
            'TACT dependencies are not found in the project. Do you want to add them?',
            'Yes',
            'No'
        );
        if (choice === 'Yes') {
            // show progress bar
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Installing TACT dependencies',
                cancellable: false
            }, async () => {
                await new Promise((resolve) => {
                    // execute npm command to add dependencies
                    exec(`npm install --save ${DEPENDENCIES.join(" ")}`, { cwd: rootPath }, () => {
                        resolve(undefined);
                    });
                });

                // create folders for path "./sources/output"
                fs.mkdirSync(path.join(rootPath, 'sources', 'output'), { recursive: true });
                // create file tact.config.json at ./
                const tactConfigPath = path.join(rootPath, 'tact.config.json');
                if (!fs.existsSync(tactConfigPath)) {
                    fs.writeFileSync(tactConfigPath, JSON.stringify({
                        projects: [{
                            name: 'sample',
                            path: './sources/contract.tact',
                            output: './sources/output',
                            options: {}
                        }]
                    }, null, 2));
                }
                // show success message
            });
            vscode.window.showInformationMessage('TACT dependencies added successfully!');
            return true;
        }
        return false;
    }


    // package.json exists with required dependencies
    console.log(`TACT project found at: ${rootPath}`);
    return true;
};

export { checkTactProject };
