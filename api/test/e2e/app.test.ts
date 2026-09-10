import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from 'supertest/types.js';
import { AppModule } from '../../src/app.module.js';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('appController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    expect.assertions(0);

    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello Priya Sharma!');
  });
});
