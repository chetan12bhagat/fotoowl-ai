import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  placeholder?: string;
  style?: ViewStyle;
  showFilterButton?: boolean;
  filterActive?: boolean;
  onFilterPress?: () => void;
  accessibilityLabel?: string;
  autoFocus?: boolean;
  showBrandMark?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSubmitEditing,
  placeholder = 'Search photo categories...',
  style,
  showFilterButton = false,
  filterActive = false,
  onFilterPress,
  accessibilityLabel,
  autoFocus = false,
  showBrandMark = true,
}) => {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Background and border styling matching FotoOwl.AI brand specifications
  const containerBg = isDark ? '#0B1C2A' : '#FFFFFF';
  const defaultBorder = isDark ? '#1C2F45' : '#E4E7EC';
  const activeBorder = '#FFB900';

  const iconColor = isFocused
    ? '#FFB900'
    : isDark
    ? '#8D9BAE'
    : '#98A2B3';

  return (
    <View style={[styles.outerWrapper, style]}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.container,
          {
            backgroundColor: containerBg,
            borderColor: isFocused ? activeBorder : defaultBorder,
          },
          isFocused && styles.containerFocused,
        ]}
      >
        {/* Subtle, Proportionate FotoOwl.AI Mini Brand Mark */}
        {showBrandMark && (
          <View style={styles.brandMarkWrapper} pointerEvents="none">
            <View style={styles.owlEmblemMini}>
              {/* Left Eye */}
              <View
                style={[
                  styles.owlMiniEye,
                  {
                    borderColor: isDark ? '#FFFFFF' : '#071421',
                    backgroundColor: isDark ? '#071421' : '#FFFFFF',
                  },
                ]}
              >
                <View
                  style={[
                    styles.owlMiniPupil,
                    { backgroundColor: isDark ? '#FFFFFF' : '#071421' },
                  ]}
                />
              </View>

              {/* Central Golden Beak */}
              <View style={styles.owlMiniBeak} />

              {/* Right Eye */}
              <View
                style={[
                  styles.owlMiniEye,
                  {
                    borderColor: '#FFB900',
                    backgroundColor: isDark ? '#071421' : '#FFFFFF',
                  },
                ]}
              >
                <View style={[styles.owlMiniPupil, { backgroundColor: '#FFB900' }]} />
              </View>
            </View>

            {/* Subtle Divider */}
            <View
              style={[
                styles.brandDivider,
                { backgroundColor: isDark ? '#1C2F45' : '#E4E7EC' },
              ]}
            />
          </View>
        )}

        {/* Left Search Icon - clickable to focus or submit */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {
            if (value.trim() && onSubmitEditing) {
              onSubmitEditing();
            } else {
              inputRef.current?.focus();
            }
          }}
          accessibilityLabel="Search"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="search" size={18} color={iconColor} />
        </TouchableOpacity>

        {/* Text Input with Adequate Space */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholderText}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
            },
            Platform.OS === 'web' && ({ outlineStyle: 'none', outline: 'none' } as any),
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          accessibilityRole="search"
          accessibilityLabel={accessibilityLabel || placeholder}
        />

        {/* Right Actions: Clear Button and/or Filter Control */}
        <View style={styles.rightActions}>
          {value.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                onChangeText('');
                inputRef.current?.focus();
              }}
              style={styles.actionButton}
              accessibilityLabel="Clear search input"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={isDark ? '#8D9BAE' : '#98A2B3'}
              />
            </TouchableOpacity>
          )}

          {showFilterButton && (
            <>
              {value.length > 0 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: isDark ? '#1C2F45' : '#E4E7EC' },
                  ]}
                />
              )}
              <TouchableOpacity
                onPress={onFilterPress}
                style={[
                  styles.filterButton,
                  filterActive && styles.filterButtonActive,
                ]}
                accessibilityLabel="Filter search results"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="options-outline"
                  size={18}
                  color={filterActive ? '#FFB900' : isDark ? '#8D9BAE' : '#667085'}
                />
                {filterActive && <View style={styles.activeFilterDot} />}
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54, // Touch-friendly height between 52–58px
    borderRadius: 27, // Rounded pill shape
    borderWidth: 1.2, // Subtle light-gray border in default state
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: 'text',
      } as any,
    }),
  },
  containerFocused: {
    shadowColor: '#FFB900',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  brandMarkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  owlEmblemMini: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginRight: 8,
  },
  owlMiniEye: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0.5,
  },
  owlMiniPupil: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  owlMiniBeak: {
    position: 'absolute',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -2,
    bottom: -1.5,
    width: 0,
    height: 0,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 3,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFB900',
    zIndex: 10,
  },
  brandDivider: {
    width: 1,
    height: 16,
    marginRight: 8,
  },
  iconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '400',
    height: '100%',
    paddingVertical: 0,
    letterSpacing: -0.1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 4,
  },
  actionButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 18,
    marginHorizontal: 4,
  },
  filterButton: {
    padding: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 185, 0, 0.12)',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFB900',
  },
});
