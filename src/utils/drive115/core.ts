import { GM_openInTab } from "$";
import {
	NORMAL_URL_115,
	PRO_API_URL_115,
	VOD_HOST_155,
	VOD_URL_115,
	WEB_API_URL_115,
} from "../../constants/115";
import { qualityCodeMap } from "../../constants/quality";
import type { M3u8Item } from "../../types/player";
import { AppLogger } from "../logger";
import { FetchRequest } from "../request/fetchRequest";
import type { IRequest } from "../request/types";
import type { NormalApi, ProApi, VodApi, WebApi } from "./api";
import { Crypto115 } from "./crypto";

export interface DownloadResult {
	url: {
		auth_cookie?: {
			expire: string;
			name: string;
			path: string;
			value: string;
		};
		url: string;
	};
}

// TODO: 超时登录错误 errNo 990001
// TODO: 验证账号弹窗被拦截 911
export class Drive115Core {
	private logger = new AppLogger("Drive115Core");

	private crypto115: Crypto115;
	private BASE_URL = NORMAL_URL_115;
	private WEB_API_URL = WEB_API_URL_115;
	private PRO_API_URL = PRO_API_URL_115;
	private VOD_URL_115 = VOD_URL_115;
	private verifying = false;
	fetchRequest: FetchRequest;

	constructor(protected iRequest: IRequest) {
		this.crypto115 = new Crypto115();
		this.fetchRequest = new FetchRequest();
	}

	private verifyVod(pickcode: string) {
		if (this.verifying) {
			return;
		}
		this.verifying = true;
		alert("你已经高频操作了!\n先去通过一下人机验证再回来刷新页面哦~");
		GM_openInTab(new URL(`?pickcode=${pickcode}`, this.VOD_URL_115).href, {
			active: true,
		});
	}

	async fakeVodAuthPickcode(pickcode: string) {
		await this.iRequest.get(
			new URL(`?pickcode=${pickcode}`, this.VOD_URL_115).href,
			{
				responseType: "document",
				redirect: "follow",
			},
		);
	}

	// 获取原文件地址 (小文件下载用)
	private async getDownloadUrlByNormal(
		pickcode: string,
	): Promise<DownloadResult> {
		const response = await this.fetchRequest.get(
			new URL(`/files/download?pickcode=${pickcode}`, this.WEB_API_URL).href,
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		);

		const res = (await response.json()) as WebApi.Res.FilesDownload;

		if (res.errNo === 990001) {
			alert("登录已过期，请重新登录");
		}

		if (!res.state || !res.file_url) {
			throw new Error(`服务器返回数据格式错误: ${JSON.stringify(res)}`);
		}

		return {
			url: {
				url: res.file_url,
			},
		};
	}

	// 获取原文件地址
	private async getDownloadUrlByPro(pickcode: string): Promise<DownloadResult> {
		const tm = Math.floor(Date.now() / 1000).toString();
		const src = JSON.stringify({ pickcode });
		const encoded = this.crypto115.m115_encode(src, tm);

		const data = `data=${encodeURIComponent(encoded.data)}`;
		this.logger.log("发送加密数据:", data);

		const response = await this.fetchRequest.post(
			new URL(`/app/chrome/downurl?t=${tm}`, this.PRO_API_URL).href,
			{
				body: data,
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			},
		);

		const res = (await response.json()) as ProApi.Res.FilesAppChromeDownurl;
		this.logger.log("Pro方式响应:", res);

		if (!res.state) {
			throw new Error(`获取下载地址失败: ${JSON.stringify(res)}`);
		}

		const result = JSON.parse(
			this.crypto115.m115_decode(res.data, encoded.key),
		);
		const downloadInfo = Object.values(result)[0] as DownloadResult;

		return downloadInfo;
	}

	// 获取原文件地址
	async getFileDownloadUrl(pickcode: string): Promise<DownloadResult> {
		try {
			return await this.getDownloadUrlByPro(pickcode);
		} catch (error) {
			console.warn("第一种获取下载链接失败，使用备用下载", error);
			const res = await this.getDownloadUrlByNormal(pickcode);
			return res;
		}
	}

	// 获取原文件地址
	async getOriginFileUrl(
		pickcode: string,
		fileId: string,
	): Promise<DownloadResult> {
		const response = await this.iRequest.get(
			new URL("/app/chrome/down", this.PRO_API_URL).href,
			{
				params: {
					method: "get_file_url",
					pickcode,
				},
			},
		);

		const res = (await response.json()) as WebApi.Res.FilesAppChromeDown;
		if (res.state) {
			return res.data[fileId];
		}
		throw new Error(`获取原文件地址失败: ${JSON.stringify(res)}`);
	}

	// 获取 m3u8 根 url
	private getM3u8RootUrl(pickcode: string): string {
		return new URL(`/api/video/m3u8/${pickcode}.m3u8`, this.BASE_URL).href;
	}

	// 解析 m3u8 列表
	private async parseM3u8Url(
		url: string,
		pickcode: string,
	): Promise<M3u8Item[]> {
		const response = await this.fetchRequest.get(url);

		const htmlText = await response.text();
		if (!/^#/.test(htmlText)) {
			const res = JSON.parse(htmlText) as NormalApi.Res.VideoM3u8;
			if (res.state === false) {
				if (res.code === 911) {
					this.verifyVod(pickcode);
				}
				throw new Error(`获取m3u8文件失败: ${res.error}`);
			}
		}
		const lines = htmlText.split("\n");
		const m3u8List: M3u8Item[] = [];

		htmlText.split("\n").forEach((line, index) => {
			if (line.includes('NAME="')) {
				const extXStreamInf = line.match(/#EXT-X-STREAM-INF/);
				if (extXStreamInf) {
					const name = line.match(/NAME="([^"]*)"/)?.[1] ?? "";
					const url = lines[index + 1]?.trim();
					m3u8List.push({
						name,
						quality:
							qualityCodeMap[name as unknown as keyof typeof qualityCodeMap],
						url,
					});
				}
			}
		});

		// 按照 UD HD BD 排序
		m3u8List.sort((a, b) => b.quality - a.quality);
		this.logger.log("m3u8List result", m3u8List);
		return m3u8List;
	}

	// 获取 m3u8 列表
	public async getM3u8(pickcode: string) {
		const url = this.getM3u8RootUrl(pickcode);
		const m3u8List = await this.parseM3u8Url(url, pickcode);
		return m3u8List;
	}

	// 获取播放列表
	private async apsNatsortFiles(params: VodApi.Req.VodApiFilesReq) {
		const response = await this.iRequest.get(
			new URL("/aps/natsort/files.php", this.VOD_URL_115).href,
			{
				params,
				headers: {
					host: VOD_HOST_155,
					referer: `${this.VOD_URL_115}/?pickcode=${params.pickcode}&share_id=0`,
				},
			},
		);
		return (await response.json()) as VodApi.Res.VodApiFiles;
	}

	// 获取播放列表
	private async webapiFiles(params: VodApi.Req.VodApiFilesReq) {
		const response = await this.iRequest.get(
			new URL("/webapi/files", this.VOD_URL_115).href,
			{
				params,
				headers: {
					referer: `${this.VOD_URL_115}/?pickcode=${params.pickcode}&share_id=0`,
					host: VOD_HOST_155,
				},
			},
		);

		return (await response.json()) as VodApi.Res.VodApiFiles;
	}

	// 获取播放列表
	public async getPlaylist(cid: string, pickcode: string, offset = 0) {
		const obj: VodApi.Req.VodApiFilesReq = {
			pickcode,
			aid: 1,
			cid: cid,
			offset: offset,
			limit: 115,
			show_dir: 0,
			nf: "",
			qid: 0,
			type: 4,
			source: "",
			format: "json",
			star: "",
			is_q: "",
			is_share: "",
			r_all: 1,
			o: "file_name",
			asc: 1,
			cur: 1,
			natsort: 1,
		};

		try {
			const response = await this.webapiFiles(obj);
			if (response.state) {
				return response.data;
			}
			throw new Error("webapiFiles 获取播放列表失败");
		} catch (error) {
			this.logger.log("获取webapiFiles失败，尝试使用apsNatsortFiles获取");
			const response = await this.apsNatsortFiles(obj);

			if (response.state) {
				return response.data;
			}
			throw new Error(`获取播放列表失败: ${JSON.stringify(response)}`);
		}
	}

	// 获取文件信息
	public async getFileInfo(params: WebApi.Req.FilesInfoReq) {
		const response = await this.iRequest.get(
			new URL("/webapi/files/video", this.VOD_URL_115).href,
			{
				params,
				headers: {
					referer: `${this.VOD_URL_115}/?pickcode=${params.pickcode}&share_id=0`,
					host: VOD_HOST_155,
				},
			},
		);

		return (await response.json()) as WebApi.Res.FilesInfo;
	}
}
