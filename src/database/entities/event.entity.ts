import { EventType } from '../../common/enums/event-type.enum';

export class Event {
  id: string;
  user_id: string | null;
  event_type: EventType;
  metadata: Record<string, any>;
  created_at: Date;
}
