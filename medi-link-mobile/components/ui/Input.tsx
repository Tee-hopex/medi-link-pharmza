import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native'
import { useTheme } from '../../constants/theme'

interface InputProps {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: TextInputProps['keyboardType']
  autoCapitalize?: TextInputProps['autoCapitalize']
  error?: string
  autoFocus?: boolean
  returnKeyType?: TextInputProps['returnKeyType']
  onSubmitEditing?: () => void
  editable?: boolean
}

export function Input({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize = 'none', error,
  autoFocus, returnKeyType, onSubmitEditing, editable = true,
}: InputProps) {
  const { colors } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[
        styles.wrapper,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isFocused && { borderColor: colors.sage, backgroundColor: colors.background },
        !!error && { borderColor: colors.error },
        !editable && { opacity: 0.5 },
      ]}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.eyeText, { color: colors.textMuted }]}>
              {visible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 15, fontWeight: '500', letterSpacing: 0.2 },
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, height: 58,
  },
  input: { flex: 1, fontSize: 17 },
  eyeBtn: { paddingLeft: 12 },
  eyeText: { fontSize: 15, fontWeight: '500' },
  error: { fontSize: 13 },
})
