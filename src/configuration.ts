export interface IConfiguration {
	commands: ICommandConfiguration[];
}

export interface ICommandConfiguration {
	description: string;
	command: string;
	working_directory: string;
	form?: IFormConfiguration[];
	show_in_console?: boolean;
}

export interface IFormConfiguration {
	variable: string;
	question: string;
	default?: string;
	options?: string[];
}