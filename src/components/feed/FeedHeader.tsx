import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore, type FeedTab } from '../../store/useAppStore';
import { colors } from '../../theme/tokens';

interface FeedHeaderProps {
  tab: FeedTab;
  onChangeTab: (tab: FeedTab) => void;
  muted?: boolean;
  onToggleMute?: () => void;
}

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'following', label: '关注' },
  { key: 'city', label: '同城' },
  { key: 'recommended', label: '推荐' },
];

const CITIES = ['北京', '上海', '成都', '深圳', '青岛', '大理'];

/** Floating header over the feed: 关注 / 同城 / 推荐 plus search. */
export function FeedHeader({ tab, onChangeTab }: FeedHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const selectedCity = useAppStore((state) => state.selectedCity);
  const setSelectedCity = useAppStore((state) => state.setSelectedCity);
  const [cityModalOpen, setCityModalOpen] = useState(false);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
      {/* 左侧区域：同城模式下展示城市选择 */}
      <View style={styles.leftArea}>
        {tab === 'city' ? (
          <Pressable
            style={styles.cityPickerBtn}
            onPress={() => setCityModalOpen(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`当前城市：${selectedCity}，点击切换`}
          >
            <Ionicons name="location-sharp" size={14} color="#FFFFFF" />
            <Text style={styles.cityName}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.7)" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = item.key === tab;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChangeTab(item.key)}
              hitSlop={8}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={styles.tab}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
              {active ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/search')}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="搜索"
        >
          <Ionicons name="search" size={24} color="#fff" style={styles.icon} />
        </Pressable>
      </View>

      {/* 城市选择 Modal */}
      <Modal
        visible={cityModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalOpen(false)}
      >
        <Pressable style={styles.modalBg} onPress={() => setCityModalOpen(false)}>
          <View style={[styles.modalCard, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.modalTitle}>切换同城地区</Text>
            <Text style={styles.modalSubtitle}>选择当前所在或关注的城市，查看身边的新鲜事</Text>

            <View style={styles.citiesGrid}>
              {CITIES.map((c) => {
                const isCur = c === selectedCity;
                return (
                  <Pressable
                    key={c}
                    style={[styles.cityChip, isCur && styles.cityChipActive]}
                    onPress={() => {
                      setSelectedCity(c);
                      setCityModalOpen(false);
                    }}
                  >
                    <Text style={[styles.cityChipText, isCur && styles.cityChipTextActive]}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 50,
  },
  leftArea: {
    flex: 1,
    justifyContent: 'center',
  },
  cityPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  cityName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  tab: {
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tabLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tabUnderline: {
    marginTop: 4,
    width: 22,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textPrimary,
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  icon: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-start',
  },
  modalCard: {
    backgroundColor: '#1E1E24',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 4,
    marginBottom: 16,
  },
  citiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cityChipActive: {
    backgroundColor: colors.brand,
  },
  cityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cityChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
