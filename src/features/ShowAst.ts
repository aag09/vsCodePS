import * as vscode from 'vscode'
import { TreeExplorerNodeProvider } from 'vscode';
import { LanguageClient, RequestType, NotificationType } from 'vscode-languageclient';
import Window = vscode.window;
import { IFeature } from '../feature';

export namespace GetAstRequest {
    export const type: RequestType<any, any, void> = { get method(): string { return "powerShell/getAst"; } };
}

export class ShowAstFeature implements IFeature {
    private command: vscode.Disposable;
    private languageClient: LanguageClient;

    constructor() {
        vscode.window.registerTreeExplorerNodeProvider('psAstProvider', new AstNodeProvider(this.languageClient));
    }

    public setLanguageClient(languageclient: LanguageClient) {
        this.languageClient = languageclient;
    }

    public dispose() {
        this.command.dispose();
    }
}

class AstNodeProvider implements TreeExplorerNodeProvider<AstNode> {
    rootNode: AstNode;
    languageClient: LanguageClient;
    constructor(languageClient: LanguageClient) {
        this.languageClient = languageClient;
    }

    getLabel(node: AstNode): string {
        return node.item.label;
    }

    getHasChildren(node: AstNode): boolean {
        return node.children.length > 0;
    }

    getClickCommand(node: AstNode): string {
        return node.item.id;
    }

    provideRootNode(): AstNode {
        return { item: { ast: null, id: null, label: "root"}, children: [] };
    }

    resolveChildren(node: AstNode): Thenable<AstNode[]> {
        return new Promise((resolve) => {
            if (node.item.label == 'root')
            {
                if (this.languageClient === undefined)
                {
                    resolve([]);
                }
                else
                {
                    this.languageClient.sendRequest(GetAstRequest.type, vscode.window.activeTextEditor.document.fileName).then((result) => {
                        resolve(result.children);
                    });
                }
            }
            else
            {
                if (node.children.length > 0)
                {
                    resolve(node.children);
                }
                else
                {
                    resolve([]);
                }
            }
        })
    }
}

class AstNode {
    item: NodeItem;
    children: AstNode[];
}

class NodeItem {
    ast: any;
    label: string;
    id: string;
}