"use strict";

import * as path from "path";
import * as child_process from "child_process";

import * as ajv from "ajv";
import * as vscode from "vscode";

import {bashEscapeOrSingleQuote as shescuote} from "shescuote"; //cspell:ignore shescuote

// personal bash command line to inspect errors from `vsce package`; that time solved by `npm unlink shescuote` && `npm install git+ssh://git@bitbucket.org/vike/shescuote.git`
// $ (vjshon_file='npm list --depth=99999 --json >'.json && vjshon+# problems && while vjshon++‹;do line=$(vjshon@ -u) && regex='invalid:\ ([^@]+)@([^ ]+)\ ((.*)/(node_modules)/(.*))' && declare -A match && match into match: "$line" by "$regex" keyed-by: _ name vers path path_{pfx,ifx,sfx} && echo "$(echo "${match[path]}"|vpath_compact.awk)$(test ! -L "${match[path]}"||(target=$(readlink "${match[path]}"|vpath_compact.awk) && printf ' -> %s <- %s' "$target" "$(vpa "$target" "${match[path_pfx]}/${match[path_ifx]}"|vpath_compact.awk)"))" ||{ echo no match …: "$line" by "$regex" && break ;};done) #cspell:ignore vjshon

import {ExtensionConfiguration} from "./config";
import * as util from "./util";
import * as expander from "./expand";
import * as diagnostics from "./diagnostics";
import {State, Statuses, StatusBar} from "./status";
import configProxy from "./configProxy";

interface TaskConfiguration {
    name: string;
    cwd: string;
    program: string;
    args: string[];
}

interface XcodebuildToolsConfiguration {
    sdk?: string;
    workspace?: string;
    scheme?: string;
    variables?: Map<string, string>;
    args?: string[];
    env?: Map<string, string>;
    preBuildTasks?: TaskConfiguration[];
    postBuildTasks?: TaskConfiguration[];
    debugConfigurations?: TaskConfiguration[];
}

const DefaultConfiguration: XcodebuildToolsConfiguration = {
    sdk: null,
    workspace: null,
    scheme: null,
    variables: new Map<string, string>(),
    args: [],
    env: new Map<string, string>(),
    preBuildTasks: [],
    postBuildTasks: [],
    debugConfigurations: [],
};

//const BuildConfigurations: string[] = ["Debug", "Profile", "Release"];

interface SpawnOptions {
    env?: Map<string, string>;
    cwd?: string;
    program: string;
    args: string[];

    channel: vscode.OutputChannel;
    initChannel?: boolean;

    message?: string;
    parseOutput?: boolean;
}

function expand(e: expander.Expander, opts: SpawnOptions): SpawnOptions {
    return {
        env: e.expand(opts.env),
        cwd: e.expand(opts.cwd),
        program: e.expand(opts.program),
        args: e.expand(opts.args),

        channel: opts.channel,
        initChannel: opts.initChannel,

        message: e.expand(opts.message),
        parseOutput: opts.parseOutput,
    };
}

class Extension {
    private confSection = 'xcodebuild-tools'
    private extConf = configProxy(this.confSection)

    private schemaPath = path.join(this.context.extensionPath, "schemas", "xcodebuild-tools-schema.json");

    private readonly configFilePath = path.join(vscode.workspace.rootPath, ".vscode", "xcodebuild-tools.json");

    private readonly statusBar = new StatusBar();

    private diag = vscode.languages.createDiagnosticCollection("xcodebuild-tools");

    private _combinedOutputChannel: vscode.OutputChannel;
    private get combinedOutputChannel() {
        return (this._combinedOutputChannel ||= vscode.window.createOutputChannel("xcodebuild-tools"))
    }

    private _loadProjectOutputChannel: vscode.OutputChannel;
    private get loadProjectOutputChannel() {
        return this.extConf.separateLogChannels ?
            (this._loadProjectOutputChannel ||= vscode.window.createOutputChannel("xcodebuild-tools load")) :
            this.combinedOutputChannel
    }
    private _buildOutputChannel: vscode.OutputChannel;
    private get buildOutputChannel() {
        return this.extConf.separateLogChannels ?
            (this._buildOutputChannel ||= vscode.window.createOutputChannel("xcodebuild-tools build")) :
            this.combinedOutputChannel
    }
    private _runOutputChannel: vscode.OutputChannel;
    private get runOutputChannel() {
        return this.extConf.separateLogChannels ?
            (this._runOutputChannel ||= vscode.window.createOutputChannel("xcodebuild-tools run")) :
            this.combinedOutputChannel
    }

    private status: Statuses = {}

    private xcbtConf: XcodebuildToolsConfiguration = null; //cspell:ignore xcbt

    private xcodebuildList = <{[_:string]: string[]}>{};

    private addDisposable(d: vscode.Disposable): void {
        this.context.subscriptions.push(d);
    }

    public constructor(private context: vscode.ExtensionContext) {
        const commandNames = [
            "loadProject",
            "clean",
            "build",
            "buildAndDebug",
            "debug",
            "attach",
            "buildAndProfile",
            "profile",
            "buildAndRun",
            "run",
            "kill",
            "selectBuildConfiguration",
            "selectDebugConfiguration",
            "selectScheme",
            "openXcode",
        ];

        for (let name of commandNames) {
            context.subscriptions.push(vscode.commands.registerCommand(`xcodebuild-tools.${name}`, () => {
                if (!vscode.workspace.registerTextDocumentContentProvider) {
                    vscode.window.showErrorMessage("Extension [xcodebuild-tools] requires an open folder");
                    return;
                } else if (!this.xcbtConf) {
                    vscode.window.showErrorMessage(
                        "Extension [xcodebuild-tools] requires a correctly formatted .vscode/xcodebuild-tools.json",
                    );
                    return;
                } else {
                    this[name]();
                }
            }));
        }

        const configWatcher = vscode.workspace.createFileSystemWatcher(this.configFilePath);
        this.addDisposable(configWatcher);

        this.addDisposable(configWatcher.onDidCreate((uri: vscode.Uri) => this.reloadConfig(uri.fsPath)));
        this.addDisposable(configWatcher.onDidChange((uri: vscode.Uri) => this.reloadConfig(uri.fsPath)));
        this.addDisposable(configWatcher.onDidDelete((uri: vscode.Uri) => this.reloadConfig(uri.fsPath)));

        this.addDisposable(this.statusBar);
        this.addDisposable(this.diag);
        this.addDisposable(this.combinedOutputChannel);
        this.addDisposable(this.loadProjectOutputChannel);
        this.addDisposable(this.buildOutputChannel);
        this.addDisposable(this.runOutputChannel);

        vscode.workspace.onDidChangeConfiguration(ev => {
            if (
                ev.affectsConfiguration(`${this.confSection}.statusBarItems`) ||
                ev.affectsConfiguration(`${this.confSection}.statusBarItemPriorities`)
            ) {
                this.updateStatus();
            }
        })
    }

    private validateConfig: ajv.ValidateFunction;

    public async setup() {
        this.validateConfig = await util.readSchema(this.schemaPath);
        this.reloadConfig(this.configFilePath);
    }

    private async reloadConfig(fileName: string) {
        this.status.conf = {state: State.STARTED};
        this.updateStatus();

        try {
            let config = await util.readJSON(fileName, this.validateConfig);

            if (config.variables) {
                config.variables = new Map<string, string>(util.entries(config.variables));
            }

            if (config.env) {
                config.env = new Map<string, string>(util.entries(config.env));
            }

            this.status.conf = {state: State.PASSED};
            this.xcbtConf = util.merge(DefaultConfiguration, config);

            this.reloadProject()
        } catch (e) {
            this.status.conf = {state: State.FAILED};
            this.xcbtConf = null;
            vscode.window.showErrorMessage(`[xcodebuild-tools]: ${e.message}`);
        }

        this.updateStatus();
    }

    private getWorkspaceState<T>(
        key: string,
        legal: (val: T) => boolean,
        otherwise: (key: string) => T,
        valid: () => boolean = () => true,
    ) {
        if (!valid()) {
            return null;
        }

        let val = this.context.workspaceState.get<T>(key);

        if (!val || !legal(val)) {
            val = otherwise(key);
            this.context.workspaceState.update(key, val);
        }

        return val;
    }

    get schemeName(): string {
        return this.getWorkspaceState<string>(
            "scheme",
            (val: string) => this.xcodebuildList['Schemes'].indexOf(val) !== -1,
            (key: string) => this.xcodebuildList['Schemes'][0],
            () => !!this.xcodebuildList['Schemes']
        );
    }

    set schemeName(config: string) {
        this.context.workspaceState.update("scheme", config);
        this.updateStatus();
    }

    get scheme(): TaskConfiguration {
        let name = this.debugConfigName;
        return this.xcbtConf.debugConfigurations.find(dc => dc.name === name);
    }

    get buildConfig(): string {
        return this.getWorkspaceState<string>(
            "buildConfig",
            (val: string) => this.xcodebuildList['Build Configurations'].indexOf(val) !== -1,
            (key: string) => this.xcodebuildList['Build Configurations'][0],
            () => !!this.xcodebuildList['Build Configurations']
        );
    }

    set buildConfig(config: string) {
        this.context.workspaceState.update("buildConfig", config);
        this.updateStatus();
    }

    get debugConfigName(): string {
        return this.getWorkspaceState<string>(
            "debugConfig",
            (val: string) => this.xcbtConf.debugConfigurations.some((t) => t.name == val),
            (key: string) => this.xcbtConf.debugConfigurations[0].name,
            () => this.xcbtConf.debugConfigurations.length > 0,
        );
    }

    set debugConfigName(config: string) {
        this.context.workspaceState.update("debugConfig", config);
        this.updateStatus();
    }

    get debugConfig(): TaskConfiguration {
        let name = this.debugConfigName;
        return this.xcbtConf.debugConfigurations.find(dc => dc.name === name);
    }

    private updateStatus() {
        if (this.xcbtConf) {
            this.statusBar.update(this.status, this.buildConfig, this.debugConfigName, this.schemeName);
        } else {
            this.statusBar.hide();
        }
    }

    private expander(): expander.Expander {
        const M = new Map<string, string>();

        M.set("workspaceRoot", vscode.workspace.rootPath);
        M.set("buildRoot", "${workspaceRoot}/build");
        M.set("buildConfig", this.buildConfig);
        M.set("buildPath", "${buildRoot}/${buildConfig}");

        for (let [v, val] of this.xcbtConf.variables) {
            M.set(v, val);
        }

        return new expander.Expander(M);
    }

    private spawn(args: SpawnOptions): child_process.ChildProcess {
        args.channel.appendLine(`[xcodebuild-tools] will spawn${
            !args.cwd     ? '' :    ' @ '   + shescuote(args.cwd      ) + ': '   }${
            !args.program ? '' :    ' '     + shescuote(args.program  )          }${
            !args.args    ? '' :    ' '     + shescuote(args.args     ).join(' ')}`);
        let proc = util.spawn(args.program, args.args, args.cwd, args.env);

        util.redirectToChannel(proc, args.channel, args.initChannel);

        if (args.parseOutput) {
            diagnostics.parseOutput(this.diag, proc.stdout);
        }

        if (args.message) {
            args.channel.appendLine(`[xcodebuild-tools]: ${args.message}`);
        }

        args.channel.appendLine(`[xcodebuild-tools]: Running: ${args.program} ${args.args.join(" ")}`);

        if (args.cwd) {
            args.channel.appendLine(`[xcodebuild-tools]: Working Directory: ${args.cwd}`);
        }

        proc.on("terminated", (message: string) => {
            args.channel.appendLine(`[xcodebuild-tools]: ${message}`);
        });

        return proc;
    }

    private async asyncSpawn(statusKey: string, args: SpawnOptions) {
        return new Promise<child_process.ChildProcess>((resolve, reject) => {
            this.status[statusKey] = {state: State.STARTED, proc: this.spawn(args)};
            this.updateStatus();

            this.status[statusKey].proc.on("fail", (message: string) => {
                this.status[statusKey].state = State.FAILED;
                this.updateStatus();
                reject(new Error(message));
            });

            this.status[statusKey].proc.on("success", (message: string) => {
                this.status[statusKey].state = State.PASSED;
                this.updateStatus();
                resolve(this.status[statusKey].proc);
            });
        });
    }

    private async asyncSpawnXcodebuild(e: expander.Expander, command: string = ""): Promise<child_process.ChildProcess> {
        //dprint-ignore
        let args = [
            ...(!this.xcbtConf.workspace ? [] : ["-workspace",       this.xcbtConf.workspace]),
            "-scheme",          this.schemeName,
            "-configuration",   this.buildConfig,
            ...this.xcbtConf.args,
        ];

        if (this.xcbtConf.sdk) {
            args.push("-sdk", this.xcbtConf.sdk);
        }

        args.push("CONFIGURATION_BUILD_DIR=${buildPath}");

        if (command)
            args.push(command);

        let opts: SpawnOptions = {
            env: this.xcbtConf.env,
            cwd: vscode.workspace.rootPath,
            program: "xcodebuild",
            args: args,
            channel: this.buildOutputChannel,
            initChannel: false,
            parseOutput: true,
        };

        return await this.asyncSpawn(command || "build", expand(e, opts));
    }

    private async asyncSpawnTask(statusKey: string, e: expander.Expander, task: TaskConfiguration): Promise<child_process.ChildProcess> {
        let args: SpawnOptions = {
            env: this.xcbtConf.env,
            cwd: task.cwd,
            program: task.program,
            args: task.args,
            channel: this.buildOutputChannel,
            initChannel: false,
            message: `Running Task: ${task.name}`,
        };

        return await this.asyncSpawn(statusKey, expand(e, args));
    }

    private async guardBuild<T>(channel: vscode.OutputChannel, f: () => T): Promise<T | null> {
        if (this.status.build?.state == State.STARTED) {
            channel.appendLine(`[xcodebuild-tools]: command canceled for build in progress`);

            return;
        }

        if (this.extConf.saveAllOnBuild) vscode.workspace.saveAll();

        return await f();
    }

    private async asyncBuild(e: expander.Expander) {
        for (let task in this.xcbtConf.preBuildTasks) {
            await this.asyncSpawnTask(`preBuildTask ${task}`, e, this.xcbtConf.preBuildTasks[task]);
        }

        await this.asyncSpawnXcodebuild(e);

        for (let task in this.xcbtConf.postBuildTasks) {
            await this.asyncSpawnTask(`postBuildTasks ${task}`, e, this.xcbtConf.postBuildTasks[task]);
        }

        this.updateStatus();
    }

    public async reloadProject() {
        const e = this.expander();
        
        this.status.project = {state: State.STARTED};
        this.updateStatus();
        
        if (
            this.extConf.reloadStore && this.extConf.reloadStore.length &&
            await util.readJSON(e.expand(this.extConf.reloadStore))
            .catch(err => {
                if (err.code == 'ENOENT') // no entry (no such file …)
                    return false
                else {
                    this.status.project.state = State.FAILED;
                    throw err
                }
            }) // next `res && …` cause-of `return false` in `.catch` *before* `.then`
            .then(res => res && Object.keys(res).length &&
                (this.xcodebuildList = res))
        ) {
            this.status.project.state = State.PASSED;
            this.updateStatus()
        } else
            this.loadProject()
    }

    public async loadProject() {
        const e = this.expander();
        
        let opts: SpawnOptions = {
            env: this.xcbtConf.env,
            cwd: vscode.workspace.rootPath,
            program: "xcodebuild",
            //dprint-ignore
            args: [
                "-list", ...(!this.xcbtConf.workspace ? [] : ["-workspace",       this.xcbtConf.workspace]),
            ],
            channel: this.loadProjectOutputChannel,
            initChannel: false,
            parseOutput: false
        };
        if (this.extConf.separateLogChannels)
            opts.channel.clear();
        opts.channel.show();    // dev, also since vscode.OutputChannel has no method to tell us whether it's currently
                                // shown/showing; another option I've thought of apropos this is to have an extension
                                // setting to collapse all outputChannels into one...
        
        this.xcodebuildList = {};
        this.status.project = {state: State.STARTED, proc: this.spawn(expand(e, opts))};
        let stdout: string = ''; this.status.project.proc.stdout.on('data', (chunk: string) => stdout+=chunk)
        let stderr: string = ''; this.status.project.proc.stderr.on('data', (chunk: string) => stderr+=chunk)
        this.status.project.proc.on('close', async (code:number) => {
            if (code) {
                opts.channel.appendLine(`[xcodebuild-tools]: Reload run failed with error output: ${stderr}`)
                opts.channel.appendLine(`[xcodebuild-tools]: Reload run failed with exit code: ${code}`)
                opts.channel.show();
                return
            }
            // bash command line dev v0.2: < 'xcodebuild -list' FORCE_COLOR=1 node <(printf %s\\n 'let print = console.log' 'let argv = process.argv' "let fs = require('fs')" "let text = fs.readFileSync(0, 'utf-8')" 'let m, g, state = {}' 'for (let line of text.split(/\r\n|[\r\n]/)) if ((m = line.match(/^(?<indent>(?: {4})*)(?:(?<header>\S.+):|(?<entry>.*))$/)) && (g = m.groups)) if (g.indent.length/4 == 1 && g.header) { if (!argv[2]) { print(g.header) ; state.m = m ;} else if (g.header == argv[2]) state.m = m ;} else if (state.m) if (!argv[2]) { if (!g.indent) delete state.m ; else print("\t"+g.entry) ;} else if (!g.indent) process.exit(0) ; else if (g.indent.length/4 == 2) print(g.entry) ; else throw "unexpected line: "+line') #'Build Configurations'
            let m: RegExpMatchArray
            let g: typeof m.groups
            let h: typeof g[number] // header hold space
            for (const line of stdout.split(/\r\n|[\r\n]/))
                if ((m = line.match(/^(?<indent>(?: {4})*)(?:(?<header>\S.+):|(?<entry>.*))$/)) && (g = m.groups))
                    if (g.indent.length/4 == 1 && g.header) {
                        opts.channel.appendLine(`[xcodebuild-tools]: ${g.header}`)
                        h = g.header
                    } else if (h)
                        if (!g.indent) h = null
                        else {
                            opts.channel.appendLine(`[xcodebuild-tools]:   ${g.entry}`)
                            if (!this.xcodebuildList[h])
                                this.xcodebuildList[h] = [g.entry]
                            else
                                this.xcodebuildList[h].push(g.entry)
                        }

            if (this.extConf.reloadStore && this.extConf.reloadStore.length)
                await util.writeJSON(e.expand(this.extConf.reloadStore), this.xcodebuildList)

            this.status.project.state = State.PASSED;
            this.updateStatus();
        })
    }

    public clearLogChannelBeforeCommands(commandId: string) {
        return ~((this.extConf.get('clearLogChannelBeforeCommands') || this.extConf.inspect('clearLogChannelBeforeCommands').defaultValue) as string[] || []).indexOf(commandId)
    }
    public showLogChannelBeforeCommands(commandId: string) {
        return ~((this.extConf.get( 'showLogChannelBeforeCommands') || this.extConf.inspect( 'showLogChannelBeforeCommands').defaultValue) as string[] || []).indexOf(commandId)
    }

    public async build() {
        await this.guardBuild(this.buildOutputChannel, async () => {
            const e = this.expander();

            if (this.clearLogChannelBeforeCommands("build"))
                this.buildOutputChannel.clear();
            if (this.showLogChannelBeforeCommands("build"))
                this.buildOutputChannel.show();

            await this.asyncBuild(e);
        });
    }

    public async clean() {
        await this.guardBuild(this.buildOutputChannel, async () => {
            const e = this.expander();

            if (this.clearLogChannelBeforeCommands("clean"))
                this.buildOutputChannel.clear();
            if (this.showLogChannelBeforeCommands("clean"))
                this.buildOutputChannel.show();

            await this.asyncSpawnXcodebuild(e, "clean");
        });
    }

    public async buildAndDebug() {
        await this.guardBuild(this.runOutputChannel, async () => {
            const e = this.expander();

            if (this.clearLogChannelBeforeCommands("buildAndDebug"))
                this.buildOutputChannel.clear();
            if (this.showLogChannelBeforeCommands("buildAndDebug"))
                this.buildOutputChannel.show();

            this.status.debug = {state: State.STARTED};

            await this.asyncBuild(e)
            .catch(err => {
                this.status.debug.state = State.FAILED;
                this.updateStatus();

                throw err
            })
            
            await this.debug(e)
        })
    }
    public async debug(e?: expander.Expander) {
        await this.guardBuild(this.runOutputChannel, async () => {
            if (!e) {
                e = this.expander();

                if (this.clearLogChannelBeforeCommands("debug"))
                    this.buildOutputChannel.clear();
                if (this.showLogChannelBeforeCommands("debug"))
                    this.buildOutputChannel.show();

                this.status.debug = {state: State.STARTED};
            }
            const dc = this.debugConfig;
/*
            const config: vscode.DebugConfiguration = {
                name: e.expand(dc.name),
                type: "cppdbg",
                request: "launch",
                externalConsole: false,
                MIMode: "lldb",
                environment: [],
                cwd: e.expand(dc.cwd),
                program: e.expand(dc.program),
                args: e.expand(dc.args),
                stopAtEntry: false,
            };
*/
            const config: vscode.DebugConfiguration = {
                name: e.expand(dc.name),
                type: "lldb",
                request: "launch",
                env: {},
                cwd: e.expand(dc.cwd),
                program: e.expand(dc.program),
                args: e.expand(dc.args),
                stopAtEntry: false,
            };

            await vscode.debug.startDebugging(vscode.workspace.workspaceFolders![0], config);

            this.status.debug.state = State.PASSED;
            this.updateStatus();
        });
    }

    public async attach(e?: expander.Expander) {
        await this.guardBuild(this.runOutputChannel, async () => {
            if (!e) {
                e = this.expander();

                if (this.clearLogChannelBeforeCommands("attach"))
                    this.buildOutputChannel.clear();
                if (this.showLogChannelBeforeCommands("attach"))
                    this.buildOutputChannel.show();

                this.status.debug = {state: State.STARTED};
                this.updateStatus();
            }
            const dc = this.debugConfig;
/*
            const config: vscode.DebugConfiguration = {
                name: e.expand(dc.name),
                type: "cppdbg",
                request: "attach",
                externalConsole: false,
                MIMode: "lldb",
                program: e.expand(dc.program),
            };
*/
            const config: vscode.DebugConfiguration = {
                name: e.expand(dc.name),
                type: "lldb",
                request: "attach",
                program: e.expand(dc.program),
            };

            await vscode.debug.startDebugging(vscode.workspace.workspaceFolders![0], config);

            this.status.debug.state = State.PASSED;
            this.updateStatus();
        });
    }

    public async buildAndProfile() {
        await this.guardBuild(this.runOutputChannel, async () => {
            const e = this.expander();

            if (this.clearLogChannelBeforeCommands("buildAndProfile"))
                this.buildOutputChannel.clear();
            if (this.showLogChannelBeforeCommands("buildAndProfile"))
                this.buildOutputChannel.show();

            this.status.profile = {state: State.STARTED};

            await this.asyncBuild(e)
            .catch(err => {
                this.status.profile.state = State.FAILED;
                return false
            })
            
            await this.profile(e)
        })
    }
    public async profile(e?: expander.Expander) {
        await this.guardBuild(this.runOutputChannel, async () => {
            if (!e) {
                e = this.expander();

                if (this.clearLogChannelBeforeCommands("profile"))
                    this.buildOutputChannel.clear();
                if (this.showLogChannelBeforeCommands("profile"))
                    this.buildOutputChannel.show();

                this.status.profile = {state: State.STARTED};
                this.updateStatus();
            }

            const dc = this.debugConfig;

            let proc = util.spawn(
                "instruments",
                ["-t", "Time Profiler", e.expand(dc.program)].concat(e.expand(dc.args)),
                e.expand(dc.cwd),
            );

            util.redirectToChannel(proc, this.runOutputChannel, this.extConf.separateLogChannels);

            this.runOutputChannel.appendLine(
                `[xcodebuild-tools] Running: instruments -t "Time Profiler" ${e.expand(dc.program)} ${
                    e.expand(dc.args)
                }`,
            );

            proc.on("terminated", (message: string) => {
                this.runOutputChannel.append(`[xcodebuild-tools] ${message}`);

                this.status.profile.state = State.PASSED;
                this.updateStatus();
            });
        });
    }

    public async buildAndRun() {
        await this.guardBuild(this.runOutputChannel, async () => {
            const e = this.expander();

            if (this.clearLogChannelBeforeCommands("buildAndRun"))
                this.buildOutputChannel.clear();
            if (this.showLogChannelBeforeCommands("buildAndRun"))
                this.buildOutputChannel.show();

            this.status.run = {state: State.STARTED};

            await this.asyncBuild(e)
            .catch(err => {
                this.status.run.state = State.FAILED;
                return false
            })
            
            await this.run(e)
        })
    }
    public async run(e?: expander.Expander) {
        await this.guardBuild(this.runOutputChannel, async () => {
            if (!e) {
                e = this.expander();

                if (this.clearLogChannelBeforeCommands("run"))
                    this.buildOutputChannel.clear();
                if (this.showLogChannelBeforeCommands("run"))
                    this.buildOutputChannel.show();

                this.status.run = {state: State.STARTED};
                this.updateStatus();
            }

            let dc = {
                cwd     :e.expand(this.debugConfig.cwd        ),
                program :e.expand(this.debugConfig.program    ),
                args    :e.expand(this.debugConfig.args       ),
            }
            this.runOutputChannel.appendLine(`[xcodebuild-tools] will spawn${
                !dc.cwd     ? '' :  ' @ '   + shescuote(dc.cwd      ) + ': '   }${
                !dc.program ? '' :  ' '     + shescuote(dc.program  )          }${
                !dc.args    ? '' :  ' '     + shescuote(dc.args     ).join(' ')}`);
            let proc = util.spawn(e.expand(dc.program), e.expand(dc.args), e.expand(dc.cwd));

            util.redirectToChannel(proc, this.runOutputChannel, this.extConf.separateLogChannels);

            proc.on("terminated", (message: string) => {
                this.runOutputChannel.append(`[xcodebuild-tools] ${message}`);

                this.status.run.state = State.PASSED;
                this.updateStatus();
            });
        });
    }

    public kill() {
        for (let status in this.status)
            if (this.status[status].state == State.STARTED) {
                if (this.status[status].proc) {
                    this.runOutputChannel.append(`[xcodebuild-tools] killing process for ${status}`);
                    this.status[status].proc.kill("SIGTERM");
                } else
                    this.runOutputChannel.append(`[xcodebuild-tools] setting status of ${status} to failed`);
                this.status[status].state = State.FAILED;
            }
    }

    public async selectScheme() {
        let choice = await vscode.window.showQuickPick(this.xcodebuildList['Schemes']);

        if (choice) {
            this.schemeName = choice;
        }
    }

    public async selectBuildConfiguration() {
        let choice = await vscode.window.showQuickPick(this.xcodebuildList['Build Configurations']);

        if (choice) {
            this.buildConfig = choice;
        }
    }

    public async selectDebugConfiguration() {
        let items = this.xcbtConf.debugConfigurations.map(dc => dc.name);

        if (items.length > 0) {
            let choice = await vscode.window.showQuickPick(items);

            if (choice) {
                this.debugConfigName = choice;
            }
        }
    }

    public openXcode() {
        const e = this.expander();
        util.spawn("open", [e.expand(this.xcbtConf.workspace)], null);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    let ext = new Extension(context);
    await ext.setup();
}

export function deactivate() {
}
