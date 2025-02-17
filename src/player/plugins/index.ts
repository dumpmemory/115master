import type { Player } from "..";
import { AppLogger } from "../../utils/logger";

/**
 * 播放器插件基类
 * @description 播放器插件基类，所有插件必须继承此类
 */
export abstract class PlayerPlugin<State> {
	/**
	 * 日志
	 */
	logger: AppLogger | undefined;

	/**
	 * 状态
	 */
	state: State = {} as State;

	constructor(
		pluginName: string,
		protected player: Player,
		state: State,
	) {
		this.logger = new AppLogger(pluginName);
		this.logger?.log("初始化");
		this.state = state;
		this.player = player;
		this.mount();
		this.logger?.log("已挂载");
		this.onMounted?.();
	}

	/**
	 * 销毁插件
	 */
	abstract destroy(): void;

	/**
	 * 挂载插件
	 */
	abstract mount(): void;

	/**
	 * 挂载后事件
	 */
	onMounted?(): void;

	/**
	 * 状态变化前事件
	 */
	onBeforeStateChange?(): void;

	/**
	 * 状态变化事件
	 */
	onStateChange?(): void;

	/**
	 * 设置状态
	 * @param state 状态
	 */
	setState(state: State) {
		this.onBeforeStateChange?.();
		this.state = state;
		this.onStateChange?.();
	}

	/**
	 * 获取状态
	 * @returns 状态
	 */
	getState(): State | undefined {
		return this.state;
	}

	/**
	 * 注册控制栏按钮
	 * @param className 按钮类名
	 * @param buttonHTML 按钮HTML
	 * @param onClick 点击事件
	 */
	registerControlBarButton({
		className,
		buttonHTML,
		onClick,
	}: {
		className: string;
		buttonHTML: string;
		onClick?: () => void;
	}) {
		const controlBar = document.querySelector(".dplayer-controller")!;

		const button = document.createElement("div");
		button.className = `dplayer-icon ${className}`;
		button.innerHTML = buttonHTML;

		const right = controlBar.querySelector(".dplayer-icons-right");
		right?.insertBefore(button, right.firstChild);

		button.addEventListener("click", () => {
			onClick?.();
		});
	}
}
