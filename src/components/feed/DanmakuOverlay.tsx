import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DanmakuItem } from '../../data/types';
import { USE_NATIVE_DRIVER } from '../../lib/animation';
import { useAnimatedValue } from '../../lib/useAnimatedValue';
import { colors } from '../../theme/tokens';

interface DanmakuOverlayProps {
  danmakus: DanmakuItem[];
  enabled: boolean;
  isActive: boolean;
  isInputModalVisible: boolean;
  onCloseInputModal: () => void;
  onSendDanmaku: (text: string, color?: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function SingleDanmakuRow({ item, index }: { item: DanmakuItem; index: number }) {
  const transX = useAnimatedValue(SCREEN_WIDTH + 30);
  const trackIndex = index % 3; // 3 行防重叠轨道

  useEffect(() => {
    // 延迟与错峰，给用户生动连续的观感
    const delay = (item.timeOffset ?? (index * 1.6)) * 1000;
    const duration = 6500 + (index % 3) * 600;

    let anim: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      transX.setValue(SCREEN_WIDTH + 20);
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(transX, {
            toValue: -SCREEN_WIDTH - 150,
            duration,
            easing: Easing.linear,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.delay(1000),
        ]),
      );
      anim.start();
    }, delay % 8000);

    return () => {
      clearTimeout(timer);
      if (anim) anim.stop();
    };
  }, [index, item, transX]);

  return (
    <Animated.View
      style={[
        styles.danmakuBubble,
        {
          top: 10 + trackIndex * 34,
          transform: [{ translateX: transX }],
          borderColor: item.isSelf ? colors.brand : 'transparent',
          borderWidth: item.isSelf ? 1 : 0,
        },
      ]}
      pointerEvents="none"
    >
      {item.isSelf ? <Text style={styles.selfTag}>我</Text> : null}
      <Text
        style={[
          styles.danmakuText,
          { color: item.color || '#FFFFFF' },
          item.isSelf && { fontWeight: '700' },
        ]}
      >
        {item.text}
      </Text>
    </Animated.View>
  );
}

export function DanmakuOverlay({
  danmakus,
  enabled,
  isActive,
  isInputModalVisible,
  onCloseInputModal,
  onSendDanmaku,
}: DanmakuOverlayProps) {
  const insets = useSafeAreaInsets();
  const [inputVal, setInputVal] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');

  const DANMAKU_COLORS = ['#FFFFFF', '#00F2FE', '#FF0055', '#FEEC00', '#FFA07A'];

  const handleSend = () => {
    if (!inputVal.trim()) return;
    onSendDanmaku(inputVal.trim(), selectedColor);
    setInputVal('');
    onCloseInputModal();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 弹幕轨道视图 */}
      {enabled && isActive ? (
        <View style={styles.trackArea} pointerEvents="none">
          {danmakus.map((item, idx) => (
            <SingleDanmakuRow key={item.id} item={item} index={idx} />
          ))}
        </View>
      ) : null}

      {/* 发送弹幕输入弹窗 */}
      <Modal
        visible={isInputModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onCloseInputModal}
      >
        <Pressable style={styles.modalBg} onPress={onCloseInputModal}>
          <View
            style={[styles.inputCard, { paddingBottom: insets.bottom + 16 }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.colorPalette}>
              {DANMAKU_COLORS.map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotSelected,
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { color: selectedColor }]}
                placeholder="发一条友善的弹幕~"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputVal}
                onChangeText={setInputVal}
                maxLength={40}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <Pressable
                style={[
                  styles.sendBtn,
                  inputVal.trim() ? styles.sendBtnActive : styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!inputVal.trim()}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 25,
  },
  trackArea: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 120,
    overflow: 'hidden',
  },
  danmakuBubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  selfTag: {
    fontSize: 10,
    color: '#FFFFFF',
    backgroundColor: colors.brand,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: '700',
  },
  danmakuText: {
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  inputCard: {
    backgroundColor: '#1E1E24',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    paddingLeft: 14,
    paddingRight: 6,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: colors.brand,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
