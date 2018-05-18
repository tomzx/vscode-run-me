'use strict';

import * as vscode from 'vscode';
import { CommandManager } from './command_manager';
import { CommandRunner } from './command_runner';
import { VariableManager } from './variable_manager';

export function activate(context: vscode.ExtensionContext) {
	const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('Run Me');
	const variableManager = new VariableManager;
	const commandRunner = new CommandRunner(variableManager);
	const commandManager = new CommandManager(commandRunner);

	// Initial command registration
	commandManager.registerCustomCommands();

	const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(() => {
		outputChannel.appendLine('Configuration changed... Refreshing...');
		commandManager.registerCustomCommands();
		outputChannel.appendLine('Refresh done!');
	});

	const runCommand = vscode.commands.registerCommand('run-me.run', () => commandRunner.runCommand());

	context.subscriptions.push(
		onDidChangeConfiguration,
		runCommand
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
