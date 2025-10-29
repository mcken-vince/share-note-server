import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { Note } from './entities/note.entity';
import { NoteItem } from './entities/note-item.entity';

@Module({
  imports: [SequelizeModule.forFeature([Note, NoteItem])],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService, SequelizeModule],
})
export class NotesModule {}
