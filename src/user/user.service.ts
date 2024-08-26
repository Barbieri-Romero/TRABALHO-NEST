// src/user/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) { }

  async create(dto: CreateUserDto) {
    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.repository.create({ ...dto, password: hashedPassword });
    return this.repository.save(user);
  }

  findAll() {
    return this.repository.find();
  }

  findOne(id: number) {
    return this.repository.findOneBy({ id });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.repository.findOneBy({ email });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.repository.findOneBy({ id });
    if (!user) {
      return null;
    }
    this.repository.merge(user, dto);
    return this.repository.save(user);
  }

  async remove(id: number) {
    const user = await this.repository.findOneBy({ id });
    if (!user) {
      return null;
    }
    return this.repository.remove(user);
  }
}