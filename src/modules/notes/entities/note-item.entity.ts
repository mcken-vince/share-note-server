import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Note } from './note.entity';

/**
 * NoteItem Entity
 * Represents individual items in a checklist note
 */
@Table({
  tableName: 'note_items',
  timestamps: false,
  underscored: true,
})
export class NoteItem extends Model<NoteItem> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Note)
  @Column({
    type: DataType.UUID,
    allowNull: false,
    field: 'note_id',
  })
  noteId: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  checked: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  body: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  order: number;

  @BelongsTo(() => Note)
  note: Note;

  /**
   * Convert to plain object without sensitive data
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.noteId; // Remove foreign key from response
    return values;
  }
}
