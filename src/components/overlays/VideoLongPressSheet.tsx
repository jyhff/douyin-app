import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnimatedValue } from '../../lib/useAnimatedValue';
import { colors } from '../../theme/tokens';

export const PLAYBACK_RATES = [0.75, 1.0, 1.25, 1.5, 2.0] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];

interface VideoLongPressSheetProps {
  visible: boolean;
  currentRate: PlaybackRate;
  onSelectRate: (rate: PlaybackRate) => void;
  onEnterCleanMode: () => void;
  onDislike: () => void;
  onSaveVideo: () => void;
  onCopyLink: () => void;
  onClose: () => void;
}

export function VideoLongPressSheet({
  visible,
  currentRate,
  onSelectRate,
  onEnterCleanMode,
  onDislike,
  onSaveVideo,
  onCopyLink,
  onClose,
}: VideoLongPressSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useAnimatedValue(300);

  useEffect(() => {
    if (visible) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // web fallback
      }
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: 'rgba(26, 26, 32, 0.96)',
              paddingBottom: Math.max(insets.bottom + 8, 20),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* 拖动指示条 */}
          <View style={styles.handleBar} />

          {/* 倍速调节区域 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>播放倍速</Text>
            <View style={styles.rateRow}>
              {PLAYBACK_RATES.map((rate) => {
                const active = currentRate === rate;
                return (
                  <Pressable
                    key={rate}
                    style={[
                      styles.ratePill,
                      active && styles.ratePillActive,
                      { backgroundColor: active ? colors.brand : 'rgba(255, 255, 255, 0.08)' },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {
                        // ignore
                      }
                      onSelectRate(rate);
                    }}
                  >
                    <Text
                      style={[
                        styles.rateText,
                        active && styles.rateTextActive,
                      ]}
                    >
                      {rate.toFixed(rate % 1 === 0 ? 0 : 2).replace(/\.00$/, '')}X
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 快捷操作宫格 */}
          <View style={styles.actionsGrid}>
            <Pressable
              style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.7 }]}
              onPress={() => {
                onClose();
                onEnterCleanMode();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="scan-outline" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>清屏播放</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.7 }]}
              onPress={() => {
                onClose();
                onDislike();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="heart-dislike-outline" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>不感兴趣</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.7 }]}
              onPress={() => {
                onClose();
                onSaveVideo();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="download-outline" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>保存本地</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.7 }]}
              onPress={() => {
                onClose();
                onCopyLink();
              }}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="link-outline" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.actionLabel}>复制链接</Text>
            </Pressable>
          </View>

          {/* 取消按钮 */}
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 10,
    marginLeft: 4,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  ratePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratePillActive: {},
  rateText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  rateTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 22,
    paddingTop: 4,
  },
  actionItem: {
    alignItems: 'center',
    width: 68,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
