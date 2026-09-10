# Contributing

## Local development accounts

The database seed creates these accounts for local development and testing only:

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| admin | `admin@example.com` | `Admin123!` |
| user  | `user@example.com`  | `User123!`  |

Do not use these credentials outside a local development environment. Run `node ace migration:fresh --seed` to recreate the database and seed the accounts.
