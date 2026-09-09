import type { HttpContext } from '@adonisjs/core/http';

import User from '#models/user';
import UserTransformer from '#transformers/user_transformer';
import { loginValidator, registerValidator } from '#validators/user';

export default class AuthController {
  async register({ request, serialize }: HttpContext) {
    const { name, email, password } = await request.validateUsing(registerValidator);

    const user = await User.create({ name, email, password });
    const token = await User.accessTokens.create(user);

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    });
  }

  async login({ request, serialize }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator);

    const user = await User.verifyCredentials(email, password);
    const token = await User.accessTokens.create(user);

    return serialize({
      user: UserTransformer.transform(user),
      token: token.value!.release(),
    });
  }

  async logout({ auth }: HttpContext) {
    const user = auth.getUserOrFail();
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier);
    }

    return {
      message: 'Logged out successfully',
    };
  }

  async user({ auth, serialize }: HttpContext) {
    return serialize(UserTransformer.transform(auth.getUserOrFail()));
  }
}
