import * as vscode from "vscode";

export class StatusBar implements vscode.Disposable {
    //dprint-ignore
    private buildStatusItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5.04);
    //dprint-ignore
    private buildConfigStatusItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5.03);
    //dprint-ignore
    private debugStatusItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5.021);
    //dprint-ignore
    private runStatusItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5.02);
    //dprint-ignore
    private debugConfigStatusItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5.01);
    //dprint-ignore
    private killStatusItem =
        vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 5.00);

    constructor() {
        this.buildStatusItem.command = "xcodebuild-tools.build";
        this.buildStatusItem.tooltip = "Click to build the project";
        this.buildStatusItem.text = "$(gear) xcodebuild:";

        this.buildConfigStatusItem.command = "xcodebuild-tools.selectBuildConfiguration";
        this.buildConfigStatusItem.tooltip = "Click to select the build configuration";

        this.debugStatusItem.command = "xcodebuild-tools.debug";
        this.debugStatusItem.tooltip = "Click to launch the debugger for the selected debug configuration";
        this.debugStatusItem.text = "$(bug)";

        this.runStatusItem.command = "xcodebuild-tools.run";
        this.runStatusItem.tooltip = "Click to run (without debugging) the selected debug configuration";
        this.runStatusItem.text = "$(triangle-right)";

        this.debugConfigStatusItem.command = "xcodebuild-tools.selectDebugConfiguration";
        this.debugConfigStatusItem.tooltip = "Click to select the debug configuration";

        this.killStatusItem.command = "xcodebuild-tools.kill";
        this.killStatusItem.tooltip = "Click to kill current build";
        this.killStatusItem.text = "$(x)";
    }

    public forAllItems(f: (item: vscode.StatusBarItem) => void) {
        f(this.buildStatusItem);
        f(this.buildConfigStatusItem);
        f(this.debugStatusItem);
        f(this.runStatusItem);
        f(this.debugConfigStatusItem);
        f(this.killStatusItem);
    }

    public dispose() {
        this.forAllItems(i => i.dispose());
    }

    public hide() {
        this.forAllItems(i => i.hide());
    }

    public update(buildConfig: string, debugConfig: string) {
        this.buildConfigStatusItem.text = buildConfig;
        this.debugConfigStatusItem.text = debugConfig;

        this.forAllItems((i) => {
            if (
                debugConfig === null
                && (i === this.debugStatusItem || i === this.runStatusItem || i === this.debugConfigStatusItem)
            ) {
                i.hide();
            } else {
                i.show();
            }
        });
    }
}
