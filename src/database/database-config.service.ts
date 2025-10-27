import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

@Injectable()
export class DatabaseConfigService {
  constructor(private configService: ConfigService) {}

  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: parseInt(this.configService.get('DB_PORT', '5432'), 10),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', ''),
      database: this.configService.get('DB_NAME', 'share-note'),
      autoLoadModels: true,
      synchronize: this.configService.get('DB_SYNC', 'true') === 'true',
      logging: this.configService.get('NODE_ENV') === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
      },
    };
  }
}
