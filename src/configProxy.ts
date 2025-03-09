import * as vscode from "vscode"

export default function<T extends vscode.WorkspaceConfiguration>(section?: string, scope?: vscode.ConfigurationScope): T {
//	function args(key: string): [string]|[string, vscode.ConfigurationScope] {key = `${section}.${key}`; return !scope ? [key] : [key, scope]} // fuck typescript making this unusable as vscode.workspace.getConfiguration(...args(key))
	function conf(key: string) {return !scope ? vscode.workspace.getConfiguration(key) : vscode.workspace.getConfiguration(key, scope)}
	return new Proxy({}, {
//		get(obj: any, key: keyof any, prx: any) {let val=obj[key]; if("function"==typeof val) val=val.call(obj); return val}, // repl: (new Proxy({v:"v",get g(){return{this:this,arguments,v:this.v}}},{get(o,k,p){let v=o[k];if("function"==typeof v)v=v.call(o);return{this:this,arguments,v:v}}})).g.v.v // basic pass-thru w/ getter support
//		get(obj: any, key: keyof any, prx: any) {let prp=Object.getOwnPropertyDescriptor(obj, key); return prp.get ? prp.get.call(obj) : prp.value}, // repl: (new Proxy({v:"v",get g(){return{this:this,arguments,v:this.v}},f(k){return{this:this,arguments,v:this[k]}}},{get(o,k,p){let d=Object.get=Object.getOwnPropertyDescriptor(o,k),v=d.get?d.get.call(o):d.value;return{this:this,arguments,v:v}}})).g.v.v // basic pass-thru w/ getter support
		get(obj: any, key: string, prx: any) {if (~['has', 'get', 'inspect', 'update'].indexOf(key)) return conf(section)[key]; return	conf(section).get	(key		)				},
		set(obj: any, key: string, val: any) {if (~['has', 'get', 'inspect', 'update'].indexOf(key)) return conf(section)[key]; 		conf(section).update(key, val	); return true	},
		// vscode.workspace.getConfiguration('section.testBool') // vscode.WorkspaceConfiguration
		// vscode.workspace.getConfiguration('section.testBool').get() // undefined
		// vscode.workspace.getConfiguration().get('section.testBool') // boolean
		// vscode.workspace.getConfiguration('section').get('testBool') // boolean
		// vscode.workspace.getConfiguration('section').testBool // boolean
		// vscode.workspace.getConfiguration('section') // vscode.WorkspaceConfiguration bute note that the whole config is apparently retrieved in this call and NOT updated when getting sub-keys :(
	})
}