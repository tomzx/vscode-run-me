# VS Code Run Me
Create and customize commands to be executed by answering a few questions.

## Getting started
1. Create a set of commands to execute.
2. Use `ctrl+shift+P` to invoke the Command Palette.
3. Type `Run Me: Run`.
4. Your list of commands will appear, you can then select the one to execute.
5. If your command has a form, the questions will be displayed.
6. The command will be executed.
7. You can bind a keyboard shortcut to the command. You can find it under `run-me.$your_command_identifier$`.

## Configuration
```json
{
	"run-me": {
		"commands": [
			{
				"identifier": "test",
				"description": "Test",
				"command": "echo $var1 $var2",
				"working_directory": "/tmp",
				"form": [
					{
						"variable": "$var1",
						"question": "What should $var1 be?",
						"default": "Hello world!"
					},
					{
						"variable": "$var2",
						"question": "What about $var2?",
						"options": [
							"Good day!",
							"Good evening!",
							"Good night!"
						]
					}
				]
			}
		]
	}
}
```

## License
The code is licensed under the [MIT license](http://choosealicense.com/licenses/mit/). See [LICENSE](LICENSE).
