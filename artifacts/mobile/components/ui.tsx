import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { initials, resolveAssetUrl } from '@/lib/utils';

export const palette = colors.dark;
export type IconName = React.ComponentProps<typeof Feather>['name'];

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom + 96, 120);

  if (!scroll) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={[styles.content, { paddingBottom }, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAwareScrollViewCompat
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom },
          contentStyle,
        ]}
      >
        {children}
      </KeyboardAwareScrollViewCompat>
    </SafeAreaView>
  );
}

export function PlainScreen({
  children,
  contentStyle,
}: PropsWithChildren<{ contentStyle?: StyleProp<ViewStyle> }>) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.flex, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.eyebrow}>Kino</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({
  icon,
  title,
  right,
}: {
  icon?: IconName;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      {icon ? <Feather name={icon} size={15} color={palette.mutedForeground} /> : null}
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.spacer} />
      {right}
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'danger' && styles.buttonDanger,
    variant === 'ghost' && styles.buttonGhost,
    disabled && styles.disabled,
    style,
  ];
  const textStyle = [
    styles.buttonText,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'danger' && styles.buttonTextDanger,
  ];

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [buttonStyle, pressed && styles.pressed]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? palette.primaryForeground : palette.foreground}
        />
      ) : icon ? (
        <Feather
          name={icon}
          size={16}
          color={variant === 'primary' ? palette.primaryForeground : palette.foreground}
        />
      ) : null}
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  active,
  danger,
}: {
  icon: IconName;
  onPress: () => void;
  label?: string;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        active && styles.iconButtonActive,
        danger && styles.iconButtonDanger,
        pressed && styles.pressed,
      ]}
    >
      <Feather
        name={icon}
        size={17}
        color={danger ? palette.destructive : active ? palette.primary : palette.foreground}
      />
    </Pressable>
  );
}

export function Field({
  label,
  icon,
  style,
  inputStyle,
  ...props
}: TextInputProps & {
  label?: string;
  icon?: IconName;
  inputStyle?: StyleProp<TextStyle>;
}) {
  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        {icon ? <Feather name={icon} size={16} color={palette.mutedForeground} /> : null}
        <TextInput
          placeholderTextColor={palette.mutedForeground}
          selectionColor={palette.primary}
          style={[styles.input, inputStyle]}
          {...props}
        />
      </View>
    </View>
  );
}

export function TextArea({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        multiline
        placeholderTextColor={palette.mutedForeground}
        selectionColor={palette.primary}
        style={[styles.inputWrap, styles.textArea]}
        {...props}
      />
    </View>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  compact,
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: IconName }>;
  onChange: (value: T) => void;
  compact?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.segmentContent}
      style={styles.segmentOuter}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              compact && styles.segmentCompact,
              active && styles.segmentActive,
              pressed && styles.pressed,
            ]}
          >
            {option.icon ? (
              <Feather
                name={option.icon}
                size={14}
                color={active ? palette.primaryForeground : palette.mutedForeground}
              />
            ) : null}
            <Text
              style={[
                styles.segmentText,
                active && styles.segmentTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={styles.stateWrap}>
      <ActivityIndicator color={palette.primary} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.stateWrap}>
      <View style={styles.stateIcon}>
        <Feather name={icon} size={28} color={palette.mutedForeground} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.stateText}>{body}</Text>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </View>
  );
}

export function Notice({
  type = 'info',
  message,
}: {
  type?: 'info' | 'error' | 'success';
  message: string;
}) {
  const color =
    type === 'error'
      ? palette.destructive
      : type === 'success'
        ? palette.success
        : palette.accent;
  return (
    <View style={[styles.notice, { borderColor: `${color}55` }]}>
      <Feather
        name={type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}
        size={15}
        color={color}
      />
      <Text style={styles.noticeText}>{message}</Text>
    </View>
  );
}

export function Poster({
  uri,
  title,
  style,
}: {
  uri?: string | null;
  title: string;
  style?: StyleProp<ViewStyle>;
}) {
  const source = resolveAssetUrl(uri);
  return (
    <View style={[styles.poster, style]}>
      {source ? (
        <Image
          source={{ uri: source }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
        />
      ) : (
        <View style={styles.posterPlaceholder}>
          <Feather name="film" size={24} color={palette.mutedForeground} />
          <Text numberOfLines={2} style={styles.posterPlaceholderText}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );
}

export function Avatar({
  uri,
  name,
  size = 44,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
}) {
  const source = resolveAssetUrl(uri);
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.avatarInitial, { fontSize: Math.max(12, size * 0.32) }]}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

export function Pill({ children }: PropsWithChildren) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{children}</Text>
    </View>
  );
}

export function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Feather name={icon} size={18} color={palette.mutedForeground} />
      <View style={styles.toggleText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: '#2f7d45', false: palette.input }}
        thumbColor={value ? palette.success : palette.mutedForeground}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: palette.primary,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 4,
  },
  title: {
    color: palette.foreground,
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0,
  },
  subtitle: {
    color: palette.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    fontFamily: 'Inter_400Regular',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: palette.foreground,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  spacer: {
    flex: 1,
  },
  button: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: palette.primary,
  },
  buttonSecondary: {
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  buttonDanger: {
    backgroundColor: '#2a1012',
    borderWidth: 1,
    borderColor: '#5d1e25',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    color: palette.foreground,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  buttonTextPrimary: {
    color: palette.primaryForeground,
  },
  buttonTextDanger: {
    color: palette.destructive,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  iconButtonActive: {
    backgroundColor: '#2c2612',
    borderColor: '#6f5c16',
  },
  iconButtonDanger: {
    backgroundColor: '#251013',
    borderColor: '#572027',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
  fieldLabel: {
    color: palette.mutedForeground,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: palette.foreground,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 12,
  },
  textArea: {
    color: palette.foreground,
    minHeight: 112,
    textAlignVertical: 'top',
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  segmentOuter: {
    flexGrow: 0,
  },
  segmentContent: {
    gap: 8,
    paddingRight: 4,
  },
  segment: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  segmentCompact: {
    minHeight: 34,
    paddingHorizontal: 11,
  },
  segmentActive: {
    backgroundColor: palette.foreground,
    borderColor: palette.foreground,
  },
  segmentText: {
    color: palette.mutedForeground,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  segmentTextActive: {
    color: palette.background,
  },
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    padding: 14,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 54,
    paddingHorizontal: 20,
    gap: 12,
  },
  stateIcon: {
    width: 62,
    height: 62,
    borderRadius: 8,
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: palette.foreground,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  stateText: {
    color: palette.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  stateAction: {
    marginTop: 4,
  },
  notice: {
    borderWidth: 1,
    backgroundColor: palette.secondary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeText: {
    color: palette.foreground,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter_500Medium',
  },
  poster: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: palette.poster,
    borderWidth: 1,
    borderColor: palette.border,
    aspectRatio: 2 / 3,
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
  },
  posterPlaceholderText: {
    color: palette.mutedForeground,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  avatar: {
    overflow: 'hidden',
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: palette.foreground,
    fontFamily: 'Inter_700Bold',
  },
  pill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: palette.secondary,
    borderWidth: 1,
    borderColor: palette.border,
  },
  pillText: {
    color: palette.mutedForeground,
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  toggleText: {
    flex: 1,
  },
  rowTitle: {
    color: palette.foreground,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  rowSubtitle: {
    color: palette.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
});
