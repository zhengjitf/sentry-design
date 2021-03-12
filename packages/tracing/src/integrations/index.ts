import { Express } from './express';
import { Mongo } from './mongo';
import { Mysql } from './mysql';
import { Postgres } from './postgres';

export { instrumentMiddlewares } from './express';

export const Integrations = { Express, Postgres, Mysql, Mongo };
