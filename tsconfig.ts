// ============================================
// backend/tsconfig.json
// Configuração TypeScript

export const tsconfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ES2020',
    lib: ['ES2020'],
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    outDir: './dist',
    rootDir: './src',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
  },
  include: ['src'],
  exclude: ['node_modules', 'dist'],
};

// ============================================
// backend/.gitignore

export const gitignore = `
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.*.local

# Database
data/
*.db
*.sqlite
*.sqlite3

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Build
dist/
build/
.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Prisma
prisma/migrations/
`;

// ============================================
// Tipos TypeScript

export interface CreateTicketInput {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  requesterName: string;
  requesterEmail: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
