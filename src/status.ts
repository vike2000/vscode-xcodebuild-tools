import * as vscode from "vscode";
import * as child_process from "child_process";

import {doubleQuote} from "shescuote"; //cspell:ignore shescuote

import {ExtensionConfiguration} from "./config";
import configProxy from "./configProxy";

export enum State {
    PASSED,
    STARTED,
    FAILED,
}

export interface Status {
    state: State
    proc?: child_process.ChildProcess
}

export interface Statuses {
    conf    ?: Status
    project ?: Status
    clean   ?: Status
    build   ?: Status
    run     ?: Status
    debug   ?: Status
    profile ?: Status
}

export interface Specification {
    prio: number
    command: string
    tooltip: string
    text: string
    textStarted?: string
    requireDebugConfig?: true,
}

export class StatusBar implements vscode.Disposable {
    private confSection = 'xcodebuild-tools'
    private extConf = configProxy(this.confSection)

    private itemSpecs: {[_:string]: Specification} = {
        build: {
            prio: 5.200,
            text: "$(gear) xcodebuild",
            command: "xcodebuild-tools.build",
            tooltip: "Build the project",
            textStarted: "$(gear~spin) xcodebuild:",
        },
        reloadProject: {
            prio: 5.100,
            text: "$(refresh)",
            command: "xcodebuild-tools.reloadProject",
            tooltip: "Reload project",
        },
        kill: {
            prio: 5.000,
            text: "$(x)",
            command: "xcodebuild-tools.kill",
            tooltip: "Kill current build",
        },
        scheme: {
            prio: 4.900,
            text: "$(menu)",
            command: "xcodebuild-tools.selectScheme",
            tooltip: "Select the scheme",
        },
        buildConfig: {
            prio: 4.800,
            text: "$(menu)",
            command: "xcodebuild-tools.selectBuildConfiguration",
            tooltip: "Select the build configuration",
        },
        debugConfig: {
            prio: 4.700,
            text: "$(menu)",
            command: "xcodebuild-tools.selectDebugConfiguration",
            tooltip: "Select the debug configuration",
        },
        buildAndDebug: {
            prio: 4.600,
            text: "$(gear)$(debug-alt-small)",
            command: "xcodebuild-tools.buildAndDebug",
            tooltip: "Launch the debugger (with building) for the selected debug configuration",
            requireDebugConfig: true,
        },
        debug: {
            prio: 4.500,
            text: "$(debug-alt-small)",
            command: "xcodebuild-tools.debug",
            tooltip: "Launch the debugger (without building) for the selected debug configuration",
            requireDebugConfig: true,
        },
        buildAndProfile: {
            prio: 4.400,
            text: "$(gear)$(dashboard)",
            command: "xcodebuild-tools.buildAndProfile",
            tooltip: "Profile (without building) the selected debug configuration",
            requireDebugConfig: true,
        },
        profile: {
            prio: 4.300,
            text: "$(dashboard)",
            command: "xcodebuild-tools.profile",
            tooltip: "Profile (without building) the selected debug configuration",
            requireDebugConfig: true,
        },
        buildAndRun: {
            prio: 4.200,
            text: "$(gear)$(play)",
            command: "xcodebuild-tools.buildAndRun",
            tooltip: "Run (without building and debugging) the selected debug configuration",
            requireDebugConfig: true,
        },
        run: {
            prio: 4.100,
            text: "$(play)",
            command: "xcodebuild-tools.run",
            tooltip: "Run (without building and debugging) the selected debug configuration",
            requireDebugConfig: true,
        },
        attach: {
            prio: 4.000,
            text: "$(bug)",
            command: "xcodebuild-tools.attach",
            tooltip: "Attach debugger (without building) by the selected debug configuration",
            requireDebugConfig: true,
        },
    }
    private items = <{[_:string]: vscode.StatusBarItem}>{}

    constructor() {
        this.configureItems()
    }

    public forAllItems(f: (id: string, item: vscode.StatusBarItem) => void) {
        for (let id in this.items) f(id, this.items[id])
    }

    public dispose() {
        this.forAllItems((id, item) => item.dispose());
    }

    public hide() {
        this.forAllItems((id, item) => item.hide());
    }

    public configureItems() {
        this.dispose()
        let ids     = (this.extConf.get('statusBarItems'            ) || this.extConf.inspect('statusBarItems'          ).defaultValue) as string[]             || []
        let prios   = (this.extConf.get('statusBarItemPriorities'   ) || this.extConf.inspect('statusBarItemPriorities' ).defaultValue) as {[_:string]: number} || {} //cspell:ignore prios
        for (let id of ["build"].concat(ids)) {
            let                             spec = this.itemSpecs[id]
            if (!                           spec) {
                vscode.window.showWarningMessage(`[${this.confSection}] Setting statusBarItems should only contain ${doubleQuote(Object.keys(this.itemSpecs)).join(", ")}: ${id}`)
            } else {
                let prio = prios[id] ||     spec.prio || 4.500
                this.items[id] = vscode.window.createStatusBarItem(id, vscode.StatusBarAlignment.Left, prio)
                this.items[id].text     =   spec.text + (id == "build" ? ":" : "")
                this.items[id].command  =   spec.command
                this.items[id].tooltip  =   spec.tooltip
            }
        }
    }

    public update(statuses: Statuses, buildConfig: string, debugConfig: string, schemeName: string) {
        this.configureItems();
        
        let strings = [];
        let anySTARTED = false;
        for (let status in statuses) {
            switch (statuses[status].state) { case NaN:
                break; case State.STARTED:
                    anySTARTED = true;
                    strings.push(status + ": " + "started");
                break; case State.FAILED:
                    strings.push(status + ": " + "see output for failure");
            }
        }
        this.items.build.tooltip =
        this.itemSpecs.build.tooltip + "\n" + strings.join("\n")
        this.items.build.text = anySTARTED ?
        this.itemSpecs.build.textStarted :
        this.itemSpecs.build.text;
        if (this.items.scheme) this.items.scheme.text = schemeName || "$(menu)";
        if (this.items.buildConfig) this.items.buildConfig.text = buildConfig || "$(menu)";
        if (this.items.debugConfig) this.items.debugConfig.text = debugConfig || "$(menu)";

        this.forAllItems((id, item) => {
            if (debugConfig === null && this.itemSpecs[id].requireDebugConfig)
                item.hide();
            else
                item.show();
        });
    }
}
