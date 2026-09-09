import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'apps';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      table.json('name').notNullable().defaultTo('{}');
      table.json('summary').notNullable().defaultTo('{}');

      table.string('version').nullable();
      table.string('license').nullable();

      table.string('appstream_id').nullable().unique();
      table.text('appstream_xml').nullable();
      table.string('appstream_url').nullable();

      table.text('desktop').nullable();

      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
