import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same global pipes as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    describe('/api/auth/signup (POST)', () => {
      it('should create a new user', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signup')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user).not.toHaveProperty('password');
            authToken = res.body.token;
            userId = res.body.user.id;
          });
      });

      it('should fail with duplicate email', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signup')
          .send(testUser)
          .expect(409);
      });

      it('should fail with invalid email', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({
            ...testUser,
            email: 'invalid-email',
          })
          .expect(400);
      });

      it('should fail with short password', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({
            ...testUser,
            email: `another-${Date.now()}@example.com`,
            password: '12345',
          })
          .expect(400);
      });

      it('should fail with missing fields', () => {
        return request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(400);
      });
    });

    describe('/api/auth/login (POST)', () => {
      it('should login existing user', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user).not.toHaveProperty('password');
            authToken = res.body.token;
          });
      });

      it('should fail with wrong password', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
          .expect(401);
      });

      it('should fail with non-existent email', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: testUser.password,
          })
          .expect(401);
      });

      it('should fail with missing fields', () => {
        return request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
          })
          .expect(400);
      });
    });

    describe('/api/auth/verify (POST)', () => {
      it('should verify valid token', () => {
        return request(app.getHttpServer())
          .post('/api/auth/verify')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);
            expect(res.body.user).not.toHaveProperty('password');
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .post('/api/auth/verify')
          .expect(401);
      });

      it('should fail with invalid token', () => {
        return request(app.getHttpServer())
          .post('/api/auth/verify')
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(401);
      });

      it('should fail with malformed authorization header', () => {
        return request(app.getHttpServer())
          .post('/api/auth/verify')
          .set('Authorization', 'InvalidFormat')
          .expect(401);
      });
    });
  });

  describe('User Endpoints', () => {
    describe('/api/user/:id (GET)', () => {
      it('should get user by id with valid token', () => {
        return request(app.getHttpServer())
          .get(`/api/user/${userId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(userId);
            expect(res.body.email).toBe(testUser.email);
            expect(res.body).not.toHaveProperty('password');
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get(`/api/user/${userId}`)
          .expect(401);
      });

      it('should return 404 for non-existent user', () => {
        return request(app.getHttpServer())
          .get('/api/user/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('/api/user/email/:email (GET)', () => {
      it('should get user by email with valid token', () => {
        return request(app.getHttpServer())
          .get(`/api/user/email/${testUser.email}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.email).toBe(testUser.email);
            expect(res.body).not.toHaveProperty('password');
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get(`/api/user/email/${testUser.email}`)
          .expect(401);
      });

      it('should return 404 for non-existent email', () => {
        return request(app.getHttpServer())
          .get('/api/user/email/nonexistent@example.com')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('/api/user/:id (POST)', () => {
      it('should update user profile', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Updated',
            lastName: 'Name',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.firstName).toBe('Updated');
            expect(res.body.lastName).toBe('Name');
            expect(res.body.email).toBe(testUser.email);
            expect(res.body).not.toHaveProperty('password');
          });
      });

      it('should update only firstName', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'OnlyFirst',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.firstName).toBe('OnlyFirst');
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}`)
          .send({
            firstName: 'Test',
          })
          .expect(401);
      });

      it('should ignore email and password fields in update', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Test',
            email: 'newemail@example.com',
            password: 'newpassword',
          })
          .expect(400); // Should fail validation due to forbidNonWhitelisted
      });

      it('should return 404 for non-existent user', () => {
        return request(app.getHttpServer())
          .post('/api/user/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            firstName: 'Test',
          })
          .expect(404);
      });
    });

    describe('/api/user/:id/password (POST)', () => {
      it('should update password with correct current password', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}/password`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: testUser.password,
            newPassword: 'newPassword123',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.message).toBe('Password updated successfully');
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}/password`)
          .send({
            currentPassword: testUser.password,
            newPassword: 'newPassword123',
          })
          .expect(401);
      });

      it('should fail with incorrect current password', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}/password`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: 'wrongPassword',
            newPassword: 'newPassword123',
          })
          .expect(401);
      });

      it('should fail with missing fields', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}/password`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: testUser.password,
          })
          .expect(400);
      });

      it('should fail with short new password', () => {
        return request(app.getHttpServer())
          .post(`/api/user/${userId}/password`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: testUser.password,
            newPassword: '12345',
          })
          .expect(400);
      });

      it('should return 404 for non-existent user', () => {
        return request(app.getHttpServer())
          .post('/api/user/00000000-0000-0000-0000-000000000000/password')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            currentPassword: testUser.password,
            newPassword: 'newPassword123',
          })
          .expect(404);
      });
    });
  });
});
