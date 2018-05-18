import * as child_process from "child_process";
import { workspace, window, OutputChannel } from "vscode";
import { IConfiguration, ICommandConfiguration, IFormConfiguration } from "./configuration";
import { VariableManager } from "./variable_manager";

export class CommandRunner {
	private outputChannel: OutputChannel;
	private variableManager: VariableManager;

	public constructor(variableManager: VariableManager) {
		this.variableManager = variableManager;

		this.outputChannel = window.createOutputChannel('Run Me');
	}

	public executeCommand(command: ICommandConfiguration) {
		const executeCommandInShell = () => {
			let builtCommand = command.command;

			builtCommand = this.variableManager.resolveVariables(builtCommand, variables);

			const options = {
				cwd: command.working_directory ? this.variableManager.resolveVariables(command.working_directory, variables) : undefined,
			};

			this.outputChannel.appendLine('Executing command: ' + builtCommand + ' with options ' + JSON.stringify(options));

			child_process.exec(builtCommand, options, (err, stdout, stderr) => {
				if (err) {
					console.error(err);
					return;
				}

				this.outputChannel.append(stdout);
			});
		};

		const variables: { [id: string]: string } = this.variableManager.getVariables();
		const form = command.form;
		if (form && form.length > 0) {
			let currentStep = 0;
			const firstStep = form[currentStep];

			const askQuestion = (step: IFormConfiguration) => {
				if (step.options) {
					return window.showQuickPick(step.options, {
						placeHolder: step.question,
						ignoreFocusOut: true,
					});
				} else {
					return window.showInputBox({
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
	}

	public runCommand() {
		const configuration = workspace.getConfiguration().get<IConfiguration>('run-me');

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

		window.showQuickPick(items, {
			placeHolder: 'Which command do you want to run?',
			ignoreFocusOut: true,
		}).then((value?: string) => {
			if (!value) {
				return;
			}

			const command = commands[value];

			this.executeCommand(command);
		});
	}
}
