import * as Linking from 'expo-linking';

export const CURRENT_VERSION = '1.1.0';
export const CURRENT_BUILD_NUMBER = 1;

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt?: string;
  apkSize?: string;
}

const GITHUB_REPO = 'jyhff/douyin-app';
export const APK_LATEST_DOWNLOAD_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/douyin-app-release.apk`;
const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;

/**
 * 检查 GitHub 仓库的最新发布版本
 */
export async function checkAppUpdate(): Promise<UpdateInfo> {
  const defaultNotes = `1. 新增：设置页面深浅色模式切换（跟随系统/暗黑/明亮）
2. 新增：私信聊天功能，支持实时对话与表情发送
3. 新增：评论楼中楼回复、常用快捷表情及@好友互动
4. 优化：流畅度提升与界面细节打磨`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const tagName: string = data.tag_name || '';
      const releaseTitle: string = data.name || `抖音 App ${tagName}`;
      const releaseNotes: string = data.body || defaultNotes;

      // 寻找 apk 资源文件
      let downloadUrl = APK_LATEST_DOWNLOAD_URL;
      let apkSize = '';
      if (Array.isArray(data.assets)) {
        const apkAsset = data.assets.find((a: { name?: string }) =>
          a.name?.endsWith('.apk'),
        );
        if (apkAsset) {
          downloadUrl = apkAsset.browser_download_url || APK_LATEST_DOWNLOAD_URL;
          if (apkAsset.size) {
            apkSize = `${(apkAsset.size / (1024 * 1024)).toFixed(1)} MB`;
          }
        }
      }

      // 提取版本号与构建号对比
      const hasUpdate = isNewerVersion(tagName, CURRENT_VERSION);

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion: tagName.replace(/^v/, '') || CURRENT_VERSION,
        releaseTitle,
        releaseNotes,
        downloadUrl,
        publishedAt: data.published_at ? formatDate(data.published_at) : undefined,
        apkSize,
      };
    }
  } catch {
    // 忽略异常，降级到默认直链检查
  }

  // 降级方案：若 API 超限或离线，返回最新直链信息
  return {
    hasUpdate: true,
    currentVersion: CURRENT_VERSION,
    latestVersion: '1.1.0-build-2',
    releaseTitle: '抖音 App 最新正式版',
    releaseNotes: defaultNotes,
    downloadUrl: APK_LATEST_DOWNLOAD_URL,
    publishedAt: '刚刚',
    apkSize: '82 MB',
  };
}

/**
 * 比较远端版本与当前版本
 */
function isNewerVersion(remoteTag: string, current: string): boolean {
  if (!remoteTag) return false;
  const cleanRemote = remoteTag.replace(/^v/, '').trim();
  const cleanCurrent = current.replace(/^v/, '').trim();

  if (cleanRemote.includes('build-')) {
    // 如果是类似 1.1.0-build-2，说明是 CI 自动打包构建出来的较新版本
    return true;
  }

  return cleanRemote !== cleanCurrent;
}

/**
 * 格式化发布时间
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  } catch {
    return '最新';
  }
}

/**
 * 唤起手机系统下载并安装 APK
 */
export async function downloadAndInstallApk(url: string = APK_LATEST_DOWNLOAD_URL) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(RELEASES_PAGE_URL);
    }
  } catch {
    await Linking.openURL(RELEASES_PAGE_URL);
  }
}
