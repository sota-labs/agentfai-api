import { ConsoleLogger } from '@nestjs/common';
import { Telegraf, TelegramError } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

type Options = {
  caption: string;
  parse_mode: 'HTML' | 'MarkdownV2';
  disable_web_page_preview: boolean;
  reply_markup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
};

enum TelegramErrorMessage {
  MESSAGE_NOT_MODIFIED = 'message is not modified',
}

export class TeleBotUtils {
  private readonly _telegraf: Telegraf;
  private readonly _logger: ConsoleLogger;
  constructor(private readonly token: string) {
    this._telegraf = new Telegraf(this.token);
    this._logger = new ConsoleLogger(TeleBotUtils.name);
  }

  private _getMedia(photo: Buffer | string) {
    let media;
    if (typeof photo === 'string') {
      media = photo;
    } else if (photo instanceof Buffer) {
      media = {
        source: photo,
      };
    }
    return media;
  }

  private _getOptions(caption: string, inlineKeyboard?: InlineKeyboardButton[][]): Options {
    const options: Options = {
      caption,
      parse_mode: 'HTML' as const,
      disable_web_page_preview: true,
    };
    if (inlineKeyboard) {
      options.reply_markup = {
        inline_keyboard: inlineKeyboard,
      };
    }
    return options;
  }

  private _handleError(error: any) {
    if (error instanceof TelegramError && error.message.includes(TelegramErrorMessage.MESSAGE_NOT_MODIFIED)) {
      this._logger.warn(`Call function editMessagePhoto to edit message but message is not modified. Skip...`);
      return;
    }
    this._logger.error(error);
  }

  async sendMessage(channelId: string, message: string, inlineKeyboard?: InlineKeyboardButton[][]): Promise<number> {
    try {
      const options = this._getOptions(message, inlineKeyboard);
      const sentMessage = await this._telegraf.telegram.sendMessage(channelId, message, options);
      return sentMessage.message_id;
    } catch (error) {
      this._handleError(error);
      throw error;
    }
  }

  async editMessage(channelId: string, messageId: number, message: string, inlineKeyboard?: InlineKeyboardButton[][]) {
    try {
      const options = this._getOptions(message, inlineKeyboard);
      await this._telegraf.telegram.editMessageText(channelId, messageId, undefined, message, options);
    } catch (error) {
      this._handleError(error);
    }
  }

  async pinMessage(channelId: string, messageId: number) {
    try {
      await this._telegraf.telegram.pinChatMessage(channelId, messageId);
    } catch (error) {
      this._handleError(error);
    }
  }

  async unpinMessage(channelId: string, messageId: number) {
    try {
      await this._telegraf.telegram.unpinChatMessage(channelId, messageId);
    } catch (error) {
      this._handleError(error);
    }
  }

  async sendPhoto(
    channelId: string,
    photo: Buffer | string,
    caption: string,
    inlineKeyboard?: InlineKeyboardButton[][],
  ): Promise<number> {
    try {
      const media = this._getMedia(photo);
      const options = this._getOptions(caption, inlineKeyboard);

      const sentMessage = await this._telegraf.telegram.sendPhoto(channelId, media, options);

      return sentMessage.message_id;
    } catch (error) {
      this._handleError(error);
    }
  }

  async editMessagePhoto(
    channelId: string,
    messageId: number,
    photo: Buffer | string,
    caption: string,
    inlineKeyboard?: InlineKeyboardButton[][],
  ) {
    try {
      const media = this._getMedia(photo);
      const options = this._getOptions(caption, inlineKeyboard);

      await this._telegraf.telegram.editMessageMedia(channelId, messageId, undefined, {
        type: 'photo',
        media,
        ...options,
      });
    } catch (error) {
      this._handleError(error);
    }
  }
}
