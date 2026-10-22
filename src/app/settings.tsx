import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  checkAppUpdate,
  CURRENT_BUILD_NUMBER,
  CURRENT_VERSION,
  downloadFullApkInApp,
  downloadIncrementalPatchInApp,
  installDownloadedUpdate,
  type DownloadProgress,
  type UpdateInfo,
  type UpdateType,
} from '../lib/updater';
import type { ThemeMode } from '../store/useAppStore';
import { useTheme } from '../theme/useTheme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, themeMode, setThemeMode, resolvedTheme } = useTheme();

  const [autoplay, setAutoplay] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);
  const [cacheSize, setCacheSize] = useState('38.6 MB');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // 应用内下载与增量热更状态
  const [updateMode, setUpdateMode] = useState<UpdateType>('incremental');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1800);
  };

  const handleClearCache = () => {
    if (cacheSize === '0 B') {
      showToast('缓存已经清理干净啦');
      return;
    }
    setCacheSize('0 B');
    showToast('缓存清理成功');
  };

  const handleCheckUpdate = async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    try {
      const info = await checkAppUpdate();
      if (info.hasUpdate) {
        setUpdateInfo(info);
        setIsDownloading(false);
        setDownloadProgress(null);
        setUpdateReady(false);
        setUpdateMode('incremental');
        setShowUpdateModal(true);
      } else {
        showToast(`当前已是最新版本 (v${CURRENT_VERSION})`);
      }
    } catch {
      showToast('检查更新失败，请稍后重试');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleStartInAppDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setUpdateReady(false);

    try {
      if (updateMode === 'incremental') {
        const success = await downloadIncrementalPatchInApp((prog) => {
          setDownloadProgress(prog);
        });
        if (success) {
          setUpdateReady(true);
        }
      } else {
        const success = await downloadFullApkInApp(
          updateInfo?.downloadUrl || '',
          (prog) => {
            setDownloadProgress(prog);
          },
        );
        if (success) {
          setUpdateReady(true);
        }
      }
    } catch {
      showToast('应用内下载中断，请稍后重试');
      setIsDownloading(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (updateMode === 'incremental') {
      showToast('⚡ 增量补丁已生效，版本已更新至最新！');
      setShowUpdateModal(false);
      setIsDownloading(false);
      setUpdateReady(false);
    } else {
      showToast('已唤起系统安装器');
      await installDownloadedUpdate('full', updateInfo?.downloadUrl);
      setShowUpdateModal(false);
    }
  };


  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* 顶部导航栏 */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>设置</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 外观模式区 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>外观与主题</Text>

          {/* 模式预览卡片网格 */}
          <View style={styles.themeCardsContainer}>
            {/* 跟随系统 */}
            <ThemePreviewCard
              title="跟随系统"
              mode="system"
              selected={themeMode === 'system'}
              onSelect={() => setThemeMode('system')}
              currentColors={colors}
              activeResolved={resolvedTheme}
              kind="system"
            />

            {/* 深色模式 */}
            <ThemePreviewCard
              title="深色模式"
              mode="dark"
              selected={themeMode === 'dark'}
              onSelect={() => setThemeMode('dark')}
              currentColors={colors}
              activeResolved={resolvedTheme}
              kind="dark"
            />

            {/* 浅色模式 */}
            <ThemePreviewCard
              title="浅色模式"
              mode="light"
              selected={themeMode === 'light'}
              onSelect={() => setThemeMode('light')}
              currentColors={colors}
              activeResolved={resolvedTheme}
              kind="light"
            />
          </View>

          {/* 详细选择列表项 */}
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <ThemeRowItem
              label="跟随系统外观"
              description="开启后将跟随当前系统设置自动切换浅色与深色模式"
              checked={themeMode === 'system'}
              onPress={() => setThemeMode('system')}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ThemeRowItem
              label="深色模式"
              description="纯黑沉浸式暗色调，适合夜间或暗光环境"
              checked={themeMode === 'dark'}
              onPress={() => setThemeMode('dark')}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ThemeRowItem
              label="浅色模式"
              description="清爽明亮白底设计，适合日间阅读"
              checked={themeMode === 'light'}
              onPress={() => setThemeMode('light')}
              colors={colors}
            />
          </View>
        </View>

        {/* 播放与通用设置 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>播放与体验</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  非 Wi-Fi 下自动播放
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  移动网络下自动播放视频内容
                </Text>
              </View>
              <Switch
                value={autoplay}
                onValueChange={setAutoplay}
                trackColor={{ false: colors.surfaceMuted, true: colors.brand }}
                thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                  默认高清画质
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textTertiary }]}>
                  根据网络速度自动优先加载高分辨率视频
                </Text>
              </View>
              <Switch
                value={hdVideo}
                onValueChange={setHdVideo}
                trackColor={{ false: colors.surfaceMuted, true: colors.brand }}
                thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
              />
            </View>
          </View>
        </View>

        {/* 存储与缓存 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>存储管理</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <Pressable
              style={styles.settingRowPressable}
              onPress={handleClearCache}
              accessibilityRole="button"
            >
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>清理缓存</Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: colors.textTertiary }]}>{cacheSize}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>关于与支持</Text>
          <View
            style={[
              styles.cardGroup,
              { backgroundColor: colors.surface, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>当前版本</Text>
              <Text style={[styles.rowValue, { color: colors.textTertiary }]}>
                v{CURRENT_VERSION} (Build {CURRENT_BUILD_NUMBER})
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Pressable
              style={styles.settingRowPressable}
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              accessibilityRole="button"
            >
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>检查更新</Text>
              <View style={styles.rowRight}>
                {checkingUpdate ? (
                  <>
                    <ActivityIndicator size="small" color={colors.brand} />
                    <Text style={[styles.rowValue, { color: colors.textTertiary, marginLeft: 6 }]}>
                      正在检查...
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.updateBadge, { backgroundColor: colors.brand }]}>
                      <Text style={styles.updateBadgeText}>NEW</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                  </>
                )}
              </View>
            </Pressable>
          </View>
        </View>

        {/* 退出登录/状态标识 */}
        <Pressable
          style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={() => showToast('已退出当前账号')}
          accessibilityRole="button"
        >
          <Text style={[styles.logoutText, { color: colors.brand }]}>退出登录</Text>
        </Pressable>
      </ScrollView>

      {/* 版本更新弹窗 */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* 弹窗头部图标与标题 */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: colors.brand + '15' }]}>
                <Ionicons
                  name={updateReady ? 'checkmark-circle' : isDownloading ? 'cloud-download' : 'sparkles'}
                  size={32}
                  color={updateReady ? '#52C41A' : colors.brand}
                />
              </View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {updateReady ? '新版本就绪' : isDownloading ? '正在应用内下载' : '发现新版本'}
              </Text>
              <View style={[styles.versionPill, { backgroundColor: colors.brand + '20' }]}>
                <Text style={[styles.versionPillText, { color: colors.brand }]}>
                  v{updateInfo?.latestVersion || '最新版'}
                </Text>
              </View>
            </View>

            {/* 增量热更新 vs 完整安装包模式选择栏 */}
            {!isDownloading && !updateReady ? (
              <View style={styles.modeSelectorWrap}>
                <Pressable
                  style={[
                    styles.modeOption,
                    updateMode === 'incremental' && [
                      styles.modeOptionActive,
                      { borderColor: colors.brand, backgroundColor: colors.brand + '10' },
                    ],
                  ]}
                  onPress={() => setUpdateMode('incremental')}
                >
                  <View style={styles.modeOptionHeader}>
                    <Ionicons
                      name="flash"
                      size={15}
                      color={updateMode === 'incremental' ? colors.brand : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.modeOptionTitle,
                        {
                          color: updateMode === 'incremental' ? colors.brand : colors.textPrimary,
                        },
                      ]}
                    >
                      增量热更新
                    </Text>
                    <View style={styles.recommendBadge}>
                      <Text style={styles.recommendBadgeText}>免重装</Text>
                    </View>
                  </View>
                  <Text style={[styles.modeOptionDesc, { color: colors.textTertiary }]}>
                    仅需 {updateInfo?.patchSize || '1.6 MB'}，应用内自动下载秒级生效
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modeOption,
                    updateMode === 'full' && [
                      styles.modeOptionActive,
                      { borderColor: colors.brand, backgroundColor: colors.brand + '10' },
                    ],
                  ]}
                  onPress={() => setUpdateMode('full')}
                >
                  <View style={styles.modeOptionHeader}>
                    <Ionicons
                      name="cube-outline"
                      size={15}
                      color={updateMode === 'full' ? colors.brand : colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.modeOptionTitle,
                        { color: updateMode === 'full' ? colors.brand : colors.textPrimary },
                      ]}
                    >
                      完整 APK 包
                    </Text>
                  </View>
                  <Text style={[styles.modeOptionDesc, { color: colors.textTertiary }]}>
                    大小约 {updateInfo?.apkSize || '82.0 MB'}，应用内自动下载
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* 下载中进度状态卡片 */}
            {isDownloading ? (
              <View
                style={[
                  styles.progressCard,
                  { backgroundColor: colors.surfaceMuted, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.progressRow}>
                  <Text style={[styles.progressStatusText, { color: colors.textPrimary }]}>
                    {downloadProgress?.status === 'verifying'
                      ? '正在校验补丁完整性...'
                      : updateReady
                      ? '下载完成！'
                      : updateMode === 'incremental'
                      ? '正在下载增量补丁...'
                      : '正在应用内下载 APK...'}
                  </Text>
                  <Text style={[styles.progressPercentText, { color: colors.brand }]}>
                    {downloadProgress?.percent || 0}%
                  </Text>
                </View>

                {/* 进度条轨道 */}
                <View style={[styles.progressBarTrack, { backgroundColor: colors.divider }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${downloadProgress?.percent || 0}%`,
                        backgroundColor: updateReady ? '#52C41A' : colors.brand,
                      },
                    ]}
                  />
                </View>

                <View style={styles.progressDetailRow}>
                  <Text style={[styles.progressDetailText, { color: colors.textTertiary }]}>
                    {downloadProgress?.downloadedText || '0 MB'} / {downloadProgress?.totalText || '1.6 MB'}
                  </Text>
                  <Text style={[styles.progressDetailText, { color: colors.textTertiary }]}>
                    应用内直接下载，无需跳转网页
                  </Text>
                </View>
              </View>
            ) : null}

            {/* 更新内容说明卡片（未在下载时展示） */}
            {!isDownloading && !updateReady ? (
              <View
                style={[
                  styles.notesContainer,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.notesHeader, { color: colors.textPrimary }]}>更新内容：</Text>
                <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={true}>
                  <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                    {updateInfo?.releaseNotes || '优化系统体验，修复已知问题并提升稳定性。'}
                  </Text>
                </ScrollView>
              </View>
            ) : null}

            {/* 底部按钮栏 */}
            <View style={styles.modalActions}>
              {!isDownloading || updateReady ? (
                <Pressable
                  style={[
                    styles.cancelBtn,
                    {
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.surfaceMuted,
                    },
                  ]}
                  onPress={() => setShowUpdateModal(false)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                    {updateReady ? '稍后体验' : '暂不更新'}
                  </Text>
                </Pressable>
              ) : null}

              {updateReady ? (
                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: '#52C41A' }]}
                  onPress={handleApplyUpdate}
                  accessibilityRole="button"
                >
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>
                    {updateMode === 'incremental' ? '⚡ 立即就地生效' : '🚀 立即安装'}
                  </Text>
                </Pressable>
              ) : isDownloading ? (
                <View
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: colors.brand, opacity: 0.85, flex: 1 },
                  ]}
                >
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmBtnText}>
                    下载中 ({downloadProgress?.percent || 0}%)...
                  </Text>
                </View>
              ) : (
                <Pressable
                  style={[styles.confirmBtn, { backgroundColor: colors.brand }]}
                  onPress={handleStartInAppDownload}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={updateMode === 'incremental' ? 'flash' : 'download-outline'}
                    size={17}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.confirmBtnText}>
                    {updateMode === 'incremental' ? '应用内极速增量更' : '应用内自动下载'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 提示 Toast */}
      {toastMessage ? (
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={styles.toastContent}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** 模式卡片预览展示组件 */
function ThemePreviewCard({
  title,
  mode,
  selected,
  onSelect,
  currentColors,
  activeResolved,
  kind,
}: {
  title: string;
  mode: ThemeMode;
  selected: boolean;
  onSelect: () => void;
  currentColors: ReturnType<typeof useTheme>['colors'];
  activeResolved: 'dark' | 'light';
  kind: 'system' | 'dark' | 'light';
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.themeCard,
        {
          backgroundColor: currentColors.surface,
          borderColor: selected ? currentColors.brand : currentColors.cardBorder,
          borderWidth: selected ? 2 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {/* 模拟手机外观屏幕预览 */}
      <View style={styles.previewScreenWrapper}>
        {kind === 'system' ? (
          <View style={styles.splitPreview}>
            <View style={[styles.splitHalf, { backgroundColor: '#F8F8F9' }]}>
              <View style={[styles.mockBar, { backgroundColor: '#FE2C55' }]} />
              <View style={[styles.mockLine, { backgroundColor: '#D0D0D5', width: '70%' }]} />
              <View style={[styles.mockLine, { backgroundColor: '#E2E2E6', width: '45%' }]} />
            </View>
            <View style={[styles.splitHalf, { backgroundColor: '#161823' }]}>
              <View style={[styles.mockBar, { backgroundColor: '#25F4EE' }]} />
              <View style={[styles.mockLine, { backgroundColor: '#404354', width: '70%' }]} />
              <View style={[styles.mockLine, { backgroundColor: '#2B2D3B', width: '45%' }]} />
            </View>
          </View>
        ) : kind === 'dark' ? (
          <View style={[styles.fullPreview, { backgroundColor: '#161823' }]}>
            <View style={[styles.mockBar, { backgroundColor: '#FE2C55' }]} />
            <View style={[styles.mockLine, { backgroundColor: '#404354', width: '75%' }]} />
            <View style={[styles.mockLine, { backgroundColor: '#2B2D3B', width: '50%' }]} />
            <View style={[styles.mockCard, { backgroundColor: '#22242F' }]} />
          </View>
        ) : (
          <View style={[styles.fullPreview, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.mockBar, { backgroundColor: '#FE2C55' }]} />
            <View style={[styles.mockLine, { backgroundColor: '#D0D0D5', width: '75%' }]} />
            <View style={[styles.mockLine, { backgroundColor: '#E8E8ED', width: '50%' }]} />
            <View style={[styles.mockCard, { backgroundColor: '#F1F1F3' }]} />
          </View>
        )}
      </View>

      <View style={styles.themeCardFooter}>
        <Text
          style={[
            styles.themeCardTitle,
            { color: selected ? currentColors.brand : currentColors.textPrimary },
            selected && { fontWeight: '700' },
          ]}
        >
          {title}
        </Text>
      </View>

      {selected ? (
        <View style={[styles.checkBadge, { backgroundColor: currentColors.brand }]}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

/** 模式行单选组件 */
function ThemeRowItem({
  label,
  description,
  checked,
  onPress,
  colors,
}: {
  label: string;
  description: string;
  checked: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      style={styles.themeRowItem}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked }}
    >
      <View style={styles.themeRowTextWrap}>
        <Text style={[styles.themeRowLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.themeRowDesc, { color: colors.textTertiary }]}>{description}</Text>
      </View>
      <View
        style={[
          styles.radioCircle,
          {
            borderColor: checked ? colors.brand : colors.textTertiary,
            backgroundColor: checked ? colors.brand : 'transparent',
          },
        ]}
      >
        {checked ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerRightPlaceholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  themeCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  themeCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 8,
    position: 'relative',
  },
  previewScreenWrapper: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  fullPreview: {
    flex: 1,
    padding: 8,
    gap: 6,
  },
  splitPreview: {
    flex: 1,
    flexDirection: 'row',
  },
  splitHalf: {
    flex: 1,
    padding: 6,
    gap: 5,
  },
  mockBar: {
    height: 4,
    width: '35%',
    borderRadius: 2,
    marginBottom: 2,
  },
  mockLine: {
    height: 4,
    borderRadius: 2,
  },
  mockCard: {
    marginTop: 'auto',
    height: 14,
    borderRadius: 4,
  },
  themeCardFooter: {
    marginTop: 8,
    alignItems: 'center',
  },
  themeCardTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGroup: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  themeRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  themeRowTextWrap: {
    flex: 1,
    paddingRight: 16,
    gap: 4,
  },
  themeRowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  themeRowDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingRowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 12,
    gap: 3,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  updateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  updateBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  versionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  notesContainer: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  notesHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesScroll: {
    maxHeight: 140,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modeSelectorWrap: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  modeOption: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
  },
  modeOptionActive: {
    borderWidth: 1.5,
  },
  modeOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modeOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recommendBadge: {
    backgroundColor: '#FF2C55',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  recommendBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modeOptionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressCard: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercentText: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDetailText: {
    fontSize: 11,
  },
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});


