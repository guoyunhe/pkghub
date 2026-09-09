import { args, BaseCommand } from '@adonisjs/core/ace';
import type { CommandOptions } from '@adonisjs/core/types/ace';
import chalk from 'chalk';

import User from '#models/user';

export default class UserRole extends BaseCommand {
  static commandName = 'user:role';
  static description = 'Change user role';

  static options: CommandOptions = {
    startApp: true,
  };

  @args.string({ description: 'User email' })
  declare email: string;

  @args.string({ description: 'User role' })
  declare role: string;

  async run() {
    const user = await User.findByOrFail('email', this.email);
    if (user.role !== this.role) {
      const oldRole = user.role;
      user.role = this.role;
      await user.save();
      this.logger.info(
        `changed role of user ${chalk.cyan(this.email)} from ${chalk.strikethrough(chalk.red(oldRole))} to ${chalk.green(this.role)}`,
      );
    } else {
      this.logger.info(`user ${chalk.cyan(this.email)} already has role ${chalk.green(this.role)}`);
    }
  }
}
