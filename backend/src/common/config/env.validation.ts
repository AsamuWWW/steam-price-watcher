import * as Joi from 'joi';

export function validateEnv(config: Record<string, unknown>) {
  const schema = Joi.object({
    DATABASE_URL: Joi.string().default('file:./data/dev.db'),
    PORT: Joi.number().default(4000),
    CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
    STEAM_CC: Joi.string().default('cn'),
    STEAM_LANGUAGE: Joi.string().default('schinese'),
    DAILY_CRON: Joi.string().default('0 3 * * *'),
    THROTTLE_TTL: Joi.number().default(60000),
    THROTTLE_LIMIT: Joi.number().default(60),
  }).options({ allowUnknown: true });

  const { error, value } = schema.validate(config);
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  return value;
}
