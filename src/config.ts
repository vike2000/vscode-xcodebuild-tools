import * as vscode from "vscode";

export interface ExtensionConfiguration extends vscode.WorkspaceConfiguration {
	reloadStore?: string
	separateLogChannels?: boolean
	clearLogChannelBeforeActions?: string[]
	showLogChannelBeforeActions?: string[]
	statusBarItems?: string[]
	statusBarItemPriorities?: {[key:string]: number}
}
