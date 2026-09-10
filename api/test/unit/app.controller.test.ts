import { describe, expect, it, Mocked, vi } from 'vitest';
import { AppController } from '../../src/app.controller.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';

describe('appController (unit)', () => {
  const prismaServiceMock = {
    employee: {
      findFirst: vi.fn(),
    },
  } as unknown as Mocked<PrismaService>;
  const appController = new AppController(prismaServiceMock);

  describe('getHello', () => {
    it('should return the hello message from appService', async () => {
      expect.assertions(1);
      prismaServiceMock.employee.findFirst.mockResolvedValue({
        personName: 'Priya Sharma',
      });
      await expect(appController.getGreeting()).resolves.toBe(
        'Hello Priya Sharma!',
      );
    });
  });
});
