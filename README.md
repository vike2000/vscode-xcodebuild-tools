[![Build Status](https://dev.azure.com/baruchs/vscode-xcodebuild-tools/_apis/build/status/sterin.vscode-xcodebuild-tools?branchName=master)](https://dev.azure.com/baruchs/vscode-xcodebuild-tools/_build/latest?definitionId=5&branchName=master)

# Xcodebuild-tools

Work with Xcode projects from inside Visual Studio Code.

Feedback is highy appreciated! Let me know if this works for you? Are there any showstopping bugs? Any features missing?

## Caveats

* First release, my first non-trivial TypeScript/JavaScript program - expect bugs, problems, and non-idiomatic code.
* Only useful for macOS apps at this point.
* Managing the project (adding files, changing settings, etc.) has to be done using Xcode itself.

## Features

* Build/Clean/Debug/Run Xcode workspsaces from within vscode.
* Switch between configurations (Debug/Release)
* Debug directly from vscode - easily define debug configuration.
* Status bar items that make it easy to build, debug, switch build and debug configurations.

## macOS Example

The subdirectory `examples/helloworld` contains a working example. Open VScode there.

Alternatively, in a new directory:

1. Create a new Xcode command line project, with the original name `project`.

2. Create a new Xcode workspace named `workspace` in the same directory. Add the project to the workspace.

3. Create a new scheme named `build` inside the workspace and add `project` to the scheme.

4. Create a configuration as a file named `.vscode/xcodebuild-tools.json`:

```json
{
    "workspace": "${workspaceRoot}/workspace.xcworkspace",
    "scheme": "build",
    "variables": {
        "ARG1": "argument 1",
        "ARG2": "argument 2"
    },
    "postBuildTasks": [
        {
            "name": "Sleep for a few seconds",
            "program": "sleep",
            "args": [ "3" ],
            "cwd": "${workspaceRoot}"
        }
    ],
    "debugConfigurations": [
        {
            "name": "test",
            "cwd": "${workspaceRoot}",
            "program": "${buildPath}/project",
            "args": [
                "${ARG1}",
                "${ARG2}"
            ]
        }
    ] 
}
```

5. Use `xcodebuild-tools` command to build, debug, run, clean, switch build configuration, and switch debug configurations.

6. Use the status bar to build, debug, switch configurations or kill the build.

## iOS Example

The subdirectory `examples/helloworld-ios` contains a working example. Open VScode there.

Alternatively, in a new directory:

1. Create an iOS example similar to above, but for iOS.

2. Install `ios-sim` using `npm`:

```shell
    npm install --global ios-sim
```

3. Use a configuration file similar to the following one:

```json
{
    "variables": {
        "SDK_VERSION": "11.4"
    },
    "sdk": "iphonesimulator${SDK_VERSION}",
    "workspace": "${workspaceRoot}/helloworld-ios.xcworkspace",
    "scheme": "build",
    "debugConfigurations": [
        {
            "name": "Simulator",
            "cwd": "${buildPath}",
            "program": "ios-sim",
            "args": [
                "launch", "project.app/",
                "--devicetypeid",  "com.apple.CoreSimulator.SimDeviceType.iPhone-7, ${SDK_VERSION}"
            ]
        }        
    ]
}
```

4. Use `xcodebuild-tools` commands to build and run the project in the simulator.


## Credits

* Heavily influenced by the great [CMake-Tools](https://github.com/vector-of-bool/vscode-cmake-tools) extension. 
* Code derived from the basic extension generated by [`yo code`](https://github.com/Microsoft/vscode-generator-code).
