import { Component } from '@angular/core';
import { ChatMessage } from '../models/chat-message.model';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss']
})
export class ConversationComponent {

  messages: ChatMessage[] = [];

  constructor(private chatService: ChatService) {}

  sendFeedback(message: ChatMessage, type: 'up' | 'down') {

    // update UI
    message.feedback = type;

    const payload = {
      messageId: message.id,
      threadId: message.threadId,
      resourceId: message.resourceId,
      feedback: type,
      timestamp: new Date()
    };

    this.chatService.sendFeedback(payload).subscribe({
      next: () => console.log('Feedback saved'),
      error: () => console.error('Feedback error')
    });

  }

}
