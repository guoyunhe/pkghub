import { BaseSchema } from '@adonisjs/lucid/schema';

export default class extends BaseSchema {
  protected tableName = 'images';

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');

      table.string('mime_type').notNullable();
      table.string('path').notNullable().unique();
      table.integer('size').unsigned().notNullable();
      table.smallint('width').unsigned().notNullable();
      table.smallint('height').unsigned().notNullable();

      table.timestamp('created_at').notNullable().defaultTo(this.now());
      table.timestamp('updated_at').nullable();
    });
  }

  async down() {
    this.schema.dropTable(this.tableName);
  }
}
