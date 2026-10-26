import React, { useState, useCallback } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  LayoutChangeEvent,
} from 'react-native';

interface VideoScrubberProps {
  progress: Animated.Value;
  durationSeconds: number;
  bottomOffset: number;
  onSeek: (progress: number) => void;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const remSec = s % 60;
  return `${m.toString().padStart(2, '0')}:${remSec.toString().padStart(2, '0')}`;
}

export function VideoScrubber({
  progress,
  durationSeconds,
  bottomOffset,
  onSeek,
}: VideoScrubberProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(360);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTrackWidth(w);
  };

  const calculateProgress = useCallback((pageX: number) => {
    const width = trackWidth || 360;
    const clampedX = Math.max(0, Math.min(pageX, width));
    return clampedX / width;
  }, [trackWidth]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsScrubbing(true);
          const p = calculateProgress(evt.nativeEvent.pageX);
          setScrubProgress(p);
        },
        onPanResponderMove: (evt) => {
          const p = calculateProgress(evt.nativeEvent.pageX);
          setScrubProgress(p);
        },
        onPanResponderRelease: (evt) => {
          const p = calculateProgress(evt.nativeEvent.pageX);
          setIsScrubbing(false);
          onSeek(p);
        },
        onPanResponderTerminate: () => {
          setIsScrubbing(false);
        },
      }),
    [calculateProgress, onSeek],
  );

  const currentSeconds = isScrubbing
    ? scrubProgress * durationSeconds
    : 0;

  return (
    <View
      style={[styles.container, { bottom: bottomOffset }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* 拖动时上方悬浮时间提示胶囊 */}
      {isScrubbing ? (
        <View style={styles.bubble}>
          <Text style={styles.bubbleCurrent}>{formatTime(currentSeconds)}</Text>
          <Text style={styles.bubbleDivider}> / </Text>
          <Text style={styles.bubbleTotal}>{formatTime(durationSeconds)}</Text>
        </View>
      ) : null}

      {/* 进度底轨 */}
      <View style={[styles.track, isScrubbing && styles.trackScrubbing]}>
        <Animated.View
          style={[
            styles.fill,
            isScrubbing
              ? { width: `${scrubProgress * 100}%` }
              : {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
          ]}
        />
        {/* 拖动圆点 Thumb */}
        {isScrubbing ? (
          <View
            style={[
              styles.thumb,
              {
                left: `${Math.min(99, Math.max(1, scrubProgress * 100))}%`,
              },
            ]}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 24, // 扩大可触摸热区
    justifyContent: 'center',
    zIndex: 60,
  },
  track: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'visible',
  },
  trackScrubbing: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  fill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  thumb: {
    position: 'absolute',
    top: -4,
    marginLeft: -6.5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  bubble: {
    position: 'absolute',
    top: -46,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  bubbleCurrent: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bubbleDivider: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  bubbleTotal: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
});
