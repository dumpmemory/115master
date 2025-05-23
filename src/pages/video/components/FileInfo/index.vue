<template>
    <!-- 文件名 -->
    <div :class="$style['header-file']" v-if="fileInfo.error">
        <div :class="$style['header-file-error']">
            <div>❌ 获取文件信息失败</div>
            <div>{{ fileInfo.error }}</div>
        </div>
    </div>
    <div :class="$style['header-file']" v-else-if="fileInfo.isLoading || (!fileInfo.isLoading && !fileInfo.isReady)">
        <Skeleton width="320px" height="28px" />
    </div>
    <div :class="$style['file-info-container']" v-else>
        <div :class="$style['header-file']">
            <span :class="$style['header-file-text']">
                {{ fileInfo.state?.file_name?.toUpperCase() }}
                <span :class="$style['header-file-text-size']">
                    {{ formatFileSize(Number(fileInfo.state?.file_size)) }}
                </span>
            </span>
        </div>
        <div :class="$style['action-bar']">
            <button 
                v-if="isMac" 
                :class="$style['action-bar__button']"
                @click="handleLocalPlay('iina')"
            >
                <img :class="$style['action-bar__button-icon']" :src="iinaIcon" alt="IINA" />
				<span>IINA</span>
			</button>
            <button :class="$style['action-bar__button']" @click="handleMark">
                <Icon :class="$style['action-bar__button-icon']" :svg="mark.isMark.value ? StarFillSvg : StarSvg" />
                <span>收藏</span>
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import StarFillSvg from "@material-symbols/svg-400/rounded/star-fill.svg?component";
import StarSvg from "@material-symbols/svg-400/rounded/star.svg?component";
import iinaIcon from "../../../../assets/icons/iina-icon.png";
import Icon from "../../../../components/Icon/index.vue";
import Skeleton from "../../../../components/Skeleton/index.vue";
import { formatFileSize } from "../../../../utils/format";
import { isMac } from "../../../../utils/platform";
import type { useDataFileInfo } from "../../data/useDataFileInfo";
import type { useMark } from "../../data/useDataMark";
import type { useDataPlaylist } from "../../data/useDataPlaylist";
const props = defineProps<{
	// 文件信息
	fileInfo: ReturnType<typeof useDataFileInfo>;
	// 星标
	mark: ReturnType<typeof useMark>;
	// 播放列表
	playlist: ReturnType<typeof useDataPlaylist>;
}>();

const emit = defineEmits<{
	localPlay: [LocalPlayer];
}>();

const handleLocalPlay = (player: LocalPlayer) => {
	emit("localPlay", player);
};

const handleMark = async () => {
	// 切换星标
	await props.mark.toggleMark();
	// 更新播放列表项星标
	props.playlist.updateItemMark(
		props.fileInfo.state.pick_code,
		!!props.mark.isMark.value,
	);
};
</script>

<style module>
.file-info-container {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 8px;
    content-visibility: auto;
}

.header-file {
	display: flex;
	gap: 8px;
	font-size: 20px;
    font-weight: bold;
    flex: 1;
}

.header-file-text {
	color: #f1f1f1;
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
}

.header-file-text-size {
	color: #999;
    font-size: 12px;
    margin-left: 8px;
    white-space: nowrap;
}

.action-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: 16px;
    flex-shrink: 0;
}

.action-bar__button {
    display: flex;
    align-items: center;
    gap: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: #f1f1f1;
    font-size: 14px;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-bar__button:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.action-bar__button-icon {
    width: 24px;
    height: 24px;
}
</style>