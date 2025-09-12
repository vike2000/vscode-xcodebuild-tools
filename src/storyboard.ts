import * as vscode from 'vscode'
import {getNonce} from './util'
import * as path from 'path'
import * as fs from 'fs'

export class StoryboardEditorProvider implements vscode.CustomTextEditorProvider {
	private static readonly viewType = "com.dyn-o-saur.bluelephant.vscode.xcode.xib"
	
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(
			StoryboardEditorProvider.viewType, new StoryboardEditorProvider(context)
		)
	}
	
	constructor(
		private readonly context: vscode.ExtensionContext
	) { }
	
	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		webviewPanel.webview.options = {enableScripts: true}
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview)
		
		function postDocumentToWebview() {
			webviewPanel.webview.postMessage({
				type: 'setDocument',
				text: document.getText(),
			})
		}
		
		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(ev => {
			if(ev.document.uri.toString() == document.uri.toString())	postDocumentToWebview()
		})
		
		webviewPanel.webview.onDidReceiveMessage(ev => {
			switch(ev.type){case NaN:
//				break;case'add'			:this.addNewScratch(document)
//				break;case'delete'		:this.deleteScratch(document, e.id)
				break;case'getDocument'	:								postDocumentToWebview()
				}
		})
		
		webviewPanel.onDidDispose(() => {changeDocumentSubscription.dispose()})
	}
	
	public static evalTemplateString(string: string, args: {[_:string]: any}) { // original https://stackoverflow.com/questions/41117799/string-interpolation-on-variable/41118285#41118285
		const keys = Object.keys(args)
		return (new Function(...keys, 'return `' + string.replace(/`/g, '\\`') + '`'))(...keys.map(key => args[key]))
	}
	
	/** most of storyboard webview (html+css+js) is based on personal (private) "com.dyn-o-saur.bluelephant.js.tk/draw/dev-curve-tangents.js" as loaded under (personal, incomplete url) https://tk.js.bluelephant.dyn-o-saur.com/
	  */
	private getHtmlForWebview(webview: vscode.Webview): string {
		var langDB: {[_: string]: string} = {}
		const lang = (key: keyof typeof langDB) => langDB[key] || key
		
		var uris: {[_: string]: vscode.Uri} = {}
		const uri = (key: keyof typeof uris) => uris[key]
		var vars = {webview, nonce: getNonce(), uri, lang}
		
		uris.			  node_modules	=						vscode.Uri.joinPath(this.context			 .extensionUri,	'node_modules'		)
		uris.		  underscoreScript	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'underscore'							,'underscore'				+'.js'	))
		uris.	  min_underscoreScript	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'underscore'							,'underscore'		+'-min'	+'.js'	))
		uris.			  jqueryScript	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'jquery'						,'dist'	,'jquery'					+'.js'	))
		uris.		  min_jqueryScript	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'jquery'						,'dist'	,'jquery'			+'.min'	+'.js'	))
		uris.	  bluelephant_tkScript	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'com.dyn-o-saur.bluelephant.js.tk'		,'bluelephant_tk'			+'.js'	))
		uris. min_bluelephant_tkScript	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'com.dyn-o-saur.bluelephant.js.tk'		,'bluelephant_tk'	+'.min'	+'.js'	))
		
		uris.				  codicons	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'@vscode/codicons'				,'dist'	,'codicon'					+'.css'	)) //cspell:ignore codicons
		uris.			   fontAwesome	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'@fortawesome/fontawesome-free'	,'css'	,'all'						+'.css'	)) //cspell:ignore fortawesome fontawesome
		uris.		   min_fontAwesome	= webview.asWebviewUri(	vscode.Uri.joinPath(uris.				   node_modules,	'@fortawesome/fontawesome-free'	,'css'	,'all'				+'.min'	+'.css'	)) //cspell:ignore fortawesome fontawesome
		
		uris.	commonRsc				=						vscode.Uri.joinPath(this.context			 .extensionUri,	'rsc'																		)
		uris.	commonStyleReset		= webview.asWebviewUri(	vscode.Uri.joinPath(uris.					  commonRsc,	'reset'																+'.css'	))
//		uris.	commonStyleVSCode		= webview.asWebviewUri(	vscode.Uri.joinPath(uris.					  commonRsc,	'vscode'															+'.css'	))
		
		uris. specificRsc				=						vscode.Uri.joinPath(this.context			 .extensionUri,	'rsc', 'storyboard'															)
//		uris. specificStyle				= webview.asWebviewUri(	vscode.Uri.joinPath(uris.					specificRsc,	'main'																+'.css'	))
		uris. specificScript			= webview.asWebviewUri(	vscode.Uri.joinPath(uris.					specificRsc,	'main'																+'.js'	))
		
		const specificRscPath				=										this.context.asAbsolutePath(path.join(	'rsc', 'storyboard'															))
		const specificHypertextPath			=																	path.join(	specificRscPath, 'main'												+'.html')
		// tnx https://jesusalmarazmartin.medium.com/extensions-for-vscode-webviews-without-hardcoding-68779565ef89
		const specificHypertext = fs.readFileSync(specificHypertextPath, 'utf8')
		
		return StoryboardEditorProvider.evalTemplateString(specificHypertext, vars)
	}

/*	private addNewScratch(document: vscode.TextDocument) {
		const json = this.getDocumentAsJson(document);

		return this.updateTextDocument(document, json);
	}

	private deleteScratch(document: vscode.TextDocument, id: string) {
		const json = this.getDocumentAsJson(document);

		return this.updateTextDocument(document, json);
	}

	private getDocumentAsJson(document: vscode.TextDocument): any {
		const text = document.getText();
		if (text.trim().length === 0) {
			return {};
		}

		try {
			return JSON.parse(text);
		} catch {
			throw new Error('Could not get document as json. Content is not valid json');
		}
	}

	private updateTextDocument(document: vscode.TextDocument, json: any) {
		const edit = new vscode.WorkspaceEdit();

		// Just replace the entire document every time for this example extension.
		// A more complete extension should compute minimal edits instead.
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			JSON.stringify(json, null, 2));

		return vscode.workspace.applyEdit(edit);
	}*/
}