'use strict';

import * as child_process from 'child_process';
import * as vscode from 'vscode';
import {IConfiguration, ICommandConfiguration, IFormConfiguration} from './configuration';
import { strtr } from './strtr';

export function activate(context: vscode.ExtensionContext) {
	const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('Run Me');

	let registeredCommands: { [id: string]: vscode.Disposable } = {};
	const registerCustomCommands = () => {
		const configuration = vscode.workspace.getConfiguration().get<IConfiguration>('run-me');

		if (!configuration) {
			return;
		}

		// Unregister commands
		for (let key in registeredCommands) {
			registeredCommands[key].dispose();
		}
		registeredCommands = {};

		const commands: { [id: string]: boolean } = {};
		for (const command of configuration.commands) {
			if (!command.identifier) {
				continue;
			}

			if (commands[command.identifier]) {
				continue;
			}

			commands[command.identifier] = true;

			registeredCommands[command.identifier] = vscode.commands.registerCommand('run-me.' + command.identifier, () => {
				console.log(command);
				executeCommand(command);
			});
		}
	};

	registerCustomCommands();

	const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(() => {
		outputChannel.appendLine('Configuration changed... Refreshing...');
		registerCustomCommands();
		outputChannel.appendLine('Refresh done!');
	});

	const getVariables = () => {
		const configuration = vscode.workspace.getConfiguration().get<IConfiguration>('run-me');

		if (!configuration) {
			return {};
		}

		// We do this because configuration.variables is a proxy to the data, so we can't use it as a dumb object
		let variables: { [id: string]: string } = {};
		for (let key in configuration.variables) {
			variables[key] = configuration.variables[key];
		}

		return variables;
	};

	const resolveVariables = function(text: string, variables: { [id: string]: string }) {
		return strtr(text, variables);
	}

	const executeCommand = (command: ICommandConfiguration) => {
		const executeCommandInShell = () => {
			let builtCommand = command.command;

			builtCommand = resolveVariables(builtCommand, variables);

			const options = {
				cwd: command.working_directory ? resolveVariables(command.working_directory, variables) : undefined,
			};

			outputChannel.appendLine('Executing command: ' + builtCommand + ' with options ' + JSON.stringify(options));

			child_process.exec(builtCommand, options, (err, stdout, stderr) => {
				if (err) {
					console.error(err);
					return;
				}

				outputChannel.append(stdout);
			});
		};

		const variables: { [id: string]: string } = getVariables();
		const form = command.form;
		if (form && form.length > 0) {
			let currentStep = 0;
			const firstStep = form[currentStep];

			const askQuestion = (step: IFormConfiguration) => {
				if (step.options) {
					return vscode.window.showQuickPick(step.options, {
						placeHolder: step.question,
						ignoreFocusOut: true,
					});
				} else {
					return vscode.window.showInputBox({
						prompt: step.question,
						value: step.default,
						ignoreFocusOut: true,
					});
				}
			};

			const instantiateQuestion = (step: IFormConfiguration): any => {
				console.log('Displaying question', step.question);
				return askQuestion(step).then((value?: string) => {
					console.log(step.question);
					console.log(value);
					if (!value) {
						return;
					}

					variables[step.variable] = value;
					++currentStep;

					if (!form[currentStep]) {
						executeCommandInShell();
						return;
					}

					return instantiateQuestion(form[currentStep]);
				});
			};

			return instantiateQuestion(firstStep);
		} else {
			executeCommandInShell();
		}
	};

	const runCommand = vscode.commands.registerCommand('run-me.run', () => {
		const configuration = vscode.workspace.getConfiguration().get<IConfiguration>('run-me');

		if (!configuration) {
			return;
		}

		const commands: { [id: string]: ICommandConfiguration } = {};
		for (const command of configuration.commands) {
			commands[command.description] = command;
		}

		const items: Array<string> = [];
		for (const command of configuration.commands) {
			items.push(command.description);
		}

		vscode.window.showQuickPick(items, {
			placeHolder: 'Which command do you want to run?',
			ignoreFocusOut: true,
		}).then((value?: string) => {
			if (!value) {
				return;
			}

			const command = commands[value];

			executeCommand(command);
		});
	});

	const createCommand = vscode.commands.registerCommand('run-me.create', () => {
		vscode.window.showInformationMessage('Create');
	});

	context.subscriptions.push(
		onDidChangeConfiguration,
		runCommand,
		createCommand
	);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
