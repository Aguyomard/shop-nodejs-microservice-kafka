import { EventType } from '../index';

export interface IEventBus {
  publish(eventType: EventType, data: any): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
} 