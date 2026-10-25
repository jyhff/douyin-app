import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, TAB_BAR_HEIGHT } from '../../theme/tokens';

import { useTheme } from '../../theme/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabSpec {
  route: string;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}

const TAB_SPECS: TabSpec[] = [
  { route: 'index', label: '首页', icon: 'home-outline', activeIcon: 'home' },
  { route: 'friends', label: '朋友', icon: 'people-outline', activeIcon: 'people' },
  { route: 'inbox', label: '消息', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  { route: 'me', label: '我', icon: 'person-outline', activeIcon: 'person' },
];

/** The create button sits between 朋友 and 消息, as in the real app. */
const CREATE_SLOT_AFTER = 'friends';

const UNREAD_BADGES: Record<string, number> = { inbox: 7 };

/** Douyin's offset red/cyan square with a white plus on top. */
function CreateButton({ onPress, isDark }: { onPress: () => void; isDark: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.createWrapper,
        pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel="发布视频"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={[styles.createPlate, styles.createPlateCyan]} />
      <View style={[styles.createPlate, styles.createPlateRed]} />
      <View style={[styles.createPlate, isDark ? styles.createPlateWhite : styles.createPlateDark]}>
        <Ionicons name="add" size={22} color={isDark ? '#000' : '#fff'} />
      </View>
    </Pressable>
  );
}

/** Custom bottom bar: responsive theme chrome, text-only labels, centred create button. */
export function DouyinTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const activeRoute = state.routes[state.index]?.name;
  const isIndex = activeRoute === 'index';

  const barBg = isIndex || isDark ? 'rgba(0, 0, 0, 0.88)' : colors.tabBarBg;
  const activeTextColor = isIndex || isDark ? '#FFFFFF' : colors.tabBarActive;
  const inactiveTextColor = isIndex || isDark ? 'rgba(255, 255, 255, 0.55)' : colors.tabBarInactive;

  const renderTab = (spec: TabSpec) => {
    const routeIndex = state.routes.findIndex((route) => route.name === spec.route);
    if (routeIndex === -1) return null;

    const route = state.routes[routeIndex];
    const isFocused = activeRoute === spec.route;
    const badge = UNREAD_BADGES[spec.route];

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tab,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={spec.label}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.iconWrapper}>
          <Ionicons
            name={isFocused ? spec.activeIcon : spec.icon}
            size={22}
            color={isFocused ? activeTextColor : inactiveTextColor}
          />
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.label,
            { color: inactiveTextColor },
            isFocused && { color: activeTextColor, fontWeight: '700' },
          ]}
        >
          {spec.label}
        </Text>
      </Pressable>
    );
  };

  // Five equal-width slots; the create button occupies the middle one.
  const createIndex = TAB_SPECS.findIndex((spec) => spec.route === CREATE_SLOT_AFTER) + 1;
  const ordered: (TabSpec | 'create')[] = [
    ...TAB_SPECS.slice(0, createIndex),
    'create',
    ...TAB_SPECS.slice(createIndex),
  ];

  return (
    <View
      style={[
        styles.bar,
        {
          height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          backgroundColor: barBg,
          borderTopWidth: !isIndex && !isDark ? StyleSheet.hairlineWidth : 0,
          borderTopColor: colors.divider,
        },
      ]}
    >
      {ordered.map((item) =>
        item === 'create' ? (
          <View key="create" style={styles.slot}>
            <CreateButton
              onPress={() => router.push('/publish')}
              isDark={isIndex || isDark}
            />
          </View>
        ) : (
          <View key={item.route} style={styles.slot}>
            {renderTab(item)}
          </View>
        ),
      )}
    </View>
  );
}

const TAB_TOUCH_SIZE = 48;
const CREATE_SIZE = 30;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  /** Five equal-width slots across the bar. */
  slot: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    width: TAB_TOUCH_SIZE,
    height: TAB_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapper: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 1,
  },
  labelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  createWrapper: {
    width: TAB_TOUCH_SIZE,
    height: TAB_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPlate: {
    position: 'absolute',
    width: CREATE_SIZE,
    height: CREATE_SIZE * 0.78,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPlateCyan: {
    backgroundColor: colors.brandCyan,
    transform: [{ translateX: -3 }, { translateY: 0 }],
  },
  createPlateRed: {
    backgroundColor: colors.brand,
    transform: [{ translateX: 3 }, { translateY: 0 }],
  },
  createPlateWhite: {
    backgroundColor: '#FFFFFF',
  },
  createPlateDark: {
    backgroundColor: '#161823',
  },
});
