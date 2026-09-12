import type { ColumnInfo, SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * Factory for JSON column rules. Returns a `ColumnInfo` with JSON serialize/deserialize decorators
 * and the given TS type.
 */
function jsonColumn(tsType: string): ColumnInfo {
  return {
    tsType,
    decorators: [
      {
        name: '@column',
        args: {
          prepare: (value: any) => (value ? JSON.stringify(value) : value),
          consume: (value: any) => (typeof value === 'string' ? JSON.parse(value) : value),
        },
      },
    ],
  }
}

/**
 * Shared rule for boolean columns stored as TINYINT(1) (e.g. MariaDB/MySQL).
 */
const booleanColumn: ColumnInfo = {
  tsType: 'boolean',
  decorators: [
    {
      name: '@column',
      args: {
        consume: (value: any) => Boolean(value),
      },
    },
  ],
}

export default {
  tables: {
    apps: {
      columns: {
        name: jsonColumn('Record<string, string>'),
        summary: jsonColumn('Record<string, string>'),
        description: jsonColumn('Record<string, string>'),
      },
    },
    categories: {
      columns: {
        name: jsonColumn('Record<string, string>'),
      },
    },
    distros: {
      columns: {
        arch: jsonColumn('string[]'),
      },
    },
  },
} satisfies SchemaRules
