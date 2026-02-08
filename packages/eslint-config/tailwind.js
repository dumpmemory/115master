import tailwind from 'eslint-plugin-tailwindcss'

/** tailwind 规则配置 */
export const tailwindConfig = [
  ...tailwind.configs['flat/recommended'],
  {
    settings: {
      tailwindcss: {
        // 必须配置这个 config 为 `{}`，否则无法执行。
        config: {},
      },
    },
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  },
]

export default tailwindConfig
