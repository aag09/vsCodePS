import * as vscode from 'vscode'
import { TreeExplorerNodeProvider } from 'vscode';
import { LanguageClient, RequestType, NotificationType } from 'vscode-languageclient';
import Window = vscode.window;
import { IFeature } from '../feature';

export namespace GetAstRequest {
    export const type: RequestType<string, any, void> = { get method(): string { return "powerShell/getAst"; } };
}

export class ShowAstFeature implements IFeature {
    private command: vscode.Disposable;
    private languageClient: LanguageClient;
    private astNodeProvider: AstNodeProvider;

    constructor() {
        this.astNodeProvider = new AstNodeProvider();
        vscode.window.registerTreeExplorerNodeProvider('psAstProvider', this.astNodeProvider);
    }

    public setLanguageClient(languageclient: LanguageClient) {
        this.languageClient = languageclient;
        this.astNodeProvider.setLanguageClient(languageclient);
    }

    public dispose() {
        this.command.dispose();
    }
}

class AstNodeProvider implements TreeExplorerNodeProvider<AstNode> {
    rootNode: AstNode;
    languageClient: LanguageClient;

    getLabel(node: AstNode): string {
        return `${ node.item.label } [${ node.item.extent.startLineNumber }, ${ node.item.extent.endLineNumber }]`;
    }

    getHasChildren(node: AstNode): boolean {
            return node.children.length > 0;
    }

    getClickCommand(node: AstNode): string {
        return node.item.id;
    }

    provideRootNode(): Thenable<AstNode> {
        return this.languageClient.sendRequest(GetAstRequest.type, vscode.window.activeTextEditor.document.fileName).then((result) => {
                return result;
        });
    }

    resolveChildren(node: AstNode): Thenable<AstNode[]> {
        return new Promise((resolve) => {
            if (node.children.length > 0) {
                resolve(node.children);
            }
            else {
                resolve([]);
            }
        });
    }

    setLanguageClient(languageclient: LanguageClient) {
        this.languageClient = languageclient;
    }
}

class AstNode {
    item: NodeItem;
    children: AstNode[];
}

class NodeItem {
    extent: any;
    label: string;
    id: string;
}