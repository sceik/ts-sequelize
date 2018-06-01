'use strict';

import * as util from 'util';
import DataTypes from '../../../lib/data-types';
import Support from '../../support';
const expectsql = Support.expectsql;
const current   = Support.sequelize;
const sql       = current.dialect.QueryGenerator;

// Notice: [] will be replaced by dialect specific tick/quote character when there is not dialect specific expectation but only a default expectation

describe(Support.getTestDialectTeaser('SQL'), () => {
  describe('delete', () => {
    const User = current.define('test_user', {}, {
      timestamps: false,
      schema: 'public'
    });

    describe('truncate #4306', () => {
      const options = {
        table: User.getTableName(),
        where: {},
        truncate: true,
        cascade: true,
        limit: 10
      };

      it(util.inspect(options, {depth: 2}), () => {
        expectsql(
          sql.deleteQuery(
            options.table,
            options.where,
            options,
            User
          ), {
            postgres: 'TRUNCATE "public"."test_users" CASCADE',
            mssql: 'TRUNCATE TABLE [public].[test_users]',
            mysql: 'TRUNCATE `public.test_users`',
            oracle: 'TRUNCATE TABLE "public".test_users',
            sqlite: 'DELETE FROM `public.test_users`'
          }
        );
      });
    });

    describe('truncate with cascade and restartIdentity', () => {
      const options = {
        table: User.getTableName(),
        where: {},
        truncate: true,
        cascade: true,
        restartIdentity: true,
        limit: 10
      };

      it(util.inspect(options, {depth: 2}), () => {
        expectsql(
          sql.deleteQuery(
            options.table,
            options.where,
            options,
            User
          ), {
            postgres: 'TRUNCATE "public"."test_users" RESTART IDENTITY CASCADE',
            mssql: 'TRUNCATE TABLE [public].[test_users]',
            mysql: 'TRUNCATE `public.test_users`',
            oracle: 'TRUNCATE TABLE "public".test_users',
            sqlite: 'DELETE FROM `public.test_users`'
          }
        );
      });
    });

    describe('delete without limit', () => {
      const options = {
        table: User.getTableName(),
        where: {name: 'foo' },
        limit: null
      };

      it(util.inspect(options, {depth: 2}), () => {
        expectsql(
          sql.deleteQuery(
            options.table,
            options.where,
            options,
            User
          ), {
            default: "DELETE FROM [public.test_users] WHERE `name` = 'foo'",
            postgres: 'DELETE FROM "public"."test_users" WHERE "name" = \'foo\'',
            mssql: "DELETE FROM [public].[test_users] WHERE [name] = N'foo'; SELECT @@ROWCOUNT AS AFFECTEDROWS;",
            sqlite: "DELETE FROM `public.test_users` WHERE `name` = 'foo'",
            oracle: "DELETE FROM \"public\".test_users WHERE name = 'foo'"
          }
        );
      });
    });

    describe('delete with limit', () => {
      const options = {
        table: User.getTableName(),
        where: {name: "foo';DROP TABLE mySchema.myTable;"},
        limit: 10
      };

      it(util.inspect(options, {depth: 2}), () => {
        expectsql(
          sql.deleteQuery(
            options.table,
            options.where,
            options,
            User
          ), {
            postgres: 'DELETE FROM "public"."test_users" WHERE "id" IN (SELECT "id" FROM "public"."test_users" WHERE "name" = \'foo\'\';DROP TABLE mySchema.myTable;\' LIMIT 10)',
            sqlite: "DELETE FROM `public.test_users` WHERE rowid IN (SELECT rowid FROM `public.test_users` WHERE `name` = \'foo\'\';DROP TABLE mySchema.myTable;\' LIMIT 10)",
            mssql: "DELETE TOP(10) FROM [public].[test_users] WHERE [name] = N'foo'';DROP TABLE mySchema.myTable;'; SELECT @@ROWCOUNT AS AFFECTEDROWS;",
            default: "DELETE FROM [public.test_users] WHERE `name` = 'foo\\';DROP TABLE mySchema.myTable;' LIMIT 10",
            oracle: "DELETE FROM \"public\".test_users WHERE rowid IN (SELECT rowid FROM \"public\".test_users WHERE rownum <= 10 AND name = 'foo'';DROP TABLE mySchema.myTable;')"
          }
        );
      });
    });

    describe('delete with limit and without model', () => {
      const options = {
        table: User.getTableName(),
        where: {name: "foo';DROP TABLE mySchema.myTable;"},
        limit: 10
      };

      it(util.inspect(options, {depth: 2}), () => {
        let query;
        try {
          query = sql.deleteQuery(
            options.table,
            options.where,
            options,
            null
          );
        } catch (err) {
          query = err;
        }

        expectsql(
          query, {
            postgres: new Error('Cannot LIMIT delete without a model.'),
            sqlite: "DELETE FROM `public.test_users` WHERE rowid IN (SELECT rowid FROM `public.test_users` WHERE `name` = 'foo'';DROP TABLE mySchema.myTable;' LIMIT 10)",
            mssql: "DELETE TOP(10) FROM [public].[test_users] WHERE [name] = N'foo'';DROP TABLE mySchema.myTable;'; SELECT @@ROWCOUNT AS AFFECTEDROWS;",
            oracle: "DELETE FROM \"public\".test_users WHERE rowid IN (SELECT rowid FROM \"public\".test_users WHERE rownum <= 10 AND name = 'foo'';DROP TABLE mySchema.myTable;')",
            default: "DELETE FROM [public.test_users] WHERE `name` = 'foo\\';DROP TABLE mySchema.myTable;' LIMIT 10"
          }
        );
      });
    });

    describe('delete when the primary key has a different field name', () => {
      const _User = current.define('test_user', {
        id: {
          type: new DataTypes.STRING(),
          primaryKey: true,
          field: 'test_user_id'
        }
      }, {
        timestamps: false,
        schema: 'public'
      });

      const options = {
        table: 'test_user',
        where: { test_user_id: 100 }
      };

      it(util.inspect(options, {depth: 2}), () => {
        expectsql(
          sql.deleteQuery(
            options.table,
            options.where,
            options,
            _User
          ), {
            postgres: 'DELETE FROM "test_user" WHERE "test_user_id" IN (SELECT "test_user_id" FROM "test_user" WHERE "test_user_id" = 100 LIMIT 1)',
            sqlite: 'DELETE FROM `test_user` WHERE rowid IN (SELECT rowid FROM `test_user` WHERE `test_user_id` = 100 LIMIT 1)',
            oracle: 'DELETE FROM test_user WHERE test_user_id = 100',
            mssql: 'DELETE TOP(1) FROM [test_user] WHERE [test_user_id] = 100; SELECT @@ROWCOUNT AS AFFECTEDROWS;',
            default: 'DELETE FROM [test_user] WHERE [test_user_id] = 100 LIMIT 1'
          }
        );
      });
    });
  });
});