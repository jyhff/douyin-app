import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../theme/tokens';

export interface AvatarProps {
  source: ImageSourcePropType;
  size?: number;
  /** Draws the white ring used on the profile and follow buttons. */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
  /** 创作者/用户ID，若传入且未指定onPress，点击自动跳转对应个人主页 */
  creatorId?: string;
  /** 自定义点击事件 */
  onPress?: () => void;
  accessibilityLabel?: string;
}

/**
 * 统一跳转至用户主页或我的主页
 */
export function openUserProfile(
  router: ReturnType<typeof useRouter>,
  creatorId?: string,
) {
  if (!creatorId || creatorId === 'me') {
    router.push('/(tabs)/me');
  } else {
    router.push({
      pathname: '/user/[id]',
      params: { id: creatorId },
    });
  }
}

/** Circular avatar with an optional ring and tap-to-profile navigation. */
export function Avatar({
  source,
  size = 44,
  ring = false,
  style,
  creatorId,
  onPress,
  accessibilityLabel,
}: AvatarProps) {
  const router = useRouter();
  const ringWidth = ring ? 2 : 0;
  const outer = size + ringWidth * 2 + (ring ? 4 : 0);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (creatorId) {
      openUserProfile(router, creatorId);
    }
  };

  const isClickable = Boolean(onPress || creatorId);

  const content = (
    <View
      style={[
        styles.wrapper,
        { width: outer, height: outer, borderRadius: outer / 2 },
        ring && styles.ring,
        style,
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    </View>
  );

  if (isClickable) {
    return (
      <Pressable
        onPress={handlePress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || '用户头像'}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  ring: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
});
