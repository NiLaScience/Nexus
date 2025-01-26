import { AnalyticsService } from './analytics.service';
import { ArticleService } from './article.service';
import { KnowledgeBaseService } from './knowledge-base.service';
import { NotificationService } from './notification.service';

export const analyticsService = new AnalyticsService();
export const articleService = new ArticleService();
export const knowledgeBaseService = new KnowledgeBaseService();
export const notificationService = new NotificationService(); 