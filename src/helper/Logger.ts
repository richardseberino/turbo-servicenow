/**
 * This is a Logger class, which is being mocked for the purposes of unit testing.
 * We should be able to replace this with gs.info in the ServiceNow app.
**/
namespace x_turbo_turbonomic {
	export class Logger {

		private _console;
		constructor() {
			this._console = console;
		}

		info(output: string) {
			this._console.log("[INFO] " + output);
		}

		warn(output: string) {
			this._console.log("[WARN] " + output);
		}

		debug(output: string) {
			this._console.log("[DEBUG] " + output);
		}

		error(output: string) {
			this._console.log("[ERROR] " + output);
		}
	}
}