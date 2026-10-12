export const dict = {
  common: {
    appName: '{{name}}',
    loading: 'Loading',
    retry: 'Try again',
    empty: 'Nothing here yet',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
  },
  errors: {
    generic: 'Something went wrong. Try again.',
    network: 'No connection. Check the network and try again.',
    unauthorized: 'Sign in to continue.',
    forbidden: 'You have no access to this page.',
    notFound: 'Nothing was found.',
    validation: 'Check the highlighted fields.',
  },
  validation: {
    required: 'Required',
    invalid: 'Invalid value',
  },
  meta: {
    title: '{{name}}',
    description: '',
  },
  home: {
    title: '{{name}}',
    lead: 'The project is ready. Start with the first feature.',
  },
}

export type Dict = typeof dict
