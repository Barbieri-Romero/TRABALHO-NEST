// src/auth/auth.controller.spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { User } from '../user/entities/user.entity';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();

        userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    });

    afterAll(async () => {
        await userRepository.query('DELETE FROM users'); // Limpar usuários após os testes
        await app.close();
    });

    it('Deve registrar um novo usuário', async () => {
        return request(app.getHttpServer())
            .post('/users')
            .send({
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'password123',
            })
            .expect(201)
            .then((response) => {
                expect(response.body).toHaveProperty('id');
                expect(response.body).toHaveProperty('name', 'Test User');
                expect(response.body).toHaveProperty('email', 'testuser@example.com');
            });
    });

    it('Deve fazer login com sucesso', async () => {
        return request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'password123',
            })
            .expect(200)
            .then((response) => {
                expect(response.body).toHaveProperty('access_token');
            });
    });

    it('Deve bloquear acesso a rotas protegidas sem token', async () => {
        return request(app.getHttpServer())
            .get('/users')
            .expect(401); // Unauthorized
    });

    it('Deve acessar rotas protegidas com um token válido', async () => {
        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'password123',
            });

        const token = loginResponse.body.access_token;

        return request(app.getHttpServer())
            .get('/users')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .then((response) => {
                expect(Array.isArray(response.body)).toBe(true);
            });
    });
});
