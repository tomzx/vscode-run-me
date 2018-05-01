'use strict';

import * as child_process from 'child_process';
import * as vscode from 'vscode';
import {IConfiguration, ICommandConfiguration, IFormConfiguration} from './configuration';
import { strtr } from './strtr';

export function activate(context: vscode.ExtensionContext) {
	const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel('Run Me');

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

		vscode.window.showQuickPick(items).then((value?: string) => {
			if (!value) {
				return;
			}

			const command = commands[value];

			const executeCommand = () => {
				let builtCommand = command.command;

				builtCommand = strtr(builtCommand, variables);

				const options = {
					cwd: command.working_directory,
				};

				child_process.exec(builtCommand, options, (err, stdout, stderr) => {
					if (err) {
						console.error(err);
						return;
					}

					outputChannel.append(stdout);
				});
			};

			const variables: { [id: string]: string } = {};
			const form = command.form;
			if (form && form.length > 0) {
				let currentStep = 0;
				const firstStep = form[currentStep];

				const askQuestion = (step: IFormConfiguration) => {
					if (step.options) {
						return vscode.window.showQuickPick(step.options, {
							placeHolder: step.question,
						});
					} else {
						return vscode.window.showInputBox({
							prompt: step.question,
							value: step.default,
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
							executeCommand();
							return;
						}

						return instantiateQuestion(form[currentStep]);
					});
				};

				return instantiateQuestion(firstStep);
			} else {
				executeCommand();
			}
		});
	});

	const createCommand = vscode.commands.registerCommand('run-me.create', () => {
		vscode.window.showInformationMessage('Create');
	});

	context.subscriptions.push(runCommand);
	context.subscriptions.push(createCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
