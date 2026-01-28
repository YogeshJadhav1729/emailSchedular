import { Router, Request, Response } from 'express';
import prisma from '../db';
import { emailQueue } from '../queue';

const router = Router();

/**
 * Schedule a new email batch
 * POST /api/emails/schedule
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { userId, subject, body, recipients, scheduledAt, delayBetweenEmails, hourlyLimit } = req.body;

    // Validation
    if (!userId || !subject || !body || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create scheduled email record
    const scheduledEmail = await prisma.scheduledEmail.create({
      data: {
        userId,
        subject,
        body,
        recipients,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        delayBetweenEmails: delayBetweenEmails || 0,
        hourlyLimit: hourlyLimit || parseInt(process.env.EMAILS_PER_HOUR || '100'),
        status: 'PENDING',
      },
    });

    // Create pending sent email records for tracking
    await prisma.sentEmail.createMany({
      data: recipients.map((recipient: string) => ({
        scheduledEmailId: scheduledEmail.id,
        recipient,
        subject,
        body,
        status: 'PENDING' as const,
      })),
    });

    // Calculate delay for BullMQ
    const delay = scheduledAt ? new Date(scheduledAt).getTime() - Date.now() : 0;

    // Add job to queue
    const job = await emailQueue.add(
      'send-emails',
      {
        scheduledEmailId: scheduledEmail.id,
        userId,
        recipients,
        subject,
        body,
        delayBetweenEmails: scheduledEmail.delayBetweenEmails,
        hourlyLimit: scheduledEmail.hourlyLimit,
      },
      {
        delay: Math.max(0, delay),
        jobId: scheduledEmail.id,
      }
    );

    // Update with job ID
    await prisma.scheduledEmail.update({
      where: { id: scheduledEmail.id },
      data: { jobId: job.id },
    });

    res.json({
      success: true,
      scheduledEmail: {
        id: scheduledEmail.id,
        jobId: job.id,
        recipientCount: recipients.length,
        scheduledAt: scheduledEmail.scheduledAt,
      },
    });
  } catch (error: any) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all scheduled emails for a user
 * GET /api/emails/scheduled/:userId
 */
router.get('/scheduled/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const scheduledEmails = await prisma.scheduledEmail.findMany({
      where: { userId },
      include: {
        _count: {
          select: { sentEmails: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json({ scheduledEmails });
  } catch (error: any) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all sent emails for a user
 * GET /api/emails/sent/:userId
 */
router.get('/sent/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const sentEmails = await prisma.sentEmail.findMany({
      where: {
        scheduledEmail: { userId },
      },
      include: {
        scheduledEmail: {
          select: {
            subject: true,
            userId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ sentEmails });
  } catch (error: any) {
    console.error('Error fetching sent emails:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get email statistics for a user
 * GET /api/emails/stats/:userId
 */
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [totalScheduled, totalSent, totalFailed, totalPending] = await Promise.all([
      prisma.scheduledEmail.count({ where: { userId } }),
      prisma.sentEmail.count({ where: { scheduledEmail: { userId }, status: 'SENT' } }),
      prisma.sentEmail.count({ where: { scheduledEmail: { userId }, status: 'FAILED' } }),
      prisma.sentEmail.count({ where: { scheduledEmail: { userId }, status: 'PENDING' } }),
    ]);

    res.json({
      totalScheduled,
      totalSent,
      totalFailed,
      totalPending,
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cancel a scheduled email
 * DELETE /api/emails/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const scheduledEmail = await prisma.scheduledEmail.findUnique({
      where: { id },
    });

    if (!scheduledEmail) {
      return res.status(404).json({ error: 'Scheduled email not found' });
    }

    // Remove job from queue if exists
    if (scheduledEmail.jobId) {
      const job = await emailQueue.getJob(scheduledEmail.jobId);
      if (job) {
        await job.remove();
      }
    }

    // Update status
    await prisma.scheduledEmail.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling email:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
