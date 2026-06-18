import { Image, useColorScheme } from 'react-native'

const logoLight = require('../../assets/logo-light.png')
const logoDark = require('../../assets/logo-dark.png')

interface LogoProps {
  size?: number
}

export function Logo({ size = 80 }: LogoProps) {
  const scheme = useColorScheme()
  const source = scheme === 'dark' ? logoDark : logoLight
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  )
}
