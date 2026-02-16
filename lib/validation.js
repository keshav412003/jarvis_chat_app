import { z } from 'zod';

export const MessageSchema = z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Chat ID'),
    content: z.string().trim().min(1, 'Content is required').max(5000, 'Message too long'),
    type: z.enum(['text', 'image', 'video', 'audio', 'file']).default('text')
});

export const ChatCreateSchema = z.object({
    participantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Participant ID')
});

export const GroupCreateSchema = z.object({
    groupName: z.string().trim().min(1, 'Group name is required').max(100, 'Name too long'),
    participants: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1, 'At least one participant required'),
    groupAvatar: z.string().url().optional().or(z.literal(''))
});

export const MarkReadSchema = z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Chat ID')
});
