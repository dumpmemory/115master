<template>
	<div class="time-display">
		<span>{{ formatTime(progress.currentTime.value) }}</span>
		<span class="time-separator">/</span>
		<span>{{ formatTime(progress.duration.value) }}</span>
	</div>
</template>

<script setup lang="ts">
import { usePlayerContext } from "../../hooks/usePlayer";
import { formatTime } from "../../utils/time";
const { progress } = usePlayerContext();
</script>

<style scoped>
.time-display {
	color: #fff;
	font-size: 13px;
	display: flex;
	align-items: center;
	gap: 4px;
	user-select: none;
}

.time-separator {
	opacity: 0.7;
}
</style> 