import { Queue } from 'bullmq';
import redis from './redis';

export const emailQueue = new Queue('email-queue', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 3600, // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      count: 5000,
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

export interface EmailJobData {
  scheduledEmailId: string;
  userId: string;
  recipients: string[];
  subject: string;
  body: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
}
