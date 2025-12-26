module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        node: true
    },
    extends: [
        'eslint:recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
    },
    plugins: ['@typescript-eslint', 'jsdoc'],
    rules: {
        // TypeScript specific
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        
        // General
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
        'no-unused-vars': 'off', // Use TypeScript version instead
        
        // JSDoc
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-param': 'warn',
        'jsdoc/require-returns': 'warn',
        'jsdoc/check-types': 'warn'
    },
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            extends: [
                'eslint:recommended',
                'plugin:@typescript-eslint/recommended'
            ],
            rules: {
                '@typescript-eslint/no-explicit-any': 'warn',
                '@typescript-eslint/explicit-module-boundary-types': 'off'
            }
        },
        {
            files: ['*.test.js', '*.test.ts'],
            env: {
                node: true
            },
            rules: {
                'no-console': 'off'
            }
        }
    ],
    ignorePatterns: [
        'dist/',
        'node_modules/',
        '*.config.js',
        'coverage/'
    ]
};

