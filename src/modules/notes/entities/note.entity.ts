import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeUpdate,
} from 'sequelize-typescript';
import { BaseModel } from '../../../common/models/base.model';
import { User } from '../../users/entities/user.entity';
import { NoteItem } from './note-item.entity';

export enum NoteType {
  NOTE = 'note',
  CHECKLIST = 'checklist',
}

/**
 * Note Entity
 * Represents a note or checklist in the system
 * Extends BaseModel for id and timestamp management
 */
@Table({
  tableName: 'notes',
  timestamps: true,
  underscored: true,
  paranoid: true, // Enables soft delete with deletedAt
})
export class Note extends BaseModel<Note> {
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'user_id',
  })
  userId: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.ENUM(NoteType.NOTE, NoteType.CHECKLIST),
    allowNull: false,
    defaultValue: NoteType.NOTE,
  })
  type: NoteType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  body?: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: [],
  })
  tags: string[];

  // Relationships
  @BelongsTo(() => User)
  user: User;

  @HasMany(() => NoteItem, {
    onDelete: 'CASCADE',
    hooks: true,
  })
  items?: NoteItem[];

  /**
   * Hook to update modifiedAt timestamp before update
   */
  @BeforeUpdate
  static updateModifiedAt(instance: Note) {
    instance.modifiedAt = new Date();
  }

  /**
   * Validate note based on type
   */
  validateNoteType(): void {
    if (this.type === NoteType.NOTE && !this.body) {
      throw new Error('Note type requires a body');
    }
    if (this.type === NoteType.CHECKLIST && (!this.items || this.items.length === 0)) {
      throw new Error('Checklist type requires items');
    }
  }

  /**
   * Convert to plain object without sensitive data
   */
  toJSON() {
    const values: any = { ...this.get() };
    
    // Include items if loaded
    if (this.items) {
      values.items = this.items.map(item => {
        const itemData = item.toJSON();
        return {
          checked: itemData.checked,
          body: itemData.body,
          order: itemData.order,
        };
      });
    }

    // Don't expose userId in nested objects (keep it at top level)
    return values;
  }
}
