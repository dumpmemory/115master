import { useStorage } from "@vueuse/core";

export const usePreferences = () => {
	const preferences = useStorage("x-player-preferences", {
		volume: 100,
		muted: true,
		playbackRate: 1,
		theatre: false,
		autoLoadThumbnails: true,
		superAutoBuffer: false,
	});

	return preferences;
};
