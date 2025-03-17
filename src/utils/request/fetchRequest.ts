import { IRequest, type RequestOptions, type ResponseType } from "./types";

const DEFAULT_OPTIONS: RequestOptions = {
	mode: "cors",
	credentials: "include",
	headers: {
		"Content-Type": "application/json",
	},
};

// Fetch
export class FetchRequest extends IRequest {
	options: RequestOptions = {};

	constructor(options: RequestOptions = {}) {
		super();
		this.options = {
			...DEFAULT_OPTIONS,
			...options,
		};
	}

	async request(
		url: string,
		_options: RequestOptions = {},
	): Promise<ResponseType> {
		const options = { ...this.options, ..._options };
		const urlRe = new URL(url);
		if (options.params) {
			Object.entries(options.params).forEach(([key, value]) => {
				urlRe.searchParams.set(key, value.toString());
			});
		}
		const requestUrl = urlRe.href;

		return fetch(requestUrl, {
			...options,
		});
	}

	get(url: string, options?: RequestOptions): Promise<ResponseType> {
		return this.request(url, { ...options, method: "GET" });
	}

	post(url: string, options?: RequestOptions): Promise<ResponseType> {
		return this.request(url, { ...options, method: "POST" });
	}
}

export const GMRequestInstance = new FetchRequest();
