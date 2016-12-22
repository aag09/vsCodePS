import * as vscode from 'vscode'
import { TreeExplorerNodeProvider } from 'vscode';
import { LanguageClient, RequestType, NotificationType } from 'vscode-languageclient';
import Window = vscode.window;
import { IFeature } from '../feature';

export class CodeActionsFeature implements IFeature {
    private command: vscode.Disposable;
    private languageClient: LanguageClient;

    constructor() {
        vscode.window.registerTreeExplorerNodeProvider('psAstProvider', new AstNodeProvider(vscode.window.activeTextEditor.document.fileName));
    }

    public setLanguageClient(languageclient: LanguageClient) {
        this.languageClient = languageclient;
    }

    public dispose() {
        this.command.dispose();
    }
}

class AstNodeProvider implements TreeExplorerNodeProvider<AstNode> {
    constructor(filePath: string) {
    }

    getLabel(node: AstNode): string {
        throw new Error();
    }

    getHasChildren(node: AstNode): boolean {
        throw new Error();
    }

    getClickCommand(node: AstNode): string {
        throw new Error();
    }

    provideRootNode(): AstNode {
        throw new Error();
    }

    resolveChildren(node: AstNode): Thenable<AstNode[]> {
        throw new Error();
    }
}

class AstNode {

}