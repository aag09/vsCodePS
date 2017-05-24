/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import vscode = require('vscode');
import fs = require('fs');
import { IFeature } from '../feature';
import { LanguageClient, RequestType, NotificationType } from 'vscode-languageclient';

namespace GetProfilePathsRequest {
    export const type =
        new RequestType<any, GetProfilePathsResponseBody, string, void>('powerShell/getProfilePaths');
}

interface GetProfilePathsResponseBody {
    currentUserAllHosts: string;
    currentUserCurrentHost: string;
}

export class OpenProfileFeature implements IFeature {
    private command: vscode.Disposable;
    private languageClient: LanguageClient;
    private waitingForClientToken: vscode.CancellationTokenSource;
    private getLanguageClientResolve: (value?: LanguageClient | Thenable<LanguageClient>) => void;

    constructor() {
        this.command = vscode.commands.registerCommand('PowerShell.OpenProfileScript', () => {
            this.getLanguageClient().then(_ => {
                this.languageClient.sendRequest(GetProfilePathsRequest.type, null).then(profilePaths => {

                    let profilePath = profilePaths.currentUserCurrentHost;

                    let items: vscode.QuickPickItem[] = [];
                    items.push({
                        label: "Current User Current Host Profile",
                        description: profilePaths.currentUserCurrentHost});
                    items.push({
                        label: "Current User All Hosts Profile",
                        description: profilePaths.currentUserAllHosts});

                    let options : vscode.QuickPickOptions = {
                        placeHolder: "Select a PowerShell profile script to edit"
                    };

                    vscode.window.showQuickPick(items, options).then(selection => {
                        if (!selection) {
                            return;
                        }

                        if (selection.label === "Current User All Hosts Profile") {
                            profilePath = profilePaths.currentUserAllHosts;
                        }

                        fs.lstat(profilePath, (err, stats) => {
                            if (err && (err.code === 'ENOENT')) {
                                fs.closeSync(fs.openSync(profilePath, 'w'));
                            }

                            let profilePathUri = vscode.Uri.file(profilePath);
                            vscode.commands.executeCommand(
                                "vscode.open",
                                profilePathUri);
                        });
                    });
                });
            });
        });
    }

    public dispose() {
        this.command.dispose();
    }

    private getLanguageClient(): Thenable<LanguageClient> {
        if (this.languageClient) {
            return Promise.resolve(this.languageClient);
        }
        else {
            // If PowerShell isn't finished loading yet, show a status bar message
            // until the LanguageClient is passed on to us
            this.waitingForClientToken = new vscode.CancellationTokenSource();

            return new Promise<LanguageClient>((resolve, reject) => {
                this.getLanguageClientResolve = resolve;

                vscode.window
                    .showQuickPick(
                        ["Cancel"],
                        { placeHolder: "Open PowerShell Profile Script: Please wait, starting PowerShell..." },
                        this.waitingForClientToken.token)
                    .then(response => {
                        if (response === "Cancel") {
                            this.clearWaitingToken();
                            reject();
                        }
                    });

                // Cancel the loading prompt after 45 seconds
                setTimeout(() => {
                    if (this.waitingForClientToken) {
                        this.clearWaitingToken();
                        reject();

                        vscode.window.showErrorMessage(
                            "Open PowerShell Profile Script: PowerShell session took too long to start.");
                    }
                }, 60000);
            });
        }
    }

    public setLanguageClient(languageClient: LanguageClient) {
        this.languageClient = languageClient;

        if (this.waitingForClientToken) {
            this.getLanguageClientResolve(this.languageClient);
            this.clearWaitingToken();
        }
    }

    private clearWaitingToken() {
        if (this.waitingForClientToken) {
            this.waitingForClientToken.dispose();
            this.waitingForClientToken = undefined;
        }
    }
}
