import { workspace } from "vscode";
import { strtr } from "./strtr";
import { IConfiguration } from "./configuration";

export class VariableManager {
	public getVariables(): { [id: string]: string } {
		const configuration = workspace.getConfiguration().get<IConfiguration>('run-me');

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

	public resolveVariables(text: string, variables: { [id: string]: string }) {
		return strtr(text, variables);
	}
}
