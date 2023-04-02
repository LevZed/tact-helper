import * as vscode from 'vscode';
import * as fs from 'fs';

export async function compileContract(contractPath: string, projectPath: string) {

    updateTactConfigAndExecuteBuild(contractPath, projectPath);

}




function addScriptsToPackageJson(projectPath: string) {
    const packageJsonPath = `${projectPath}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());

    const scripts = packageJson.scripts || {};
    const newScripts = {
        "th-build": "tact --config ./tact.config.json",
        "th-test": "jest",
        "th-deploy": "ts-node ./sources/contract.deploy.ts"
    };

    for (const [key, value] of Object.entries(newScripts)) {
        if (!scripts[key]) {
            scripts[key] = value;
        }
    }

    packageJson.scripts = scripts;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

import path = require('path');
async function updateTactConfigAndExecuteBuild(pathToFile: string, folderPath: string) {
    const projectPath = folderPath;
    const tactConfigPath = path.join(projectPath,'tact.config.json');
    const packagePath = path.join(projectPath,'package.json');

    // Read tact.config.json
    const tactConfig = JSON.parse(fs.readFileSync(tactConfigPath, { encoding: 'utf-8' }));

    // Update tactConfigPath in tact.config.json
    tactConfig.projects[0].path = `./sources/${path.basename(pathToFile)}`;
    tactConfig.projects[0].name = `${path.parse(pathToFile).name}`;

    // Write updated tact.config.json back to file
    fs.writeFileSync(tactConfigPath, JSON.stringify(tactConfig, null, 2));

    // Check if "th-build" script exists in package.json
    const packageJSON = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf-8' }));
    if (!packageJSON.scripts || !packageJSON.scripts['th-build']) {
        addScriptsToPackageJson(folderPath);
        // vscode.window.showErrorMessage('No "th-build" script found in package.json');
        // return;
    }

    // Execute "th-build" script in the terminal
    const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
    terminal.sendText('npm run th-build');
}
