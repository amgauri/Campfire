export type TextModerationResult = {
  moderationStatus: 'safe' | 'review' | 'block';
  moderationCategory: string;
  confidence: number;
};

export interface TextModerationGateway {
  moderateText(text: string): Promise<TextModerationResult>;
}
