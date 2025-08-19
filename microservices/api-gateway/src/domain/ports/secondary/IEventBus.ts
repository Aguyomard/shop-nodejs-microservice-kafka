import { EventType } from '../index';

export interface IEventBus {
  publish(eventType: EventType, data: any): Promise<void>;
  subscribe(eventType: EventType, handler: (data: any) => Promise<void>): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
} 