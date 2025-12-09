import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    // Meta
    title: z.string(),
    description: z.string(),
    
    // SEO & LLM
    keywords: z.array(z.string()).default([]),
    topic: z.string().optional(),
    audience: z.string().optional(),
    
    // Dates
    datePublished: z.string(),
    dateModified: z.string(),
    
    // Author
    author: z.string().default('Steven Noack'),
    
    // Page specific
    draft: z.boolean().default(false),
  })
});

export const collections = { pages };
