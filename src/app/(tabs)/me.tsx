import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../../components/ui/Avatar';
import { CURRENT_USER } from '../../data/creators';
import { MY_WORKS, VIDEOS } from '../../data/videos';
import type { Video } from '../../data/types';
import { formatCount } from '../../lib/format';
import { useTabBarHeight } from '../../lib/useTabBarHeight';
import { useAppStore } from '../../store/useAppStore';
import { colors } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { FILL } from '../../theme/styles';

type ProfileTab = 'works' | 'likes' | 'favorites';

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: 'works', label: '作品' },
  { key: 'likes', label: '喜欢' },
  { key: 'favorites', label: '收藏' },
];

/** 我 tab: profile header, stats, and a three-column grid of videos. */
export default function MeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState<ProfileTab>('works');

  // 用户个人资料状态
  const [profile, setProfile] = useState(CURRENT_USER);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(CURRENT_USER.name);
  const [editBio, setEditBio] = useState(CURRENT_USER.bio);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 1600);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      showToast('昵称不能为空');
      return;
    }
    setProfile((prev) => ({
      ...prev,
      name: editName.trim(),
      bio: editBio.trim() || '记录一下，随便拍拍 📷',
    }));
    setEditModalVisible(false);
    showToast('个人资料已保存');
  };

  const likedVideos = useAppStore((state) => state.likedVideos);
  const favoritedVideos = useAppStore((state) => state.favoritedVideos);
  const openComments = useAppStore((state) => state.openComments);

  const items = useMemo<Video[]>(() => {
    if (tab === 'likes') return VIDEOS.filter((video) => likedVideos[video.id]);
    if (tab === 'favorites') return VIDEOS.filter((video) => favoritedVideos[video.id]);
    return MY_WORKS;
  }, [tab, likedVideos, favoritedVideos]);

  const header = (
    <View>
      <LinearGradient
        colors={
          isDark
            ? ['#3A1C36', '#1B1520', colors.background]
            : ['#FDE7ED', '#F0EAF5', colors.background]
        }
        style={[styles.cover, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.coverActions}>
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="二维码"
            onPress={() => showToast('我的抖音码已生成')}
          >
            <Ionicons name="qr-code-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="设置"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.identity}>
          <Avatar source={profile.avatar} size={78} ring />
          <View style={styles.identityText}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.name}</Text>
              {profile.verified ? (
                <Ionicons name="checkmark-circle" size={15} color={colors.brandCyan} />
              ) : null}
            </View>
            <Text style={[styles.handle, { color: colors.textTertiary }]}>
              抖音号：{profile.handle}
            </Text>
          </View>
        </View>

        <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>

        <View style={styles.stats}>
          <Stat value={profile.stats.likes} label="获赞" colors={colors} />
          <Stat value={profile.stats.following} label="关注" colors={colors} />
          <Stat value={profile.stats.followers} label="粉丝" colors={colors} />
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button"
            onPress={() => {
              setEditName(profile.name);
              setEditBio(profile.bio);
              setEditModalVisible(true);
            }}
          >
            <Text style={[styles.primaryButtonText, { color: colors.textPrimary }]}>编辑资料</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button"
            accessibilityLabel="分享主页"
            onPress={() => showToast('个人主页链接已复制')}
          >
            <Ionicons name="link-outline" size={17} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { backgroundColor: colors.surfaceMuted }]}
            accessibilityRole="button"
            accessibilityLabel="更多"
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="ellipsis-horizontal" size={17} color={colors.textPrimary} />
          </Pressable>
        </View>
      </LinearGradient>

      <View style={[styles.tabs, { borderBottomColor: colors.divider }]}>
        {PROFILE_TABS.map((item) => {
          const active = item.key === tab;
          return (
            <Pressable
              key={item.key}
              onPress={() => setTab(item.key)}
              style={styles.tab}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? colors.textPrimary : colors.textTertiary },
                  active && styles.tabLabelActive,
                ]}
              >
                {item.label}
              </Text>
              {active ? (
                <View style={[styles.tabUnderline, { backgroundColor: colors.textPrimary }]} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {items.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textTertiary }]}>
          {tab === 'likes' ? '还没有喜欢的作品' : '还没有收藏的作品'}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={header}
        columnWrapperStyle={items.length > 0 ? styles.column : undefined}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.tile, { backgroundColor: colors.surface }]}
            onPress={() => openComments(item.id)}
            accessibilityRole="button"
            accessibilityLabel={item.caption}
          >
            <Image source={item.thumbnail} style={styles.tileImage} resizeMode="cover" />
            <View style={styles.tileStats}>
              <Ionicons name="play" size={10} color="#fff" />
              <Text style={styles.tileStatsText}>{formatCount(item.metrics.likes)}</Text>
            </View>
          </Pressable>
        )}
      />

      {/* 编辑个人资料弹窗 */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditModalVisible(false)} />
          <View
            style={[
              styles.editModalCard,
              {
                backgroundColor: isDark ? '#1C1C24' : '#FFFFFF',
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <View style={styles.editModalHeader}>
              <Pressable
                onPress={() => setEditModalVisible(false)}
                hitSlop={8}
                style={styles.editModalCancel}
              >
                <Text style={[styles.cancelText, { color: colors.textTertiary }]}>取消</Text>
              </Pressable>
              <Text style={[styles.editModalTitle, { color: colors.textPrimary }]}>编辑个人资料</Text>
              <Pressable
                onPress={handleSaveProfile}
                hitSlop={8}
                style={[styles.editModalSave, { backgroundColor: colors.brand }]}
              >
                <Text style={styles.saveBtnText}>保存</Text>
              </Pressable>
            </View>

            <View style={styles.editForm}>
              <View style={styles.editAvatarArea}>
                <Avatar source={profile.avatar} size={72} ring />
                <Text style={[styles.changeAvatarTip, { color: colors.brand }]}>点击更换头像</Text>
              </View>

              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>昵称</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.surfaceMuted,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  maxLength={20}
                  placeholder="请输入昵称"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.formItem}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>个性签名</Text>
                <TextInput
                  style={[
                    styles.formTextarea,
                    {
                      backgroundColor: colors.surfaceMuted,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={editBio}
                  onChangeText={setEditBio}
                  maxLength={60}
                  multiline
                  placeholder="填写有趣简洁的签名介绍自己吧"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 提示 Toast */}
      {toastMsg ? (
        <View style={styles.toastWrap} pointerEvents="none">
          <View style={styles.toastBox}>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Stat({
  value,
  label,
  colors,
}: {
  value: number;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{formatCount(value)}</Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cover: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  coverActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  identityText: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  handle: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  bio: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 28,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1,
    height: 38,
    borderRadius: 6,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  secondaryButton: {
    width: 42,
    height: 38,
    borderRadius: 6,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
  tabUnderline: {
    marginTop: 8,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textPrimary,
  },
  empty: {
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textTertiary,
  },
  column: {
    gap: 2,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  tile: {
    flex: 1 / 3,
    aspectRatio: 0.75,
    marginBottom: 2,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  tileImage: {
    ...FILL,
  },
  tileStats: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  tileStatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  editModalCard: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  editModalCancel: {
    padding: 6,
  },
  cancelText: {
    fontSize: 15,
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  editModalSave: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editForm: {
    paddingVertical: 18,
    gap: 16,
  },
  editAvatarArea: {
    alignItems: 'center',
    marginBottom: 8,
  },
  changeAvatarTip: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  formItem: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  formInput: {
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  formTextarea: {
    height: 76,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 110,
    alignItems: 'center',
  },
  toastBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
