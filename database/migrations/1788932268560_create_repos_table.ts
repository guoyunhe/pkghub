import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'repos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('type').notNullable().index()
      table.string('name').notNullable().unique()
      table.string('base_url').notNullable()
      table.string('key_url').nullable()
      table.string('key_fingerprint').nullable()
      table.text('repository_file').nullable()
      table.boolean('enabled').notNullable().defaultTo(true)
      table.integer('priority').unsigned().nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.schema.createTable('repo_targets', (table) => {
      table.increments('id')
      table
        .integer('repo_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('repos')
        .onDelete('CASCADE')
      table.string('distribution').notNullable().defaultTo('*')
      table.string('release').notNullable().defaultTo('*')
      table.string('architecture').notNullable().defaultTo('*')
      table.unique(['repo_id', 'distribution', 'release', 'architecture'])
      table.index(['distribution', 'release', 'architecture'])
    })
  }

  async down() {
    this.schema.dropTable('repo_targets')
    this.schema.dropTable(this.tableName)
  }
}
