import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
              <Text style={[styles.rowValue, { color: colors.textTertiary }]}>v1.0.0 (Build 57)</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Pressable
              style={styles.settingRowPressable}
              onPress={() => showToast('当前已是最新版本')}
              accessibilityRole="button"
            >
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>检查更新</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
