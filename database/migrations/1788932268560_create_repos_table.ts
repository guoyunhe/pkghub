import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'repos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .integer('distro_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('distros')
        .onDelete('SET NULL')

      table.string('type').notNullable().index()
      table.string('name').notNullable().unique()

      table.string('base_url').notNullable()
      table.string('key_url').nullable()
      table.string('key_fingerprint').nullable()
      table.text('repository_file').nullable()
      table.boolean('enabled').notNullable().defaultTo(true)
      table.integer('priority').unsigned().nullable()

      // Synchronization interval in minutes; null means the repo is only synced manually.
      table.integer('sync_interval').unsigned().nullable()
      table.timestamp('last_synced_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
