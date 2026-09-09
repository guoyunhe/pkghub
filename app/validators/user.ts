import vine from '@vinejs/vine';

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254);
const password = () => vine.string().minLength(8).maxLength(32);

/**
 * Validator to use when performing self-register
 */
export const registerValidator = vine.create({
  name: vine.string().trim().maxLength(32),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: password().sameAs('password'),
});

/**
 * Validator to use before validating user credentials during login
 */
export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
});
