import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import prisma from './db';
import redis from './redis';
import { EmailJobData } from './queue';
import { sendEmail } from './emailService';
import { rateLimiter } from './rateLimiter';

dotenv.config();

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5');
const DELAY_BETWEEN_EMAILS = parseInt(process.env.DELAY_BETWEEN_EMAILS || '1000');

/**
 * Process individual email job
 * Handles rate limiting, delays, and idempotency
 */
async function processEmailJob(job: Job<EmailJobData>) {
  const { scheduledEmailId, userId, recipients, subject, body, delayBetweenEmails, hourlyLimit } = job.data;

  console.log(`📧 Processing email job ${job.id} for ${recipients.length} recipients`);

  try {
    // Update scheduled email status
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: 'PROCESSING' },
    });

    let successCount = 0;
    let failedCount = 0;
    let rateLimitedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      // Check for idempotency - skip if already sent
      const existingSent = await prisma.sentEmail.findFirst({
        where: {
          scheduledEmailId,
          recipient,
          status: 'SENT',
        },
      });

      if (existingSent) {
        console.log(`⏭️  Skipping ${recipient} - already sent`);
        continue;
      }

      // Check rate limit
      const canSend = await rateLimiter.canSendEmail(userId, hourlyLimit);
      
      if (!canSend) {
        console.log(`⏸️  Rate limit exceeded for user ${userId}. Delaying job...`);
        
        // Calculate delay until next hour
        const delayMs = rateLimiter.getTimeUntilReset();
        
        // Create or update pending entry
        await prisma.sentEmail.upsert({
          where: {
            scheduledEmailId_recipient: {
              scheduledEmailId,
              recipient,
            },
          },
          create: {
            scheduledEmailId,
            recipient,
            subject,
            body,
            status: 'PENDING',
          },
          update: {
            status: 'PENDING',
          },
        });
        
        rateLimitedCount++;
        
        // Re-queue remaining recipients for next hour
        if (i < recipients.length) {
          const remainingRecipients = recipients.slice(i);
          await job.updateData({
            ...job.data,
            recipients: remainingRecipients,
          });
          
          // Delay job to next hour window
          await job.moveToDelayed(Date.now() + delayMs, job.token!);
          console.log(`⏰ Job rescheduled for ${new Date(Date.now() + delayMs).toISOString()}`);
        }
        
        break; // Exit loop and reschedule
      }

      // Send email
      const result = await sendEmail({
        to: recipient,
        subject,
        body,
      });

      // Record sent email
      if (result.success) {
        await prisma.sentEmail.upsert({
          where: {
            scheduledEmailId_recipient: {
              scheduledEmailId,
              recipient,
            },
          },
          create: {
            scheduledEmailId,
            recipient,
            subject,
            body,
            status: 'SENT',
            sentAt: new Date(),
          },
          update: {
            status: 'SENT',
            sentAt: new Date(),
            error: null,
          },
        });
        successCount++;
      } else {
        await prisma.sentEmail.upsert({
          where: {
            scheduledEmailId_recipient: {
              scheduledEmailId,
              recipient,
            },
          },
          create: {
            scheduledEmailId,
            recipient,
            subject,
            body,
            status: 'FAILED',
            error: result.error,
          },
          update: {
            status: 'FAILED',
            error: result.error,
          },
        });
        failedCount++;
      }

      // Apply delay between emails (if not last recipient)
      if (i < recipients.length - 1) {
        const delay = delayBetweenEmails || DELAY_BETWEEN_EMAILS;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Update final status
    const allSent = await prisma.sentEmail.count({
      where: {
        scheduledEmailId,
        status: { in: ['SENT', 'FAILED'] },
      },
    });

    const totalRecipients = await prisma.sentEmail.count({
      where: { scheduledEmailId },
    });

    if (allSent === totalRecipients && rateLimitedCount === 0) {
      await prisma.scheduledEmail.update({
        where: { id: scheduledEmailId },
        data: { status: 'COMPLETED' },
      });
      console.log(`✅ Job completed: ${successCount} sent, ${failedCount} failed`);
    }

    return { successCount, failedCount, rateLimitedCount };
  } catch (error: any) {
    console.error(`❌ Error processing job ${job.id}:`, error);
    
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmailId },
      data: { status: 'FAILED' },
    });
    
    throw error;
  }
}

// Create worker
const worker = new Worker('email-queue', processEmailJob, {
  connection: redis,
  concurrency: WORKER_CONCURRENCY,
  limiter: {
    max: 10,
    duration: 1000,
  },
});

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

console.log(`🚀 Email worker started with concurrency: ${WORKER_CONCURRENCY}`);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down worker...');
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});
