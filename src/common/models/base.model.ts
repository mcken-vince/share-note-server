import { Column, Model, DataType, BeforeCreate } from 'sequelize-typescript';

/**
 * BaseModel - Abstract base class for all models
 * Provides common fields: id, createdAt, modifiedAt, deletedAt
 * All models should extend this class
 */
export abstract class BaseModel<T> extends Model<T> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    allowNull: false,
  })
  id: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'modified_at',
  })
  modifiedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  deletedAt?: Date;

  /**
   * Hook to update modifiedAt timestamp before saving
   */
  @BeforeCreate
  static setTimestamps(instance: any) {
    const now = new Date();
    if (!instance.createdAt) {
      instance.createdAt = now;
    }
    instance.modifiedAt = now;
  }

  /**
   * Soft delete - sets deletedAt timestamp
   */
  async softDelete(): Promise<void> {
    this.deletedAt = new Date();
    await this.save();
  }

  /**
   * Restore soft deleted record
   */
  async restore(): Promise<void> {
    this.deletedAt = null;
    await this.save();
  }

  /**
   * Check if record is soft deleted
   */
  isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }
}
