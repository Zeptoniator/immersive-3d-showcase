import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  // `configs.flat` expose la variante compatible avec la configuration à plat
  // d'ESLint 9+ (l'entrée de premier niveau reste au format historique).
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // React Fast Refresh : seuls les modules de composants doivent exporter des composants.
    files: ['src/**/*.tsx'],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    /**
     * Code de rendu impératif Three.js.
     *
     * `eslint-plugin-react-hooks` v7 embarque les règles du React Compiler.
     * Deux d'entre elles sont structurellement incompatibles avec React Three
     * Fiber et sont désactivées ici, uniquement sur ce périmètre :
     *
     * - `react-hooks/immutability` : la boucle `useFrame` s'exécute en dehors du
     *   rendu React et son rôle même est de muter la caméra, les uniformes et
     *   les transformations des objets. Recréer ces objets à chaque image
     *   annulerait tout le travail d'optimisation.
     * - `react-hooks/purity` : la génération du champ de particules repose sur
     *   `Math.random()` dans un `useMemo`, ce qui est voulu — la distribution
     *   doit être tirée une seule fois puis rester stable.
     *
     * Toutes les autres règles, dont `rules-of-hooks`, `exhaustive-deps`,
     * `set-state-in-effect` et `refs`, restent actives partout.
     */
    files: ['src/components/canvas/**/*.tsx', 'src/scenes/**/*.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    files: ['src/tests/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettier
)
