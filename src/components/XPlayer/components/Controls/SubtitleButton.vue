<template>
	<div class="subtitle-button">
		<button
			ref="buttonRef"
			class="control-button"
			@click="toggleMenu"
			:title="'字幕'"
			alt="字幕"
		>
			<span class="material-symbols-rounded">subtitles</span>
		</button>
		<Menu
			v-model:visible="menuVisible"
			:triggerRef="buttonRef"
			placement="top"
			@update:visible="handleMenuVisibleChange"
		>
			<div
				class="menu-item"
				:class="{ active: subtitles.current.value === null }"
				@click="handleSubtitleSelect(null)"
			>
				关闭字幕
			</div>
			<div
				v-for="subtitle in rootProps.subtitles"
				:key="subtitle.url"
				class="menu-item"
				:class="{ active: subtitles.current.value?.url === subtitle.url }"
				@click="handleSubtitleSelect(subtitle)"
			>
				{{ subtitle.label }}
			</div>
		</Menu>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { usePlayerContext } from "../../hooks/usePlayer";
import type { Subtitle } from "../../types";
import Menu from "../Menu/index.vue";

const { rootProps, subtitles } = usePlayerContext();
const menuVisible = ref(false);
const buttonRef = ref<HTMLElement>();

const toggleMenu = () => {
	menuVisible.value = !menuVisible.value;
};

const handleMenuVisibleChange = (visible: boolean) => {
	menuVisible.value = visible;
};

const handleSubtitleSelect = (subtitle: Subtitle | null) => {
	menuVisible.value = false;
	subtitles.change(subtitle);
};
</script>

<style scoped>
.subtitle-button {
	position: relative;
	display: inline-block;
}

.control-button {
	background: none;
	border: none;
	color: #fff;
	cursor: pointer;
	padding: 8px;
	transition: all 0.2s;
}

.control-button:hover {
	opacity: 0.8;
}

.subtitle-icon {
	width: 24px;
	height: 24px;
}
</style> 