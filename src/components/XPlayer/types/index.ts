// 视频源
export interface VideoSource {
	// 名称
	name: string;
	// 地址
	url: string;
	// 海报
	poster?: string;
	// 类型
	type: "auto" | "hls" | "mp4"; // 明确定义支持的类型
	// 质量
	quality: number;
	// 显示的画质值（可选）
	displayQuality?: string | number;
	// hls 配置
	hlsConfig?: {
		autoStartLoad?: boolean;
		startPosition?: number;
		debug?: boolean;
		[key: string]: unknown;
	};
}

// 字幕
export interface Subtitle {
	// 字幕 id
	id: string;
	// 字幕 url
	url: string;
	// 字幕名称
	label: string;
	// 字幕语言
	srclang: string;
	// 字幕类型
	kind: "subtitles" | "captions";
	// 字幕默认
	default?: boolean;
}
